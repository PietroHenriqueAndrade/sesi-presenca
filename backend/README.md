# Attendance API - Sistema de Presença Escolar por Reconhecimento Facial

Backend Node.js/Express do TCC SENAI. Ele é a fonte central das regras de negócio e integra Flutter, PostgreSQL/Prisma, serviço Python de reconhecimento facial e o futuro Dashboard React.

## Arquitetura

Fluxo principal:

`Flutter -> Node.js/Express -> Python/FastAPI -> Node.js -> PostgreSQL`

O serviço Python identifica a face e envia ao Node apenas a identidade mapeada e o score de reconhecimento. O Node valida aluno, turma, regras de horário/duplicidade e persiste a presença.

## Pré-requisitos

- Node.js 20+ recomendado
- PostgreSQL
- serviço Python do repositório em execução

## Instalação limpa

Não copie `node_modules` entre máquinas. Na raiz de `backend`:

```bash
cp .env.example .env
npm ci
npx prisma generate
npx prisma migrate deploy
```

Como o `package.json` usa a configuração de seed do Prisma, também pode executar:

```bash
npx prisma db seed
```

Depois:

```bash
npm run dev
```

Servidor padrão: `http://0.0.0.0:3000`.

## Variáveis essenciais

Preencha no `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `IA_API_KEY` - deve ser igual à chave do Python
- `PYTHON_API_URL` - padrão recomendado `http://localhost:5000`
- `FRONTEND_URL` - origens permitidas para o futuro React

Para demonstração, o seed aceita:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_DEFAULT_PASSWORD`

Troque essas senhas fora do laboratório/demonstração.

## Banco de dados

Para ambiente já versionado, prefira migrations:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Evite `prisma db push` como procedimento de banca, porque ele pula o histórico de migrations.

## Endpoints centrais

Prefixo: `/api/v1`

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/recuperar-senha`
- `POST /auth/redefinir-senha`
- `/alunos`
- `/turmas`
- `/disciplinas`
- `/horarios`
- `/presencas`
- `/justificativas`
- `/alertas`
- `/relatorios`
- `/dashboard/resumo`
- `/ia` - rotas server-to-server protegidas por `IA_API_KEY`
- `/auditoria`
- `/usuarios`
- `/health`

O futuro React deve começar por `GET /api/v1/dashboard/resumo`; consulte `../DASHBOARD_REACT_CONTRATO.md`.

## Segurança implementada

- JWT access + refresh token
- rotação de refresh token
- `tokenVersion` para revogação global após troca/redefinição de senha
- blacklist persistida em PostgreSQL usando hash SHA-256 do JWT
- RBAC
- validação Zod
- Helmet
- CORS configurável
- rate limiting geral e específico de autenticação
- logs sem corpo/query sensível por padrão
- AuditLog
- `IA_API_KEY` separada para Python -> Node

## Health checks

- `GET /api/health`
- `GET /api/health/ready`

A readiness verifica dependências necessárias ao fluxo.

## Testes

Após `npm ci`:

```bash
npm test
```

O ZIP final não inclui `node_modules`; isso é intencional para evitar dependências incompletas ou específicas de outra máquina.

## Observação sobre frequência

A presença atual é escolar/diária por aluno e turma. O banco mantém unicidade por `aluno + turma + data`. As disciplinas e horários são usadas para contexto/relatórios, mas o modelo não representa uma chamada independente por cada aula. Isso está alinhado ao terminal de entrada do TCC; uma evolução para frequência por aula exigiria alteração do modelo de dados.
