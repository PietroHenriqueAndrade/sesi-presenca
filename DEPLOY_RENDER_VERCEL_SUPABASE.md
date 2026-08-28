# Tutorial de deploy — SESI Presença

Stack final:

- Dashboard React: **Vercel**
- Backend Node: **Render**
- API facial Python: **Render**
- PostgreSQL: **Supabase**
- Tablet: APK Flutter release usando HTTPS

> Não coloque secrets no GitHub. Não use `prisma migrate reset` em produção.

---

## 0. Antes de começar

No PowerShell, na raiz do projeto:

```powershell
.\scripts\predeploy-check.ps1
```

Se algum teste/build falhar, corrija antes de publicar.

Suba esta pasta para um repositório GitHub privado ou público. Render e Vercel vão usar o mesmo repositório.

---

## 1. Criar o PostgreSQL no Supabase

1. Crie um projeto no Supabase.
2. Escolha uma senha forte para o banco e guarde-a.
3. Abra **Connect** no projeto.
4. Copie a URL **Session pooler**, porta `5432`.
5. Para o Prisma neste Backend persistente do Render, use essa URL como `DATABASE_URL`.
6. Garanta conexão SSL. A URL pode terminar em `?sslmode=require` (ou `&sslmode=require` se já houver parâmetros).

Exemplo apenas de formato:

```text
postgresql://USUARIO:SENHA@REGIAO.pooler.supabase.com:5432/postgres?sslmode=require
```

Não coloque essa URL em arquivo versionado.

### Banco limpo

Não crie as tabelas manualmente no Supabase. O Render executará:

```text
npx prisma migrate deploy
```

usando as migrations do repositório.

---

## 2. Primeiro deploy do Dashboard no Vercel

Precisamos primeiro obter a URL do Dashboard para configurar CORS no Render.

1. No Vercel, escolha **Add New > Project**.
2. Importe o repositório GitHub.
3. Em **Root Directory**, escolha:

```text
dashboard-react
```

4. Framework: Vite (o `vercel.json` já está na pasta).
5. Faça o primeiro deploy mesmo sem as URLs finais. Nesse primeiro deploy o Dashboard pode abrir sem conseguir conectar às APIs; isso é esperado.
6. Copie a URL de produção, por exemplo:

```text
https://seu-dashboard.vercel.app
```

Use a origem sem `/` no final.

---

## 3. Criar Backend + Python no Render usando Blueprint

Na raiz existe:

```text
render.yaml
```

1. No Render, conecte sua conta GitHub.
2. Escolha **New > Blueprint**.
3. Selecione este repositório.
4. Render detectará `render.yaml`.
5. O Blueprint criará:
   - `sesi-presenca-api`
   - `sesi-presenca-face`

Durante a criação, informe os valores marcados como secretos/manuais:

### `DATABASE_URL`

Cole a Session Pooler URL do Supabase.

### `FRONTEND_URL`

Cole a URL do Vercel:

```text
https://seu-dashboard.vercel.app
```

### `CORS_ORIGINS`

Coloque a mesma URL:

```text
https://seu-dashboard.vercel.app
```

O Render gera automaticamente:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `IA_API_KEY`

O Blueprint compartilha automaticamente a mesma `IA_API_KEY` com o Python.

Também conecta Node e Python pela rede privada do Render usando `hostport` interno.

### Persistent Disk da biometria

O serviço Python é criado com disco:

```text
/app/data
```

É nesse diretório que ficam:

- `banco_alunos/`
- `mapeamento_alunos.json`

Não remova esse disk. Sem persistência, as biometrias seriam perdidas em redeploy/restart.

### Migrations

Antes de cada deploy do Backend, o Render executa:

```text
npx prisma migrate deploy
```

A migration do segundo fator biométrico já está incluída no projeto.

---

## 4. Copiar as URLs públicas do Render

Após os dois serviços ficarem Live, copie as URLs externas. Serão parecidas com:

```text
https://sesi-presenca-api.onrender.com
https://sesi-presenca-face.onrender.com
```

Use as URLs que o seu Render realmente mostrar.

Teste no navegador:

```text
https://SEU-BACKEND.onrender.com/api/health
https://SEU-PYTHON.onrender.com/health
```

Ambos devem retornar HTTP 200.

Depois teste:

```text
https://SEU-BACKEND.onrender.com/api/health/ready
```

Esse endpoint só retorna pronto quando PostgreSQL e Python estão acessíveis.

---

## 5. Configurar as URLs do Render no Vercel

