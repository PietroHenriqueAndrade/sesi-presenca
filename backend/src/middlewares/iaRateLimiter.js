const rateLimit = require('express-rate-limit');

// Um terminal escolar pode processar muitos alunos em sequência. O valor é
// configurável e alto o bastante para não bloquear uma fila real da banca.
const iaRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number.parseInt(process.env.IA_RATE_LIMIT_MAX, 10) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de reconhecimento facial. Aguarde alguns segundos.',
  },
});

module.exports = iaRateLimiter;
