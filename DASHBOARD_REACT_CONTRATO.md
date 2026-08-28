# Contrato do Dashboard React — rota SESI

O React é o painel administrativo e **não recalcula regras de presença**.

## APIs principais

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/dashboard/resumo`
- `GET /api/v1/alunos`
- `GET /api/v1/presencas`
- `GET /api/v1/turmas`
- `GET /api/v1/disciplinas`
- `GET/PATCH /api/v1/justificativas/...`
- `GET/PATCH /api/v1/alertas/...`
- `GET /api/v1/relatorios/...`
- `GET /api/v1/auditoria` (ADMIN)

## Biometria

### Criar autorização de cadastro

`POST /api/v1/ia/sessao-cadastro`

Bearer JWT de ADMIN/SECRETARIA:

```json
{ "alunoId": "UUID", "senha": "senha-do-operador" }
```

Resposta contém `enrollmentToken` por 5 minutos e dados oficiais do aluno/turma.

### Capturar fotos

React chama `POST {PYTHON_API_URL}/cadastrar` três vezes (`numero_foto=1..3`) com `enrollment_token` + imagem.

### Caso especial / gêmeos

- `GET /api/v1/alunos/:id/segundo-fator`
- `POST /api/v1/alunos/:id/segundo-fator` — gera/rotaciona código, exibido uma vez;
- `DELETE /api/v1/alunos/:id/segundo-fator`.

O hash é armazenado no banco, não o código em texto puro.