Vercel > Project > Settings > Environment Variables.

Crie para **Production**:

```text
VITE_API_URL=https://SEU-BACKEND.onrender.com/api/v1
VITE_PYTHON_API_URL=https://SEU-PYTHON.onrender.com
```

Esses valores NÃO são secrets. Eles ficam disponíveis no JavaScript do navegador.

Depois faça **Redeploy** do Dashboard.

Abra o Dashboard e confira login e página de saúde do sistema.

---

## 6. Rodar o seed uma vez

O seed contém:

- turma 3 A
- turma 3 B
- 32 alunos do 3 B informados no TCC
- disciplinas
- grade conhecida do 3 A
- administrador

A grade do 3 B não foi inventada; configure pelo Dashboard depois.

No Render, abra o serviço `sesi-presenca-api` e use o Shell. Defina temporariamente:

```text
SEED_ADMIN_EMAIL=seu-email-administrativo
SEED_ADMIN_PASSWORD=UMA_SENHA_FORTE_COM_12_OU_MAIS_CARACTERES
SEED_CREATE_DEMO_USERS=false
SEED_RESET_PASSWORDS=false
```

Execute:

```bash
npm run seed
```

Depois remova `SEED_ADMIN_PASSWORD` das variáveis do serviço se não precisar rodar seed novamente.

O seed é idempotente: pode ser executado novamente sem duplicar os alunos pelas matrículas definidas.

### Listar IDs das turmas

No mesmo Shell:

```bash
npm run turmas:list
```

Anote o UUID da turma que o tablet vai atender.

---

## 7. Cadastrar a grade real do 3 B

Entre no Dashboard e cadastre os horários reais do 3 B antes de testar presença automática.

Sem horário ativo correspondente, o backend pode rejeitar/ignorar registro de presença dependendo da regra de horário.

---

## 8. Cadastrar biometrias em produção

Abra a página de biometria no Dashboard hospedado no Vercel.

Cadastre os alunos novamente no ambiente de produção. As três fotos/templates serão persistidas no disk do serviço Python.

Não coloque fotos biométricas dentro do GitHub.

---

## 9. Criar a chave de assinatura do Android

Uma única vez, no Windows:

```powershell
.\scripts\create-android-keystore.ps1
```

Guarde a keystore e as senhas fora do GitHub. Se perder a chave, você pode perder a capacidade de atualizar o mesmo aplicativo assinado.

---

## 10. Gerar o APK release

Depois de obter as URLs reais do Render e o UUID da turma:

```powershell
.\scripts\build-flutter-release.ps1 `
  -BackendUrl "https://SEU-BACKEND.onrender.com" `
  -PythonUrl "https://SEU-PYTHON.onrender.com" `
  -TurmaId "UUID-DA-TURMA"
```

O arquivo ficará em:

```text
front-end-2\build\app\outputs\flutter-apk\app-release.apk
```

Instale esse APK no tablet. Depois remova o cabo e abra o app pelo ícone.

O APK de produção não depende mais do IP LAN do PC.

---

## 11. Checklist final

- [ ] Supabase criado
- [ ] SSL usado na conexão PostgreSQL
- [ ] `prisma migrate deploy` concluído
- [ ] tabela `biometric_second_factors` criada
- [ ] Vercel publicado
- [ ] `FRONTEND_URL` igual à origem real do Vercel
- [ ] `CORS_ORIGINS` igual à origem real do Vercel
- [ ] Backend Render `/api/health` = 200
- [ ] Python Render `/health` = 200
- [ ] Backend `/api/health/ready` = 200
- [ ] Persistent Disk `/app/data` ativo
- [ ] seed executado com senha de admin forte
- [ ] 3 B aparece com 32 alunos
- [ ] grade real do 3 B cadastrada
- [ ] biometria de produção cadastrada
- [ ] login no Vercel funcionando
- [ ] teste de aluno desconhecido rejeitado
- [ ] teste de ambiguidade/segundo fator funcionando
- [ ] keystore Android guardada com segurança
- [ ] APK release instalado sem depender de USB
- [ ] backup/recovery do Supabase definido conforme o plano usado

---

## Custos/importante

O Python precisa de Persistent Disk porque as biometrias são arquivos persistentes. Persistent Disk do Render exige serviço pago. Não trate o filesystem efêmero de um serviço Free como armazenamento biométrico.

Para ambiente real, também avalie o plano do Supabase: projetos pagos possuem backups gerenciados; no Free, mantenha exportações regulares fora da plataforma.
