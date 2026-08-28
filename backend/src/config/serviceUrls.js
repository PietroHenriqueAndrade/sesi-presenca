function trimSlash(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function ensureHttpUrl(value, label) {
  const raw = trimSlash(value);
  if (!raw) return '';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch (_) {
    throw new Error(`${label} precisa ser uma URL HTTP(S) válida.`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label} precisa usar http:// ou https://.`);
  }
  return raw;
}

function getPythonBaseUrl() {
  if (process.env.PYTHON_API_URL) {
    return ensureHttpUrl(process.env.PYTHON_API_URL, 'PYTHON_API_URL');
  }
  const hostport = String(process.env.PYTHON_INTERNAL_HOSTPORT || '').trim();
  if (hostport) return ensureHttpUrl(`http://${hostport}`, 'PYTHON_INTERNAL_HOSTPORT');
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
}

function getApiPublicUrl() {
  if (process.env.API_PUBLIC_URL) {
    return ensureHttpUrl(process.env.API_PUBLIC_URL, 'API_PUBLIC_URL');
  }
  const renderHost = String(process.env.RENDER_EXTERNAL_HOSTNAME || '').trim();
  if (renderHost) return `https://${renderHost}`;
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
}

module.exports = { getPythonBaseUrl, getApiPublicUrl };
