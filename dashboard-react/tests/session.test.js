import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
  clear() { this.map.clear(); }
}

globalThis.sessionStorage = new MemoryStorage();
const { readSession, saveSession, clearSession } = await import('../src/lib/session.js');

test('salva e recupera access/refresh token e usuário', () => {
  clearSession();
  saveSession({
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    user: { id: 'u1', nome: 'Admin', role: 'ADMIN' },
  });
  const session = readSession();
  assert.equal(session.accessToken, 'access-1');
  assert.equal(session.refreshToken, 'refresh-1');
  assert.equal(session.user.role, 'ADMIN');
});

test('clearSession remove todo o estado autenticado', () => {
  saveSession({ accessToken: 'a', refreshToken: 'r', user: { id: 'u1' } });
  clearSession();
  assert.deepEqual(readSession(), { accessToken: '', refreshToken: '', user: null });
});

test('readSession é resiliente a JSON de usuário corrompido', () => {
  clearSession();
  sessionStorage.setItem('faceclass.dashboard.user', '{invalido');
  assert.deepEqual(readSession(), { accessToken: '', refreshToken: '', user: null });
});
