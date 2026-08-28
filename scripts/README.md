# Smoke test pré-banca

Com Node/PostgreSQL/Python já ativos, execute na raiz do projeto:

```bash
node scripts/prebanca-smoke.mjs
```

Para incluir autenticação e rotas protegidas:

### PowerShell

```powershell
$env:TCC_TEST_EMAIL="admin@senai.br"
$env:TCC_TEST_PASSWORD="Admin@2026"
node scripts/prebanca-smoke.mjs
```

### Bash

```bash
TCC_TEST_EMAIL=admin@senai.br TCC_TEST_PASSWORD='Admin@2026' node scripts/prebanca-smoke.mjs
```

Variáveis opcionais:

- `TCC_API_URL` (padrão `http://localhost:3000/api/v1`)
- `TCC_PYTHON_URL` (padrão `http://localhost:5000`)

O script valida health/readiness e, com credenciais, login, `/auth/me`, `/dashboard/resumo`, turmas e presenças do dia. O reconhecimento facial real continua exigindo câmera + `face_recognition/dlib` e deve ser testado no tablet.
