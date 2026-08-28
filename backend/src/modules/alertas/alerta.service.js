const prisma = require('../../database/client');
const auditService = require('../auditoria/audit.service');
const AppError = require('../../utils/AppError');
const LIMITE_FREQUENCIA = Number(process.env.FREQUENCIA_MINIMA_PERCENTUAL || process.env.LIMITE_FREQUENCIA || 75);

class AlertaService {
  async checarEGerarAlerta(alunoId, turmaId, frequenciaAtual) {
    if (frequenciaAtual >= LIMITE_FREQUENCIA) return null;
    const alertaExistente = await prisma.alerta.findFirst({ where: { alunoId, turmaId: turmaId || null, resolvido: false } });
    if (alertaExistente) return alertaExistente;
    return prisma.alerta.create({
      data: {
        alunoId,
        turmaId: turmaId || null,
        mensagem: `Baixa frequência: ${frequenciaAtual}% (limite configurado: ${LIMITE_FREQUENCIA}%).`,
      },
    });
  }

  async listarAlertasAtivos() {
    return prisma.alerta.findMany({
      where: { resolvido: false },
      include: { aluno: { select: { id: true, nome: true, matricula: true } }, turma: { select: { id: true, nome: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
  }

  async resolverAlerta(alertaId, usuarioId) {
    const antigo = await prisma.alerta.findUnique({ where: { id: alertaId } });
    if (!antigo) throw new AppError('Alerta não encontrado.', 404);
    if (antigo.resolvido) return antigo;
    const alerta = await prisma.alerta.update({ where: { id: alertaId }, data: { resolvido: true } });
    await auditService.registrarLog({ usuarioId, acao: 'UPDATE', entidade: 'Alerta', entidadeId: alertaId, dadosAntigos: antigo, dadosNovos: alerta });
    return alerta;
  }
}
module.exports = new AlertaService();
