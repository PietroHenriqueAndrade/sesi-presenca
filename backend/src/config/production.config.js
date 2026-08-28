const AppError = require('../utils/AppError');
const { getPythonBaseUrl, getApiPublicUrl } = require('./serviceUrls');

function isPlaceholder(value) {
  return /TROQUE|CHANGE_ME|CHANGEME|EXEMPLO|EXAMPLE|SENHA_AQUI/i.test(String(value || ''));
}

function requireStrongSecret(name, minimum = 32) {
  const value = String(process.env[name] || '').trim();
  if (value.length < minimum || isPlaceholder(value)) {
    throw new AppError(`${name} precisa ser um segredo aleatório com pelo menos ${minimum} caracteres em produção.`, 500);
  }
  return value;
}

function requireUrl(name, { https = false, value = null } = {}) {
  const raw = String(value ?? process.env[name] ?? '').trim();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch (_) {
    throw new AppError(`${name} precisa ser uma URL válida em produção.`, 500);
  }
  if (https && parsed.protocol !== 'https:') {
    throw new AppError(`${name} precisa usar HTTPS em produção.`, 500);
  }
  return parsed;
}

function validateProductionConfig() {
  if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') return;

  const jwt = requireStrongSecret('JWT_SECRET');
  const refresh = requireStrongSecret('JWT_REFRESH_SECRET');
  const ia = requireStrongSecret('IA_API_KEY');

  if (jwt === refresh || jwt === ia || refresh === ia) {
    throw new AppError('JWT_SECRET, JWT_REFRESH_SECRET e IA_API_KEY precisam ser diferentes.', 500);
  }

  const apiPublicUrl = getApiPublicUrl();
  requireUrl('API_PUBLIC_URL/RENDER_EXTERNAL_HOSTNAME', { https: true, value: apiPublicUrl });

  const pythonBaseUrl = getPythonBaseUrl();
  if (!pythonBaseUrl) {
    throw new AppError('Configure PYTHON_API_URL ou PYTHON_INTERNAL_HOSTPORT em produção.', 500);
  }
  requireUrl('PYTHON_API_URL/PYTHON_INTERNAL_HOSTPORT', { value: pythonBaseUrl });

  const databaseUrl = String(process.env.DATABASE_URL || '').trim();
  if (!/^postgres(ql)?:\/\//i.test(databaseUrl) || isPlaceholder(databaseUrl)) {
    throw new AppError('DATABASE_URL precisa apontar para PostgreSQL e não pode conter placeholder.', 500);
  }

  const origins = String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!origins.length) {
    throw new AppError('FRONTEND_URL precisa definir ao menos a origem HTTPS do Dashboard.', 500);
  }

  for (const origin of origins) {
    const parsed = requireUrl('FRONTEND_URL', { https: true, value: origin });
    if (parsed.protocol !== 'https:') {
      throw new AppError('Todas as origens em FRONTEND_URL precisam usar HTTPS em produção.', 500);
    }
  }
}

module.exports = validateProductionConfig;
