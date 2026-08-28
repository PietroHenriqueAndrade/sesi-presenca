const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Number.parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.endsWith('/health') || req.path.includes('/docs'),
  message: {
    status: 'error',
    message: 'Muitas requisições. Tente novamente mais tarde.',
  },
});

module.exports = limiter;
