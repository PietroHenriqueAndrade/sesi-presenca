const prisma = require('../../database/client');
const DateHelpers = require('../../utils/dateHelpers');

class DashboardService {
  async resumo() {
    const hoje = DateHelpers.dataHojeDb();
    const inicio7Dias = DateHelpers.dataHojeDb(-6);

    const [
      totalAlunos,
      totalTurmas,
      totalDisciplinas,
      statusHoje,
      recentes,
      justificativasPendentes,
      alertasAbertos,
      serieBruta,
    ] = await Promise.all([
      prisma.aluno.count({ where: { ativo: true } }),
      prisma.turma.count({ where: { ativo: true } }),
      prisma.disciplina.count({ where: { ativo: true } }),
      prisma.presenca.groupBy({
        by: ['status'],
        where: { data: hoje },
        _count: { _all: true },
      }),
      prisma.presenca.findMany({
        orderBy: { dataHora: 'desc' },
        take: 10,
        include: {
          aluno: { select: { id: true, nome: true, matricula: true } },
          turma: { select: { id: true, nome: true, turno: true } },
        },
      }),
      prisma.justificativa.count({ where: { status: 'PENDENTE' } }),
      prisma.alerta.count({ where: { resolvido: false } }),
      prisma.presenca.groupBy({
        by: ['data', 'status'],
        where: { data: { gte: inicio7Dias, lte: hoje } },
        _count: { _all: true },
        orderBy: { data: 'asc' },
      }),
    ]);

    const contagemHoje = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0, ATRASO: 0, SAIDA_ANTECIPADA: 0 };
    for (const item of statusHoje) contagemHoje[item.status] = item._count._all;

    const serieMap = new Map();
    for (let i = -6; i <= 0; i += 1) {
      const data = DateHelpers.dataHojeDb(i);
      const chave = data.toISOString().slice(0, 10);
      serieMap.set(chave, { data: chave, PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0, ATRASO: 0, SAIDA_ANTECIPADA: 0, total: 0 });
    }
    for (const item of serieBruta) {
      const chave = new Date(item.data).toISOString().slice(0, 10);
      const dia = serieMap.get(chave);
      if (!dia) continue;
      dia[item.status] = item._count._all;
      dia.total += item._count._all;
    }

    const comparecimentosHoje = contagemHoje.PRESENTE + contagemHoje.ATRASO + contagemHoje.SAIDA_ANTECIPADA;

    return {
      geradoEm: DateHelpers.agora().toISOString(),
      cadastros: { alunosAtivos: totalAlunos, turmasAtivas: totalTurmas, disciplinasAtivas: totalDisciplinas },
      hoje: {
        data: hoje.toISOString().slice(0, 10),
        totalRegistros: Object.values(contagemHoje).reduce((acc, valor) => acc + valor, 0),
        comparecimentos: comparecimentosHoje,
        ausencias: contagemHoje.AUSENTE,
        porStatus: contagemHoje,
      },
      pendencias: { justificativas: justificativasPendentes, alertas: alertasAbertos },
      ultimos7Dias: Array.from(serieMap.values()),
      presencasRecentes: recentes,
    };
  }
}

module.exports = new DashboardService();
