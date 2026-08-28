import { clearSession, readSession, saveSession } from './session';

const DEFAULT_API_URL = import.meta.env.PROD ? '/api/v1' : 'http://localhost:3000/api/v1';
const DEFAULT_PYTHON_API_URL = import.meta.env.PROD ? '/face-api' : 'http://localhost:5000';

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
export const PYTHON_API_URL = (import.meta.env.VITE_PYTHON_API_URL || DEFAULT_PYTHON_API_URL).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { message: text }; }
}

async function refreshAccessToken() {
  const session = readSession();
  if (!session.refreshToken) return false;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  const payload = await parseResponse(response);
  if (!response.ok || !payload?.data?.token || !payload?.data?.refreshToken) {
    clearSession();
    return false;
  }
  saveSession({
    accessToken: payload.data.token,
    refreshToken: payload.data.refreshToken,
    user: session.user,
  });
  return true;
}

export async function api(path, options = {}, allowRefresh = true) {
  const session = readSession();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new ApiError('Não foi possível conectar ao Backend Node.', 0, error);
  }

  if (response.status === 401 && allowRefresh && await refreshAccessToken()) {
    return api(path, options, false);
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new ApiError(payload.message || payload.detail || `Erro HTTP ${response.status}.`, response.status, payload);
  }
  return payload;
}

export async function login(email, senha) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
  const payload = await parseResponse(response);
  if (!response.ok) throw new ApiError(payload.message || 'Não foi possível entrar.', response.status, payload);
  const data = payload.data || {};
  saveSession({ accessToken: data.token, refreshToken: data.refreshToken, user: data.usuario });
  return data.usuario;
}

export async function logout() {
  const session = readSession();
  try {
    await api('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken || undefined }),
    }, false);
  } catch {
    // O logout local precisa funcionar mesmo se o backend estiver indisponível.
  } finally {
    clearSession();
  }
}

export function getData(payload, fallback = null) {
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : fallback;
}
