const KEYS = {
  access: 'faceclass.dashboard.accessToken',
  refresh: 'faceclass.dashboard.refreshToken',
  user: 'faceclass.dashboard.user',
};

export function readSession() {
  try {
    return {
      accessToken: sessionStorage.getItem(KEYS.access) || '',
      refreshToken: sessionStorage.getItem(KEYS.refresh) || '',
      user: JSON.parse(sessionStorage.getItem(KEYS.user) || 'null'),
    };
  } catch {
    return { accessToken: '', refreshToken: '', user: null };
  }
}

export function saveSession({ accessToken, refreshToken, user }) {
  if (accessToken) sessionStorage.setItem(KEYS.access, accessToken);
  if (refreshToken) sessionStorage.setItem(KEYS.refresh, refreshToken);
  if (user) sessionStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function clearSession() {
  Object.values(KEYS).forEach((key) => sessionStorage.removeItem(key));
}
