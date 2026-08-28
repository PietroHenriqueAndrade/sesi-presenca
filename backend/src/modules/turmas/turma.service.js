const turmaRepository = require('./turma.repository');
const auditService = require('../auditoria/audit.service'); // <-- Importamos o gravador
const presencaRepository = require('../presencas/presenca.repository');
const AppError = require('../../utils/AppError');
const prisma = require('../../database/client');
const { calcularFrequencia } = require('../../domain/frequencia.rules');

class TurmaService {
  // Adicionamos o usuarioLogadoId para saber quem fez a ação (vem lá do Controller / Token JWT)
  async createTurma(data, usuarioLogadoId) {
    const duplicada = await turmaRepository.findDuplicate(data);
    if (duplicada) throw new AppError('Já existe uma turma ativa com este nome, ano e turno.', 409);
    const novaTurma = await turmaRepository.create(data);

    // Grava na caixa-preta
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'CREATE',
      entidade: 'Turma',
      entidadeId: novaTurma.id,
      dadosNovos: novaTurma
    });

    return novaTurma;
  }

  async listarTurmas(busca) {
    return await turmaRepository.findAll(busca);
  }

  async buscarTurmaPorId(id) {
    const turma = await turmaRepository.findById(id);
    if (!turma || !turma.ativo) {
      throw new AppError('Turma não encontrada ou inativa.', 404);
    }
    return turma;
  }

  async listarAlunosDaTurma(id) {
    await this.buscarTurmaPorId(id);
    return await turmaRepository.findAlunosByTurmaId(id);
  }

  async atualizarTurma(id, data, usuarioLogadoId) {
    // Busca como era ANTES de alterar
    const turmaAntiga = await this.buscarTurmaPorId(id);
    
    const dadosFinais = { ...turmaAntiga, ...data };
    const duplicada = await turmaRepository.findDuplicate(dadosFinais, id);
    if (duplicada) throw new AppError('Já existe uma turma ativa com este nome, ano e turno.', 409);

    // Atualiza no banco
    const turmaAtualizada = await turmaRepository.update(id, data);

    // Grava o rastro na caixa-preta
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'UPDATE',
      entidade: 'Turma',
      entidadeId: id,
      dadosAntigos: turmaAntiga,
      dadosNovos: turmaAtualizada
    });

    return turmaAtualizada;
  }

  async deletarTurma(id, usuarioLogadoId) {
    // Busca para registrar o que está sendo apagado
    const turmaAntiga = await this.buscarTurmaPorId(id);
    const turmaDeletada = await turmaRepository.delete(id);

    // Grava o soft-delete na caixa-preta
    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'DELETE',
      entidade: 'Turma',
      entidadeId: id,
      dadosAntigos: turmaAntiga
    });

    return turmaDeletada;
  }

  // NOVO: Retorna a lista de todos os alunos da turma com suas respectivas frequências no período
  async relatorioConsolidadoFrequencia(turmaId, dataInicio, dataFim) {
    await this.buscarTurmaPorId(turmaId);
    
    // Busca o mapa de contagens de todos os alunos da turma de uma vez
    const registros = await presencaRepository.countConsolidadoPorTurma(turmaId, dataInicio, dataFim);
    // Busca os alunos matriculados para cruzar com os nomes
    const turmaComAlunos = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: { alunos: { where: { ativo: true }, include: { aluno: true } } }
    });

    const mapaAlunos = {};
    registros.forEach(item => {
      if (!mapaAlunos[item.alunoId]) {
        mapaAlunos[item.alunoId] = { presentes: 0, ausentes: 0, justificados: 0, atrasos: 0, saidasAntecipadas: 0 };
      }
      if (item.status === 'PRESENTE') mapaAlunos[item.alunoId].presentes = item._count._all;
      if (item.status === 'AUSENTE') mapaAlunos[item.alunoId].ausentes = item._count._all;
      if (item.status === 'JUSTIFICADO') mapaAlunos[item.alunoId].justificados = item._count._all;
      if (item.status === 'ATRASO') mapaAlunos[item.alunoId].atrasos = item._count._all;
      if (item.status === 'SAIDA_ANTECIPADA') mapaAlunos[item.alunoId].saidasAntecipadas = item._count._all;
    });

    const consolidado = turmaComAlunos.alunos
      .filter((vinculo) => vinculo.aluno.ativo)
      .map(vinculo => {
      const aluno = vinculo.aluno;
      const dados = mapaAlunos[aluno.id] || { presentes: 0, ausentes: 0, justificados: 0, atrasos: 0, saidasAntecipadas: 0 };
      
      const calculo = calcularFrequencia({
        PRESENTE: dados.presentes,
        AUSENTE: dados.ausentes,
        JUSTIFICADO: dados.justificados,
        ATRASO: dados.atrasos,
        SAIDA_ANTECIPADA: dados.saidasAntecipadas,
      });

      return {
        alunoId: aluno.id,
        nome: aluno.nome,
        matricula: aluno.matricula,
        totalAulasNoPeriodo: calculo.total,
        frequenciaPercentual: calculo.percentual,
        statusRisco: calculo.statusRisco
      };
    });

    return consolidado;
  }
}

module.exports = new TurmaService();