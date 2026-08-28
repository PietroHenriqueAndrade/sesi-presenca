const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const alunoService = require('../alunos/aluno.service');
const horarioService = require('../horarios/horario.service');
const presencaRepository = require('../presencas/presenca.repository');
const AppError = require('../../utils/AppError');
const DateHelpers = require('../../utils/dateHelpers');
const prisma = require('../../database/client');
const authConfig = require('../../config/auth.config');
const auditService = require('../auditoria/audit.service');

const configuredThreshold = Number(process.env.IA_MIN_CONFIDENCE_SCORE ?? '0.70');
const THRESHOLD_CONFIANCA_IA = Number.isFinite(configuredThreshold)
  ? Math.max(0, Math.min(1, configuredThreshold))
  : 0.70;
const ROLES_CADASTRO = new Set(['ADMIN', 'SECRETARIA']);

class IaService {
  async criarSessaoCadastro({ usuarioId, role, alunoId, senha }) {
    if (!ROLES_CADASTRO.has(role)) throw new AppError('Seu perfil não pode cadastrar biometria.', 403);

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senha))) {
      throw new AppError('Confirmação de senha inválida.', 401);
    }

    const aluno = await alunoService.buscarAlunoPorId(alunoId);
    const vinculo = aluno.turmas?.find((item) => item.ativo && item.turma?.ativo);
    if (!vinculo?.turma) throw new AppError('O aluno precisa estar vinculado a uma turma ativa.', 422);

    const token = jwt.sign({
      tipo: 'biometric_enrollment',
      usuarioId,
      alunoId: aluno.id,
      turmaId: vinculo.turma.id,
      jti: crypto.randomUUID(),
    }, authConfig.secret, { expiresIn: '5m' });

    await auditService.registrarLog({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'BiometricEnrollmentSession',
      entidadeId: aluno.id,
      dadosNovos: { alunoId: aluno.id, turmaId: vinculo.turma.id, expiraEmMinutos: 5 },
    });

    return {
      enrollmentToken: token,
      expiresInSeconds: 300,
      aluno: { id: aluno.id, nome: aluno.nome, matricula: aluno.matricula },
      turma: { id: vinculo.turma.id, nome: vinculo.turma.nome },
    };
  }

  async validarSessaoCadastro(token) {
    let payload;
    try {
      payload = jwt.verify(token, authConfig.secret);
    } catch (_) {
      throw new AppError('Sessão de cadastro biométrico inválida ou expirada.', 401);
    }
    if (payload.tipo !== 'biometric_enrollment') throw new AppError('Tipo de autorização biométrica inválido.', 401);

    const [usuario, aluno, vinculo] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: payload.usuarioId }, select: { id: true, role: true, ativo: true } }),
      prisma.aluno.findUnique({ where: { id: payload.alunoId }, select: { id: true, nome: true, matricula: true, ativo: true } }),
      prisma.turmaAluno.findUnique({
        where: { alunoId_turmaId: { alunoId: payload.alunoId, turmaId: payload.turmaId } },
        include: { turma: { select: { id: true, nome: true, ativo: true } } },
      }),
    ]);

    if (!usuario?.ativo || !ROLES_CADASTRO.has(usuario.role)) throw new AppError('Usuário que autorizou o cadastro não é mais válido.', 401);
    if (!aluno?.ativo) throw new AppError('Aluno não encontrado ou inativo.', 404);
    if (!vinculo?.ativo || !vinculo.turma?.ativo) throw new AppError('Vínculo do aluno com a turma não está ativo.', 422);

    return {
      usuarioId: usuario.id,
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      matricula: aluno.matricula,
      turmaId: vinculo.turma.id,
      turmaNome: vinculo.turma.nome,
    };
  }

  async marcarCadastroConcluido(token) {
    const sessao = await this.validarSessaoCadastro(token);
    await prisma.aluno.update({
      where: { id: sessao.alunoId },
      data: { fotoTreinamento: `facial://${sessao.alunoId}` },
    });
    await auditService.registrarLog({
      usuarioId: sessao.usuarioId,
      acao: 'UPDATE',
      entidade: 'BiometriaAluno',
      entidadeId: sessao.alunoId,
      dadosNovos: { cadastrado: true },
    });
    return sessao;
  }

  async resolverAmbiguidade({ candidatos, codigo }) {
    const correspondencias = [];
    for (const candidato of candidatos) {
      const fator = await prisma.biometricSecondFactor.findUnique({
        where: { alunoId: candidato.alunoId },
        select: { codigoHash: true, ativo: true },
      });
      if (fator?.ativo && await bcrypt.compare(codigo, fator.codigoHash)) correspondencias.push(candidato);
    }

    if (correspondencias.length !== 1) {
      throw new AppError('Código pessoal inválido para a identidade apresentada.', 401);
    }

    return this.processarReconhecimento(correspondencias[0], { segundoFatorValidado: true });
  }

  async processarReconhecimento(data, options = {}) {
    const { alunoId, turmaId, faceScore, imagemHash } = data;
    const aluno = await alunoService.buscarAlunoPorId(alunoId);

    const [matricula, segundoFator] = await Promise.all([
      prisma.turmaAluno.findUnique({
        where: { alunoId_turmaId: { alunoId, turmaId } },
        include: { turma: true },
      }),
      prisma.biometricSecondFactor.findUnique({
        where: { alunoId },
        select: { ativo: true },
      }),
    ]);

    if (!matricula || !matricula.ativo || !matricula.turma?.ativo) {
      await this._logRejeitado({ alunoId, turmaId, faceScore, imagemHash, motivo: 'Aluno sem vínculo ativo com a turma.' });
      throw new AppError('O aluno reconhecido não está matriculado nesta turma.', 403);
    }

    const scoreFormatado = (faceScore * 100).toFixed(1);
    if (faceScore < THRESHOLD_CONFIANCA_IA) {
      await this._logRejeitado({ alunoId, turmaId, faceScore, imagemHash, motivo: `Baixa confiança (${scoreFormatado}%).` });
      throw new AppError(`Reconhecimento rejeitado. Baixa confiança (${scoreFormatado}%).`, 422);
    }

    // Alunos marcados para segundo fator (ex.: gêmeos muito semelhantes) nunca
    // são confirmados somente pela face. O Python converte HTTP 428 em desafio.
    if (segundoFator?.ativo && !options.segundoFatorValidado) {
      await this._logRejeitado({ alunoId, turmaId, faceScore, imagemHash, motivo: 'Segundo fator obrigatório para esta identidade.' });
      throw new AppError('Verificação adicional necessária para esta identidade.', 428);
    }

    const presencaHoje = await presencaRepository.buscarPresencaCompletaDeHoje(alunoId, turmaId);
    if (presencaHoje) return this._processarSaidaOuIgnorar(aluno, presencaHoje, { turmaId, faceScore, imagemHash });

    let contextoEntrada;
    try {
      contextoEntrada = await horarioService.validarEObterDisciplinaAtual(turmaId);
    } catch (error) {
      await this._logRejeitado({ alunoId, turmaId, faceScore, imagemHash, motivo: `Entrada fora da janela permitida: ${error.message}` });
      throw error;
    }

    const agora = DateHelpers.agora();
    try {
      const [novaPresenca] = await prisma.$transaction([
        prisma.presenca.create({
          data: {
            alunoId,
            turmaId,
            disciplinaId: contextoEntrada.disciplinaId || null,
            status: contextoEntrada.statusCalculado || 'PRESENTE',
            origem: 'FACIAL',
            faceScore,
            dataHora: agora,
            data: DateHelpers.dataHojeDb(),
          },
        }),
        prisma.iaLog.create({
          data: { alunoId, turmaId, faceScore, imagemHash: imagemHash || null, resultado: 'ACEITO', motivo: contextoEntrada.statusCalculado === 'ATRASO' ? 'Entrada com atraso registrada.' : 'Entrada registrada.' },
        }),
      ]);
      return { aluno, status: 'ENTRADA_REGISTRADA', presenca: novaPresenca };
    } catch (error) {
      if (error?.code === 'P2002') {
        const existente = await presencaRepository.buscarPresencaCompletaDeHoje(alunoId, turmaId);
        if (existente) return this._processarSaidaOuIgnorar(aluno, existente, { turmaId, faceScore, imagemHash });
      }
      throw error;
    }
  }

  async _processarSaidaOuIgnorar(aluno, presencaHoje, { turmaId, faceScore, imagemHash }) {
    if (presencaHoje.dataHoraSaida) {
      return { aluno, status: 'IGNORADO', mensagem: `${aluno.nome} já concluiu o ciclo de presença hoje.`, presenca: presencaHoje };
    }
    const statusSaida = await horarioService.validarStatusSaidaDia(turmaId);
    const agora = DateHelpers.agora();
    const [saida] = await prisma.$transaction([
      prisma.presenca.update({ where: { id: presencaHoje.id }, data: { dataHoraSaida: agora, status: statusSaida || presencaHoje.status } }),
      prisma.iaLog.create({
        data: { alunoId: aluno.id, turmaId, faceScore, imagemHash: imagemHash || null, resultado: 'ACEITO', motivo: statusSaida === 'SAIDA_ANTECIPADA' ? 'Saída antecipada registrada.' : 'Saída registrada.' },
      }),
    ]);
    return { aluno, status: statusSaida === 'SAIDA_ANTECIPADA' ? 'SAIDA_ANTECIPADA_REGISTRADA' : 'SAIDA_REGISTRADA', presenca: saida };
  }

  async _logRejeitado({ alunoId, turmaId, faceScore, imagemHash, motivo }) {
    try {
      await prisma.iaLog.create({
        data: { alunoId: alunoId || null, turmaId: turmaId || null, faceScore: faceScore ?? null, imagemHash: imagemHash || null, resultado: 'REJEITADO', motivo },
      });
    } catch (_) {}
  }
}

module.exports = new IaService();
