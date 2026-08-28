#!/usr/bin/env node

const API_ROOT = (process.env.TCC_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');
const PYTHON_ROOT = (process.env.TCC_PYTHON_URL || 'http://localhost:5000').replace(/\/$/, '');
const EMAIL = process.env.TCC_TEST_EMAIL || '';
const PASSWORD = process.env.TCC_TEST_PASSWORD || '';

const results = [];

async function request(label, url, options = {}, expected = [200]) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    let body = null;
    const text = await response.text();
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    const ok = expected.includes(response.status);
    results.push({ label, ok, status: response.status, ms: Date.now() - started });
    if (!ok) throw new Error(`${response.status}: ${body?.message || body?.error || String(body || '')}`);
    return body;
  } catch (error) {
    if (!results.some((r) => r.label === label)) results.push({ label, ok: false, status: 'ERRO', ms: Date.now() - started });
    throw new Error(`${label}: ${error.message}`);
  }
}

function tokenFrom(payload) {
  return payload?.data?.token || payload?.data?.accessToken || payload?.token || payload?.accessToken || null;
}

async function main() {
  console.log('=== FaceClass • Smoke test pré-banca ===');
  console.log(`Node:   ${API_ROOT}`);
  console.log(`Python: ${PYTHON_ROOT}`);

  await request('Node liveness', `${API_ROOT}/health`);
  await request('Node readiness', `${API_ROOT}/health/ready`);
  await request('Python health', `${PYTHON_ROOT}/health`);

  if (!EMAIL || !PASSWORD) {
    console.log('\n[INFO] TCC_TEST_EMAIL/TCC_TEST_PASSWORD não definidos. Health checks concluídos; login e rotas autenticadas foram pulados.');
  } else {
    const loginPayload = await request('Login', `${API_ROOT}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, senha: PASSWORD }),
    });
    const token = tokenFrom(loginPayload);
    if (!token) throw new Error('Login respondeu sem access token reconhecível.');
    const auth = { Authorization: `Bearer ${token}` };

    await request('Perfil autenticado', `${API_ROOT}/auth/me`, { headers: auth });
    await request('Dashboard consolidado', `${API_ROOT}/dashboard/resumo`, { headers: auth });
    await request('Turmas', `${API_ROOT}/turmas`, { headers: auth });
    await request('Presenças de hoje', `${API_ROOT}/presencas/hoje`, { headers: auth });
  }

  console.log('\nResultado:');
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.label.padEnd(24)} ${String(result.status).padEnd(5)} ${result.ms}ms`);
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) process.exitCode = 1;
  else console.log('\nSmoke test concluído sem falhas nas verificações executadas.');
}

main().catch((error) => {
  console.error(`\nFAIL: ${error.message}`);
  console.error('\nConfirme se Node, PostgreSQL e Python estão ativos e se as URLs/credenciais de teste estão corretas.');
  process.exitCode = 1;
});
