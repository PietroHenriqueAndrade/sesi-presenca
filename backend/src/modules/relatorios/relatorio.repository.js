const prisma = require('../../database/client');
const dayjs = require('dayjs');

class RelatorioRepository {
  async contarPresencasPorPeriodo(inicio, fim) {
    return await prisma.presenca.count({
      where: {
        dataHora: {
          gte: inicio,
          lte: fim
        },
        status: 'PRESENTE'
      }
    });
  }

  async buscarFrequenciaAgrupadaPorTurma(inicio, fim) {
    // 1. O BANCO DE DADOS faz a contagem pesada (retorna só o ID da turma e a quantidade)
    const agrupamento = await prisma.presenca.groupBy({
      by: ['turmaId'],
      where: {
        dataHora: {
          gte: inicio,
          lte: fim
        },
        status: 'PRESENTE'
      },
      _count: {
        _all: true
      }
    });

    // Se não houver presenças no período, já retorna vazio para poupar processamento
    if (agrupamento.length === 0) return {};

    // 2. Pegamos os IDs das turmas para buscar os nomes delas
    const turmasIds = agrupamento.map(g => g.turmaId);
    const turmas = await prisma.turma.findMany({
      where: { id: { in: turmasIds } },
      select: { id: true, nome: true }
    });

    // 3. Montamos o objeto de resposta final para o frontend
    const resultadoFormatado = {};
    agrupamento.forEach(grupo => {
      const turma = turmas.find(t => t.id === grupo.turmaId);
      if (turma) {
        resultadoFormatado[turma.nome] = grupo._count._all;
      }
    });

    return resultadoFormatado;
  }
}

module.exports = new RelatorioRepository();