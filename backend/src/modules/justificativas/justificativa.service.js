const prisma = require('../../database/client');
const auditService = require('../auditoria/audit.service');
const AppError = require('../../utils/AppError');
const { validarSolicitacaoJustificativa, validarDecisaoJustificativa } = require('../../domain/justificativa.rules');

class JustificativaService {
  async registrarJustificativa(data, usuarioLogadoId) {
    const { presencaId, motivo, anexoUrl } = data;

    const presenca = await prisma.presenca.findUnique({
      where: { id: presencaId },
      include: { justificativa: true },
    });

    const impedimento = validarSolicitacaoJustificativa(presenca);
    if (impedimento) throw new AppError(impedimento.message, impedimento.statusCode);

    const justificativa = await prisma.justificativa.create({
      data: {
        presencaId,
        motivo,
        anexoUrl: anexoUrl || null,
        status: 'PENDENTE',
        aprovadoPor: null,
      },
      include: { presenca: { include: { aluno: true, turma: true } } },
    });

    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'CREATE',
      entidade: 'Justificativa',
      entidadeId: justificativa.id,
      dadosNovos: { presencaId, motivo, status: 'PENDENTE' },
    });

    return justificativa;
  }

  async listar(status = 'PENDENTE') {
    return prisma.justificativa.findMany({
      where: status ? { status } : {},
      include: {
        presenca: {
          include: {
            aluno: { select: { id: true, nome: true, matricula: true } },
            turma: { select: { id: true, nome: true, turno: true } },
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
  }

  async decidir(id, novoStatus, usuarioLogadoId, observacao = null) {
    const atual = await prisma.justificativa.findUnique({
      where: { id },
      include: { presenca: true },
    });
    const impedimento = validarDecisaoJustificativa(atual, novoStatus);
    if (impedimento) throw new AppError(impedimento.message, impedimento.statusCode);

    const resultado = await prisma.$transaction(async (tx) => {
      const justificativa = await tx.justificativa.update({
        where: { id },
        data: { status: novoStatus, aprovadoPor: usuarioLogadoId },
      });

      let presenca = atual.presenca;
      if (novoStatus === 'APROVADO') {
        presenca = await tx.presenca.update({
          where: { id: atual.presencaId },
          data: { status: 'JUSTIFICADO' },
        });
      }

      return { justificativa, presenca };
    });

    await auditService.registrarLog({
      usuarioId: usuarioLogadoId,
      acao: 'UPDATE',
      entidade: 'Justificativa',
      entidadeId: id,
      dadosAntigos: { status: atual.status },
      dadosNovos: { status: novoStatus, observacao: observacao || null },
    });

    return resultado;
  }
}

module.exports = new JustificativaService();
