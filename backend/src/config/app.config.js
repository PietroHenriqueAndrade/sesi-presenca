const AppError = require('../utils/AppError');

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const allowLocalCors = !isProduction || String(process.env.ALLOW_LOCAL_CORS || '').toLowerCase() === 'true';

const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function originPermitida(origin) {
  // Flutter nativo, ferramentas de backend e health checks não enviam Origin.
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    return allowLocalCors && (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    );
  } catch (_) {
    return false;
  }
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  trustProxy: Number.parseInt(process.env.TRUST_PROXY_HOPS || '0', 10) || false,
  port: Number(process.env.PORT) || 3000,
  apiPrefix: '/api/v1',
  corsOptions: {
    origin(origin, callback) {
      if (originPermitida(origin)) return callback(null, true);
      return callback(new AppError('Origem CORS não permitida.', 403));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
  },
};
