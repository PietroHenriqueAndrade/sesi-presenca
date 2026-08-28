const prisma = require('../../database/client');
const DateHelpers = require('../../utils/dateHelpers');

function aplicarPeriodo(where, dataInicio, dataFim) {
  if (!dataInicio && !dataFim) return where;
  where.dataHora = {};
  if (dataInicio) where.dataHora.gte = DateHelpers.inicioDoDia(dataInicio);
  if (dataFim) where.dataHora.lte = DateHelpers.fimDoDia(dataFim);
  return where;
}

class PresencaRepository {
  async create(data) {
    return prisma.presenca.create({ data, include: { aluno: true, turma: true, disciplina: true } });
  }

  async findAll(pagina = 1, limite = 10, filtros = {}) {
    const page = Math.max(1, Number(pagina) || 1);
    const take = Math.min(100, Math.max(1, Number(limite) || 10));
    const skip = (page - 1) * take;
    const where = {};
    if (filtros.alunoId) where.alunoId = filtros.alunoId;
    if (filtros.turmaId) where.turmaId = filtros.turmaId;
    if (filtros.status) where.status = filtros.status;
    aplicarPeriodo(where, filtros.dataInicio, filtros.dataFim);

    const [presencas, total] = await prisma.$transaction([
      prisma.presenca.findMany({
        where,
        skip,
        take,
        include: { aluno: true, turma: true, disciplina: true },
        orderBy: { dataHora: 'desc' },
      }),
      prisma.presenca.count({ where }),
    ]);

    return {
      dados: presencas,
      meta: { total, paginaAtual: page, totalPaginas: Math.ceil(total / take), itensPorPagina: take },
    };
  }

  async findById(id) {
    return prisma.presenca.findUnique({ where: { id }, include: { aluno: true, turma: true, disciplina: true } });
  }

  async findByAlunoId(alunoId) {
    return prisma.presenca.findMany({ where: { alunoId }, include: { turma: true, disciplina: true }, orderBy: { dataHora: 'desc' } });
  }

  async findByTurmaId(turmaId) {
    return prisma.presenca.findMany({ where: { turmaId }, include: { aluno: true, disciplina: true }, orderBy: { dataHora: 'desc' } });
  }

  async findPresencasDeHoje() {
    return prisma.presenca.findMany({
      where: { data: DateHelpers.dataHojeDb() },
      include: { aluno: true, turma: true, disciplina: true },
      orderBy: { dataHora: 'desc' },
    });
  }

  async countByStatusAndAluno(alunoId, dataInicio, dataFim) {
    return prisma.presenca.groupBy({
      by: ['status'],
      where: aplicarPeriodo({ alunoId }, dataInicio, dataFim),
      _count: { _all: true },
    });
  }

  async verificarPresencaExistenteHoje(alunoId, turmaId) {
    return Boolean(await prisma.presenca.findUnique({
      where: { aluno_turma_data_unica: { alunoId, turmaId, data: DateHelpers.dataHojeDb() } },
      select: { id: true },
    }));
  }

  async buscarPresencaCompletaDeHoje(alunoId, turmaId) {
    return prisma.presenca.findUnique({
      where: { aluno_turma_data_unica: { alunoId, turmaId, data: DateHelpers.dataHojeDb() } },
      include: { aluno: true, turma: true, disciplina: true },
    });
  }

  async buscarPresencaDeHojePorDisciplina(alunoId, turmaId, disciplinaId) {
    return prisma.presenca.findFirst({
      where: { alunoId, turmaId, disciplinaId, data: DateHelpers.dataHojeDb() },
    });
  }

  async registrarSaida(presencaId, novoStatus = null) {
    return prisma.presenca.update({
      where: { id: presencaId },
      data: { dataHoraSaida: DateHelpers.agora(), ...(novoStatus ? { status: novoStatus } : {}) },
      include: { aluno: true, turma: true, disciplina: true },
    });
  }

  async countAgrupadoPorDisciplina(alunoId, dataInicio, dataFim) {
    return prisma.presenca.groupBy({
      by: ['disciplinaId', 'status'],
      where: aplicarPeriodo({ alunoId }, dataInicio, dataFim),
      _count: { _all: true },
    });
  }

  async countConsolidadoPorTurma(turmaId, dataInicio, dataFim) {
    return prisma.presenca.groupBy({
      by: ['alunoId', 'status'],
      where: aplicarPeriodo({ turmaId }, dataInicio, dataFim),
      _count: { _all: true },
    });
  }

  async sincronizarBatchOffline(lotePresencas) {
    const operacoes = lotePresencas.map((p) => {
      const data = DateHelpers.dataDb(p.dataHora);
      const dataHora = new Date(p.dataHora);
      return prisma.presenca.upsert({
        where: { aluno_turma_data_unica: { alunoId: p.alunoId, turmaId: p.turmaId, data } },
        update: {},
        create: {
          alunoId: p.alunoId,
          turmaId: p.turmaId,
          origem: 'OFFLINE',
          status: p.status || 'PRESENTE',
          dataHora,
          data,
        },
      });
    });

    const resultados = await Promise.allSettled(operacoes);
    const sucesso = resultados.filter((r) => r.status === 'fulfilled').length;
    const falha = resultados.length - sucesso;
    return { sucesso, falha, total: resultados.length };
  }
}

module.exports = new PresencaRepository();
