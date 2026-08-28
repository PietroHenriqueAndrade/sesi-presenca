const prisma = require('../../database/client');
const logger = require('../../utils/logger');

class AuditService {
  async registrarLog({ usuarioId, acao, entidade, entidadeId, dadosAntigos, dadosNovos, ip }) {
    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: usuarioId || null,
          acao,
          entidade,
          entidadeId: entidadeId || null,
          dadosAntigos: dadosAntigos || null,
          dadosNovos: dadosNovos || null,
          ip: ip || null,
        },
      });
    } catch (error) {
      // Auditoria não deve derrubar a operação principal, mas a falha precisa
      // ficar registrada no logger do servidor para investigação.
      logger.error(`[AUDITORIA] Falha ao registrar AuditLog: ${error.message}`);
    }
  }

  async listarLogs(filtros = {}) {
    return prisma.auditLog.findMany({
      where: filtros,
      include: { usuario: { select: { id: true, nome: true, email: true, role: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 100,
    });
  }
}

module.exports = new AuditService();
