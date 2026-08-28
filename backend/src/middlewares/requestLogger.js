const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  // Não registra query string/body/token para reduzir exposição de dados pessoais.
  const caminho = (req.originalUrl || req.url || '').split('?')[0];
  const inicio = Date.now();

  res.on('finish', () => {
    logger.info(`[${req.method}] ${caminho} ${res.statusCode} - ${Date.now() - inicio}ms - IP: ${req.ip}`);
  });
  next();
};
