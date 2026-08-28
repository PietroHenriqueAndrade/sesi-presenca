# SESI Presença — deploy Render + Vercel + Supabase

Versão preparada para a arquitetura de produção do TCC:

- **Vercel:** `dashboard-react/`
- **Render:** `backend/` (Node/Express) e `python_api/` (FastAPI/face_recognition)
- **Supabase:** PostgreSQL usado pelo Prisma
- **Android:** `front-end-2/`, APK release apontando para as URLs HTTPS do Render

## Comece aqui

Leia **`DEPLOY_RENDER_VERCEL_SUPABASE.md`** e siga a ordem indicada.

## Arquivos de deploy

- `render.yaml` — Blueprint do Render para Backend + IA.
- `dashboard-react/vercel.json` — configuração do Vercel.
- `backend/prisma/migrations/` — migrations versionadas, incluindo segundo fator biométrico.
- `backend/prisma/seed.js` — seed idempotente com turmas 3 A e 3 B.
- `scripts/predeploy-check.ps1` — validação local antes de publicar.
- `scripts/build-flutter-release.ps1` — geração do APK release com URLs HTTPS.
- `scripts/create-android-keystore.ps1` — criação da chave de assinatura Android.

## Segurança

Nenhum segredo real está incluído neste repositório. Não versione `.env`, connection strings, JWT secrets, `IA_API_KEY`, senhas ou keystore Android.

O armazenamento biométrico do Python deve permanecer no Persistent Disk do Render em `/app/data`.
