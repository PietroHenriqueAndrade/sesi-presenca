const nodemailer = require('nodemailer');
const logger = require('./logger');
const AppError = require('./AppError');

function smtpConfigurado() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function criarTransporter() {
  if (!smtpConfigurado()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Envia e-mail sem esconder falhas importantes do fluxo que depende dele.
 *
 * Aceita tanto o formato novo por objeto quanto o formato legado
 * enviarEmail(destinatario, assunto, texto) usado pelos cron jobs antigos.
 */
async function enviarEmail(opcoesOuDestinatario, assunto, texto) {
  const opcoes = typeof opcoesOuDestinatario === 'object'
    ? opcoesOuDestinatario
    : { to: opcoesOuDestinatario, subject: assunto, text: texto };

  if (!smtpConfigurado()) {
    throw new AppError('Serviço de e-mail não configurado no servidor.', 503);
  }

  const transporter = criarTransporter();
  const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM) || 'Sistema de Presença SENAI <no-reply@senai.br>';

  try {
    const info = await transporter.sendMail({
      from,
      to: opcoes.to,
      subject: opcoes.subject,
      text: opcoes.text,
      html: opcoes.html,
    });
    logger.info(`E-mail enviado com sucesso. messageId=${info.messageId || 'n/a'}`);
    return info;
  } catch (error) {
    logger.error(`Falha ao enviar e-mail: ${error.message}`);
    throw new AppError('Não foi possível enviar o e-mail neste momento.', 503);
  }
}

enviarEmail.smtpConfigurado = smtpConfigurado;

module.exports = enviarEmail;
