const prisma = require('../../database/client');
const DateHelpers = require('../../utils/dateHelpers');
const { calcularFrequencia } = require('../../domain/frequencia.rules');

function periodo(dataInicio, dataFim) {
  if (!dataInicio && !dataFim) return undefined;
  return {
    ...(dataInicio ? { gte: DateHelpers.inicioDoDia(dataInicio) } : {}),
    ...(dataFim ? { lte: DateHelpers.fimDoDia(dataFim) } : {}),
  };
}

class RelatorioService {
  async previsaoCozinha(dataRef) {
    const dataBusca = dataRef ? DateHelpers.emBrasilia(dataRef) : DateHelpers.agoraDayjs();
    if (!dataBusca) throw new Error('Data inválida.');
    const inicio = dataBusca.startOf('day').toDate();
    const fim = dataBusca.endOf('day').toDate();
    const presencas = await prisma.presenca.findMany({
      where: { dataHora: { gte: inicio, lte: fim }, status: { in: ['PRESENTE', 'ATRASO', 'SAIDA_ANTECIPADA'] } },
      include: { turma: true },
    });
    const previsao = { MANHA: 0, TARDE: 0, NOITE: 0, INTEGRAL: 0, TOTAL: 0 };
    for (const p of presencas) {
      if (p.turma?.turno && Object.hasOwn(previsao, p.turma.turno)) previsao[p.turma.turno] += 1;
      previsao.TOTAL += 1;
    }
    return { data: dataBusca.format('YYYY-MM-DD'), previsao };
  }

  async listarAusentes(turmaId, dataRef) {
    const dataBusca = dataRef ? DateHelpers.emBrasilia(dataRef) : DateHelpers.agoraDayjs();
    const faltas = await prisma.presenca.findMany({
      where: { turmaId, dataHora: { gte: dataBusca.startOf('day').toDate(), lte: dataBusca.endOf('day').toDate() }, status: 'AUSENTE' },
      include: { aluno: { select: { id: true, nome: true, matricula: true } } },
    });
    return faltas.map((f) => ({ alunoId: f.aluno.id, nome: f.aluno.nome, matricula: f.aluno.matricula, dataFalta: f.dataHora }));
  }

  async listarAlunosBaixaFrequencia(limiar = 75, dataInicio, dataFim) {
    const where = {};
    const p = periodo(dataInicio, dataFim);
    if (p) where.dataHora = p;
    const [contagens, alunos] = await Promise.all([
      prisma.presenca.groupBy({ by: ['alunoId', 'status'], where, _count: { _all: true } }),
      prisma.aluno.findMany({ where: { ativo: true }, select: { id: true, nome: true, matricula: true } }),
    ]);
    const mapa = new Map(alunos.map((a) => [a.id, { ...a, PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0, ATRASO: 0, SAIDA_ANTECIPADA: 0 }]));
    for (const item of contagens) if (mapa.has(item.alunoId)) mapa.get(item.alunoId)[item.status] = item._count._all;
    const resultado = [];
    for (const dados of mapa.values()) {
      const calculo = calcularFrequencia(dados);
      if (calculo.percentual < Number(limiar)) {
        resultado.push({
          alunoId: dados.id,
          nome: dados.nome,
          matricula: dados.matricula,
          frequencia: calculo.percentual,
          statusRisco: 'EM_RISCO',
        });
      }
    }
    return resultado.sort((a, b) => a.frequencia - b.frequencia);
  }

  async gerarRelatorioMensal() {
    const hoje = DateHelpers.agoraDayjs();
    const inicio = hoje.startOf('month').toDate();
    const fim = hoje.endOf('month').toDate();
    const contagens = await prisma.presenca.groupBy({ by: ['status'], where: { dataHora: { gte: inicio, lte: fim } }, _count: { _all: true } });
    const resumo = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0, ATRASO: 0, SAIDA_ANTECIPADA: 0, TOTAL: 0 };
    for (const item of contagens) { resumo[item.status] = item._count._all; resumo.TOTAL += item._count._all; }
    return { mes: hoje.format('MM/YYYY'), inicio, fim, estatisticas: resumo };
  }
}
module.exports = new RelatorioService();
