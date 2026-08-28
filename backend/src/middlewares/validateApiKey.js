const crypto = require('crypto');
const AppError = require('../utils/AppError');

function iguaisEmTempoConstante(a, b) {
  const aBuffer = Buffer.from(String(a || ''));
  const bBuffer = Buffer.from(String(b || ''));
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

const validateApiKey = (req, res, next) => {
  const apiKeyEsperada = process.env.IA_API_KEY;
  const apiKeyRecebida = req.headers['x-api-key'];

  if (!apiKeyEsperada) {
    return next(new AppError('Integração com IA não configurada no servidor.', 503));
  }

  if (!apiKeyRecebida || !iguaisEmTempoConstante(apiKeyRecebida, apiKeyEsperada)) {
    return next(new AppError('Acesso negado. API Key ausente ou inválida.', 401));
  }

  return next();
};

module.exports = validateApiKey;
