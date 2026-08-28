const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const alunoRepository = require('./aluno.repository');
const presencaRepository = require('../presencas/presenca.repository');
const alertaService = require('../alertas/alerta.service'); 
const auditService = require('../auditoria/audit.service'); 
const AppError = require('../../utils/AppError');
const prisma = require('../../database/client');
const pythonClient = require('../ia/python.client');
const { consolidarGrupos, calcularFrequencia } = require('../../domain/frequencia.rules');

class AlunoService {
  // Recebe o usuarioLogadoId para a auditoria
  async createAluno(data, usuarioLogadoId) {
    const alunoExistente = await alunoRepository.findByMatricula(data.matricula);
    if (alunoExistente) {
      throw new AppError('Já existe um aluno cadastrado com esta matrícula.', 400);
    }

    const { turmaId, ...dadosAluno } = data;

    if (turmaId) {
      const turma = await prisma.turma.findFirst({ where: { id: turmaId, ativo: true } });
      if (!turma) throw new AppError('A turma selecionada não existe ou está inativa.', 400);
    }

    const novoAluno = await prisma.$transaction(async (tx) => {
      const aluno = await tx.aluno.create({ data: dadosAluno });
      if (turmaId) {
        await tx.turmaAluno.create({
          data: { alunoId: aluno.id, turmaId, ativo: true }
        });
      }
      return aluno;
    });

    // Auditoria
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'CREATE',
      entidade: 'Aluno',
      entidadeId: novoAluno.id,
      dadosNovos: novoAluno
    });

    return this.buscarAlunoPorId(novoAluno.id);
  }

  async uploadFotoTreinamento(alunoId, file) {
    await this.buscarAlunoPorId(alunoId);
    if (!file?.buffer?.length) {
      throw new AppError('Arquivo de biometria vazio ou inválido.', 400);
    }

    // As fotos de treinamento ficam sob responsabilidade do serviço Python.
    // No PostgreSQL registramos somente que o cadastro facial foi concluído.
    return prisma.aluno.update({
      where: { id: alunoId },
      data: { fotoTreinamento: `facial://${alunoId}` }
    });
  }


  async gerarCodigoSegundoFator(alunoId, usuarioLogadoId) {
    const aluno = await this.buscarAlunoPorId(alunoId);
    const codigo = crypto.randomInt(100000, 1000000).toString();
    const codigoHash = await bcrypt.hash(codigo, 10);

    await prisma.biometricSecondFactor.upsert({
      where: { alunoId },
      update: { codigoHash, ativo: true },
      create: { alunoId, codigoHash, ativo: true },
    });

    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'UPDATE',
      entidade: 'BiometricSecondFactor',
      entidadeId: alunoId,
      dadosNovos: { alunoId, ativo: true },
    });

    return {
      alunoId,
      alunoNome: aluno.nome,
      codigo,
      aviso: 'O código é exibido apenas nesta resposta. Entregue-o somente ao aluno correto.',
    };
  }

  async desativarSegundoFator(alunoId, usuarioLogadoId) {
    await this.buscarAlunoPorId(alunoId);
    await prisma.biometricSecondFactor.updateMany({
      where: { alunoId },
      data: { ativo: false },
    });
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'UPDATE',
      entidade: 'BiometricSecondFactor',
      entidadeId: alunoId,
      dadosNovos: { alunoId, ativo: false },
    });
    return { alunoId, ativo: false };
  }

  async statusSegundoFator(alunoId) {
    await this.buscarAlunoPorId(alunoId);
    const registro = await prisma.biometricSecondFactor.findUnique({
      where: { alunoId },
      select: { ativo: true, atualizadoEm: true },
    });
    return {
      ativo: Boolean(registro?.ativo),
      atualizadoEm: registro?.atualizadoEm || null,
    };
  }

  async listarAlunos(pagina, limite, filtros = {}) {
    return alunoRepository.findAll(pagina, limite, filtros);
  }

  async matriculaExiste(matricula, ignorandoId = null) {
    return alunoRepository.checkMatricula(matricula, ignorandoId);
  }

  async buscarAlunoPorId(id) {
    const aluno = await alunoRepository.findById(id);
    if (!aluno || !aluno.ativo) {
      throw new AppError('Aluno não encontrado ou inativo no sistema.', 404);
    }
    return aluno;
  }

  async atualizarAluno(id, data, usuarioLogadoId) {
    const alunoAntigo = await this.buscarAlunoPorId(id);

    if (data.matricula) {
      const alunoExistente = await alunoRepository.findByMatricula(data.matricula);
      if (alunoExistente && alunoExistente.id !== id) {
        throw new AppError('Esta matrícula já está em uso por outro aluno.', 400);
      }
    }

    const { turmaId, ...dadosAluno } = data;

    if (turmaId) {
      const turma = await prisma.turma.findFirst({ where: { id: turmaId, ativo: true } });
      if (!turma) throw new AppError('A turma selecionada não existe ou está inativa.', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.aluno.update({ where: { id }, data: dadosAluno });

      if (turmaId) {
        await tx.turmaAluno.updateMany({
          where: { alunoId: id, turmaId: { not: turmaId }, ativo: true },
          data: { ativo: false }
        });
        await tx.turmaAluno.upsert({
          where: { alunoId_turmaId: { alunoId: id, turmaId } },
          update: { ativo: true },
          create: { alunoId: id, turmaId, ativo: true }
        });
      }
    });

    const alunoAtualizado = await this.buscarAlunoPorId(id);

    // Auditoria
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'UPDATE',
      entidade: 'Aluno',
      entidadeId: id,
      dadosAntigos: alunoAntigo,
      dadosNovos: alunoAtualizado
    });

    return alunoAtualizado;
  }

  async deletarAluno(id, usuarioLogadoId) {
    const alunoAntigo = await this.buscarAlunoPorId(id);
    const alunoDeletado = await alunoRepository.delete(id);

    // Auditoria
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'DELETE',
      entidade: 'Aluno',
      entidadeId: id,
      dadosAntigos: alunoAntigo
    });

    return alunoDeletado;
  }

  // -------------------------------------------------------------
  // 1. Cálculo Geral de Frequência (Atualizado com todos os status e Flag de Risco)
  // -------------------------------------------------------------
  async calcularFrequenciaPercentual(id, dataInicio, dataFim) {
    await this.buscarAlunoPorId(id);
    const contagem = await presencaRepository.countByStatusAndAluno(id, dataInicio, dataFim);

    const calculo = calcularFrequencia(consolidarGrupos(contagem));
    const presentes = calculo.contagens.PRESENTE;
    const ausentes = calculo.contagens.AUSENTE;
    const justificados = calculo.contagens.JUSTIFICADO;
    const atrasos = calculo.contagens.ATRASO;
    const saidasAntecipadas = calculo.contagens.SAIDA_ANTECIPADA;
    const totalAulasPrevistas = calculo.total;
    const frequenciaFinal = calculo.percentual;
    const statusRisco = calculo.statusRisco;
    // JUSTIFICADO continua sendo ausência justificada e faz parte do denominador.

    // O GATILHO DO ALERTA (Roda em background se houver amostragem suficiente)
    if (totalAulasPrevistas > 5) { 
      // CORREÇÃO: Usando 'null' em vez de 'GERAL' para respeitar o FK (UUID) da tabela Turma no PostgreSQL
      alertaService.checarEGerarAlerta(id, null, frequenciaFinal)
        .catch(err => console.error("Erro ao gerar alerta de evasão:", err.message));
    }

    return {
      alunoId: id,
      statusRisco,
      periodo: {
        inicio: dataInicio || 'Todo o histórico',
        fim: dataFim || 'Todo o histórico'
      },
      totalAulasPrevistas,
      detalhes: { presentes, ausentes, justificados, atrasos, saidasAntecipadas },
      frequenciaPercentual: frequenciaFinal
    };
  }

  // -------------------------------------------------------------
  // 2. CORRIGIDO (BO 6): Relatório de Frequência detalhado POR DISCIPLINA
  // -------------------------------------------------------------
  async calcularFrequenciaPorDisciplina(id, dataInicio, dataFim) {
    await this.buscarAlunoPorId(id);
    
    // Busca dados consolidados e agrupados do repositório
    const registros = await presencaRepository.countAgrupadoPorDisciplina(id, dataInicio, dataFim);
    const mapaDisciplinas = {};

    registros.forEach(item => {
      const discId = item.disciplinaId || 'SEM_DISCIPLINA';
      if (!mapaDisciplinas[discId]) {
        mapaDisciplinas[discId] = { presentes: 0, ausentes: 0, justificados: 0, atrasos: 0, saidasAntecipadas: 0 };
      }
      
      if (item.status === 'PRESENTE') mapaDisciplinas[discId].presentes = item._count._all;
      if (item.status === 'AUSENTE') mapaDisciplinas[discId].ausentes = item._count._all;
      if (item.status === 'JUSTIFICADO') mapaDisciplinas[discId].justificados = item._count._all;
      if (item.status === 'ATRASO') mapaDisciplinas[discId].atrasos = item._count._all;
      if (item.status === 'SAIDA_ANTECIPADA') mapaDisciplinas[discId].saidasAntecipadas = item._count._all;
    });

    const relatorioFinal = [];

    for (const [disciplinaId, dados] of Object.entries(mapaDisciplinas)) {
      const totalAulas = dados.presentes + dados.ausentes + dados.justificados + dados.atrasos + dados.saidasAntecipadas;
      const pct = totalAulas > 0 ? ((dados.presentes + dados.atrasos + dados.saidasAntecipadas) / totalAulas) * 100 : 100;
      
      let nomeDisciplina = 'Módulo Geral';
      if (disciplinaId !== 'SEM_DISCIPLINA') {
         const disciplina = await prisma.disciplina.findUnique({ where: { id: disciplinaId } });
         if (disciplina) nomeDisciplina = disciplina.nome;
      }

      relatorioFinal.push({
        disciplinaId,
        nomeDisciplina,
        totalAulasPrevistas: totalAulas,
        frequenciaPercentual: Number(pct.toFixed(2)),
        statusRisco: pct < 75.0 ? 'EM_RISCO' : 'REGULAR'
      });
    }

    return relatorioFinal;
  }

  // -------------------------------------------------------------
  // 3. O Direito ao Esquecimento (LGPD) - Exclui TUDO fisicamente do banco
  // -------------------------------------------------------------
  async exclusaoDefinitivaLGPD(id, usuarioLogadoId) {
    const aluno = await alunoRepository.findById(id);
    if (!aluno) throw new AppError('Aluno não encontrado.', 404);

    // Primeiro apaga os templates biométricos. Se a IA estiver indisponível,
    // abortamos para não deixar dado facial órfão após apagar o registro do PostgreSQL.
    await pythonClient.excluirBiometriaAluno(id);
    await prisma.aluno.delete({ where: { id } });

    // Registra na auditoria que os dados foram obliterados para provar conformidade
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'DELETE',
      entidade: 'Aluno_LGPD',
      entidadeId: id,
      dadosAntigos: { alunoId: id, matricula: aluno.matricula, mensagem: 'Exclusão definitiva solicitada e biometria removida do serviço Python.' }
    });

    return { message: 'Dados do aluno foram permanentemente apagados do sistema.' };
  }
}

module.exports = new AlunoService();