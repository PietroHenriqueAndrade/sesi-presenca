# Ligar tudo — Render + Supabase + Vercel + Flutter

Este projeto já separa os serviços assim:

- Supabase: PostgreSQL
- Render `sesi-presenca-api`: Backend Node
- Render `sesi-presenca-face`: API facial Python
- Vercel: Dashboard React
- APK Flutter: terminal de reconhecimento

## 1. Confirme os serviços publicados

Abra no navegador usando as URLs REAIS mostradas no Render:

- `https://SEU-BACKEND.onrender.com/api/health`
- `https://SEU-BACKEND.onrender.com/api/health/ready`
- `https://SEU-PYTHON.onrender.com/health`
- `https://SEU-PYTHON.onrender.com/health/ready`

O `/api/health/ready` do Backend deve conseguir alcançar PostgreSQL e Python.

## 2. Variáveis do Render

Backend Node:

- `NODE_ENV=production`
- `DATABASE_URL=<connection string do Supabase>`
- `FRONTEND_URL=https://SEU-DASHBOARD.vercel.app`
- `JWT_SECRET=<secret>`
- `JWT_REFRESH_SECRET=<secret diferente>`
- `IA_API_KEY=<secret compartilhado com Python>`
- `PYTHON_INTERNAL_HOSTPORT=<configurado pelo Blueprint>`
- `IA_MIN_CONFIDENCE_SCORE=0.70`
- `ALLOW_LOCAL_CORS=false`
- `ENABLE_API_DOCS=false`
- `TRUST_PROXY_HOPS=1`

Python IA:

- `APP_ENV=production`
- `NODE_INTERNAL_HOSTPORT=<configurado pelo Blueprint>`
- `IA_API_KEY=<mesma chave do Backend>`
- `CORS_ORIGINS=https://SEU-DASHBOARD.vercel.app`
- `BIOMETRIC_DATA_DIR=/app/data`
- `NODE_MIN_FACE_SCORE=0.70`
- `FACE_TOLERANCE=0.52`
- `FACE_MARGIN=0.07`
- `FACE_BLUR_RECOGNITION_MIN=35`
- `FACE_BLUR_ENROLL_MIN=45`

## 3. Vercel

- `VITE_API_URL=https://SEU-BACKEND.onrender.com/api/v1`
- `VITE_PYTHON_API_URL=https://SEU-PYTHON.onrender.com`

Depois de alterar variáveis no Vercel, faça Redeploy.

## 4. Assine o APK uma vez

Na raiz do projeto:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\create-android-keystore.ps1
```

Faça backup de:

- `front-end-2/android/app/upload-keystore.jks`
- `front-end-2/android/key.properties`

Não envie esses arquivos para Git.

## 5. Gere o APK apontando para o Render

Na raiz do projeto:

```powershell
.\scripts\build-flutter-release.ps1 `
  -BackendUrl "https://SEU-BACKEND.onrender.com" `
  -PythonUrl "https://SEU-PYTHON.onrender.com"
```

O script primeiro testa os dois serviços e depois gera:

`front-end-2/build/app/outputs/flutter-apk/app-release.apk`

Não é necessário `TCC_TURMA_ID` no fluxo atual: a turma utilizada no reconhecimento é a turma associada ao aluno no mapeamento biométrico criado durante o cadastro.

## 6. Instale no tablet

Com USB e depuração USB habilitada:

```powershell
adb install -r .\front-end-2\build\app\outputs\flutter-apk\app-release.apk
```

Se `adb` não existir no PATH, entre em `front-end-2` e use:

```powershell
flutter install --release
```

Depois remova o cabo, feche o aplicativo e abra pelo ícone. O tablet só precisa de Internet para acessar o Render por HTTPS.

## 7. Teste final

1. Login no APK.
2. Permita câmera.
3. Confirme que a tela biométrica abre.
4. Faça um reconhecimento de aluno cadastrado.
5. Confirme a presença no Dashboard/Vercel e no Supabase.
6. Feche e abra novamente o APK sem USB.
7. Teste também rosto desconhecido e imagem ruim; devem ser rejeitados.
