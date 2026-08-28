const cron = require('node-cron');
const logger = require('../utils/logger');
const enviarEmail = require('../utils/email');
const presencaService = require('../modules/presencas/presenca.service');
const relatorioService = require('../modules/relatorios/relatorio.service');
const prisma = require('../database/client');
const DateHelpers = require('../utils/dateHelpers');

async function enviarSeConfigurado(destino, assunto, texto) {
  if (!destino) {
    logger.warn(`[CRON] E-mail não enviado (${assunto}): destinatário não configurado.`);
    return false;
  }
  if (!enviarEmail.smtpConfigurado()) {
    logger.warn(`[CRON] E-mail não enviado (${assunto}): SMTP não configurado.`);
    return false;
  }
  await enviarEmail(destino, assunto, texto);
  return true;
}

const iniciarCronJobs = () => {
  const opcoes = { timezone: DateHelpers.timezone };

  cron.schedule('0 23 * * 1-5', async () => {
    try { await presencaService.processarFaltasAutomaticasDoDia(); }
    catch (error) { logger.error(`[CRON] Falha ao processar faltas: ${error.message}`); }
  }, opcoes);

  cron.schedule('0 6 * * 1-5', async () => {
    try {
      const r = await relatorioService.previsaoCozinha();
      const texto = `Previsão de alunos: manhã ${r.previsao.MANHA}, tarde ${r.previsao.TARDE}, noite ${r.previsao.NOITE}, integral ${r.previsao.INTEGRAL}. Total ${r.previsao.TOTAL}.`;
      await enviarSeConfigurado(process.env.EMAIL_COZINHA, 'Previsão de refeições do dia', texto);
    } catch (error) { logger.error(`[CRON] Falha no relatório da cozinha: ${error.message}`); }
  }, opcoes);

  cron.schedule('0 18 * * 5', async () => {
    try {
      const alunos = await relatorioService.listarAlunosBaixaFrequencia(Number((process.env.FREQUENCIA_MINIMA_PERCENTUAL || process.env.LIMITE_FREQUENCIA)) || 75);
      if (alunos.length) {
        const texto = alunos.map((a) => `- ${a.nome} (${a.frequencia}%)`).join('\n');
        await enviarSeConfigurado(process.env.EMAIL_SECRETARIA, 'Alunos com baixa frequência', texto);
      }
    } catch (error) { logger.error(`[CRON] Falha no alerta semanal: ${error.message}`); }
  }, opcoes);

  cron.schedule('0 8 28 * *', async () => {
    try {
      const r = await relatorioService.gerarRelatorioMensal();
      await enviarSeConfigurado(process.env.EMAIL_DIRETORIA, `Fechamento mensal ${r.mes}`, 'O relatório mensal está disponível pela API administrativa.');
    } catch (error) { logger.error(`[CRON] Falha no fechamento mensal: ${error.message}`); }
  }, opcoes);

  // Limpeza apenas de artefatos de autenticação que já perderam utilidade.
  cron.schedule('30 3 * * *', async () => {
    try {
      const agora = new Date();
      const [blacklist, resets] = await prisma.$transaction([
        prisma.jwtBlacklist.deleteMany({ where: { expiresAt: { lt: agora } } }),
        prisma.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: agora } }, { usadoEm: { not: null } }] } }),
      ]);
      logger.info(`[CRON] Limpeza auth: ${blacklist.count} blacklist, ${resets.count} reset token(s).`);
    } catch (error) { logger.error(`[CRON] Falha na limpeza de tokens: ${error.message}`); }
  }, opcoes);

  // Retenção de auditoria configurável; padrão conservador de 180 dias para o TCC.
  cron.schedule('0 4 1 * *', async () => {
    try {
      const dias = Math.max(30, Number(process.env.AUDIT_RETENTION_DAYS) || 180);
      const limite = DateHelpers.agoraDayjs().subtract(dias, 'day').toDate();
      const removidos = await prisma.auditLog.deleteMany({ where: { criadoEm: { lt: limite } } });
      logger.info(`[CRON] Retenção de auditoria: ${removidos.count} log(s) removido(s).`);
    } catch (error) { logger.error(`[CRON] Falha na retenção de auditoria: ${error.message}`); }
  }, opcoes);

  logger.info(`[CRON] Agendamentos ativados (${DateHelpers.timezone}).`);
};
module.exports = iniciarCronJobs;
