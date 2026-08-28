const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv-safe').config({
    path: envPath,
    example: path.resolve(__dirname, '../.env.required'),
    allowEmptyValues: false,
  });
} else if ((process.env.NODE_ENV || 'development') !== 'production') {
  throw new Error('Arquivo backend/.env não encontrado. Copie .env.example para .env.');
}
// Em produção (Docker/CI), as variáveis são injetadas pelo ambiente e
// validadas logo abaixo; nenhum arquivo de segredo precisa entrar na imagem.

const validateProductionConfig = require('./config/production.config');
validateProductionConfig();

const app = require('./app');
const logger = require('./utils/logger');
const iniciarCronJobs = require('./cron');
const prisma = require('./database/client');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`Servidor rodando em ${HOST}:${PORT}`);
  logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  iniciarCronJobs();
});

let encerrando = false;
async function encerrar(sinal) {
  if (encerrando) return;
  encerrando = true;
  logger.info(`${sinal} recebido. Desligando o servidor...`);

  const forceTimer = setTimeout(() => {
    logger.error('Encerramento forçado após timeout.');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('Servidor finalizado com segurança.');
      process.exit(0);
    } catch (error) {
      logger.error(`Erro ao encerrar conexão com banco: ${error.message}`);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));

module.exports = server;
