const presencaRepository = require('./presenca.repository');
const alunoService = require('../alunos/aluno.service');
const turmaService = require('../turmas/turma.service');
const AppError = require('../../utils/AppError');
const DateHelpers = require('../../utils/dateHelpers');
const logger = require('../../utils/logger');
const prisma = require('../../database/client');
const { selecionarFaltasAutomaticas } = require('../../domain/faltas.rules');

class PresencaService {
  async registrarPresencaManual(payload) {
    const { alunoId, turmaId, disciplinaId, status } = payload;
    await alunoService.buscarAlunoPorId(alunoId);
    await turmaService.buscarTurmaPorId(turmaId);

    const matricula = await prisma.turmaAluno.findUnique({ where: { alunoId_turmaId: { alunoId, turmaId } } });
    if (!matricula?.ativo) throw new AppError('O aluno não está matriculado nesta turma.', 403);

    if (disciplinaId) {
      const disciplina = await prisma.disciplina.findFirst({ where: { id: disciplinaId, ativo: true } });
      if (!disciplina) throw new AppError('Disciplina não encontrada ou inativa.', 400);
    }

    try {
      return await presencaRepository.create({
        alunoId,
        turmaId,
        disciplinaId: disciplinaId || null,
        status: status || 'PRESENTE',
        origem: 'MANUAL',
        dataHora: DateHelpers.agora(),
        data: DateHelpers.dataHojeDb(),
      });
    } catch (error) {
      if (error?.code === 'P2002') throw new AppError('Este aluno já possui presença nesta turma hoje.', 409);
      throw error;
    }
  }

  async listarTodas(pagina, limite, filtros = {}) { return presencaRepository.findAll(pagina, limite, filtros); }
  async listarPorAluno(alunoId) { await alunoService.buscarAlunoPorId(alunoId); return presencaRepository.findByAlunoId(alunoId); }
  async listarPorTurma(turmaId) { await turmaService.buscarTurmaPorId(turmaId); return presencaRepository.findByTurmaId(turmaId); }
  async listarPresencasHoje() { return presencaRepository.findPresencasDeHoje(); }

  async processarFaltasAutomaticasDoDia() {
    const DIAS = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
    const dia = DIAS[DateHelpers.agoraDayjs().day()];
    if (dia === 'DOMINGO') return { inseridas: 0 };

    const aulas = await prisma.horario.findMany({
      where: { diaSemana: dia, ativo: true, turma: { ativo: true } },
      include: { turma: { include: { alunos: { where: { ativo: true }, include: { aluno: true } } } } },
    });
    if (!aulas.length) return { inseridas: 0 };

    const data = DateHelpers.dataHojeDb();
    const existentes = await prisma.presenca.findMany({ where: { data }, select: { alunoId: true, turmaId: true } });
    const faltas = selecionarFaltasAutomaticas({
      aulas,
      existentes,
      data,
      agora: DateHelpers.agora(),
    });
    if (faltas.length) await prisma.presenca.createMany({ data: faltas, skipDuplicates: true });
    logger.info(`[CRON] ${faltas.length} falta(s) automática(s) processada(s).`);
    return { inseridas: faltas.length };
  }

  async sincronizarBatch(lote) {
    const pares = [...new Set(lote.map((p) => `${p.alunoId}:${p.turmaId}`))];
    const validos = new Set();
    for (const par of pares) {
      const [alunoId, turmaId] = par.split(':');
      const vinculo = await prisma.turmaAluno.findUnique({ where: { alunoId_turmaId: { alunoId, turmaId } }, include: { aluno: true, turma: true } });
      if (vinculo?.ativo && vinculo.aluno?.ativo && vinculo.turma?.ativo) validos.add(par);
    }
    const loteValido = lote.filter((p) => validos.has(`${p.alunoId}:${p.turmaId}`));
    const invalidos = lote.length - loteValido.length;
    const resultado = loteValido.length ? await presencaRepository.sincronizarBatchOffline(loteValido) : { sucesso: 0, falha: 0, total: 0 };
    return { ...resultado, falha: resultado.falha + invalidos, total: lote.length };
  }

  async registrarSaida(presencaId, novoStatus) {
    const presenca = await presencaRepository.findById(presencaId);
    if (!presenca) throw new AppError('Registro de presença não encontrado.', 404);
    if (presenca.dataHoraSaida) throw new AppError('A saída já foi registrada para este aluno.', 409);
    return presencaRepository.registrarSaida(presencaId, novoStatus);
  }
}
module.exports = new PresencaService();
