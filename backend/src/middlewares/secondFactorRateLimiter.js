const rateLimit = require('express-rate-limit');

// Código de 6 dígitos é um segundo fator humano. Limite muito menor que o
// reconhecimento normal reduz tentativa automatizada sem atrapalhar a fila.
module.exports = rateLimit({
  windowMs: 60 * 1000,
  max: Number.parseInt(process.env.SECOND_FACTOR_RATE_LIMIT_MAX, 10) || 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de código pessoal. Aguarde um minuto e tente novamente.',
  },
});
