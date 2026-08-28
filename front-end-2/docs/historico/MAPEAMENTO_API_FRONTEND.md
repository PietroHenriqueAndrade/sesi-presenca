# MAPEAMENTO API FRONTEND

Endpoints verificados no backend atual do ZIP.

| Funcionalidade Flutter | Repository | Endpoint futuro | Metodo | Payload esperado | Resposta esperada | Auth | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Login | AuthRepository | `/api/v1/auth/login` | POST | `{ email, senha }` | `{ status, data: { usuario, token, refreshToken } }` | Nao | Preparado |
| Refresh token | AuthRepository | `/api/v1/auth/refresh` | POST | `{ refreshToken }` | `{ status, data: { token, refreshToken } }` | Nao | Preparado |
| Logout | AuthRepository | `/api/v1/auth/logout` | POST | Header Bearer | `{ message }` | JWT | Preparado |
| Usuario atual | AuthRepository | `/api/v1/auth/me` | GET | Header Bearer | `{ status, data: usuario }` | JWT | Preparado |
| Listar alunos | AlunoRepository | `/api/v1/alunos` | GET | query futura | `{ status, data }` | JWT | Preparado |
| Criar aluno | AlunoRepository | `/api/v1/alunos` | POST | `{ nome, matricula, fotoTreinamento? }` | aluno | JWT ADMIN/SECRETARIA | Preparado |
| Atualizar aluno | AlunoRepository | `/api/v1/alunos/:id` | PATCH | `{ nome?, matricula?, fotoTreinamento? }` | aluno | JWT ADMIN/SECRETARIA | Preparado |
| Remover aluno | AlunoRepository | `/api/v1/alunos/:id` | DELETE | - | confirmacao | JWT ADMIN/SECRETARIA | Preparado |
| Upload foto aluno | AlunoRepository | `/api/v1/alunos/:id/foto` | POST | multipart `foto` | resultado validacao/IA | JWT ADMIN/SECRETARIA | Dependencia backend/IA |
| Frequencia aluno | PresencaRepository/Relatorio | `/api/v1/alunos/:id/frequencia` | GET | - | frequencia | JWT | Preparado |
| Listar turmas | TurmaRepository | `/api/v1/turmas` | GET | - | lista | JWT | Preparado |
| Criar turma | TurmaRepository | `/api/v1/turmas` | POST | `{ nome, anoLetivo, turno }` | turma | JWT ADMIN/SECRETARIA | Preparado |
| Atualizar turma | TurmaRepository | `/api/v1/turmas/:id` | PATCH | `{ nome?, anoLetivo?, turno? }` | turma | JWT ADMIN/SECRETARIA | Preparado |
| Alunos da turma | TurmaRepository | `/api/v1/turmas/:id/alunos` | GET | - | lista | JWT | Preparado |
| Frequencia turma | RelatorioRepository futuro | `/api/v1/turmas/:id/frequencia/consolidado` | GET | periodo | consolidado | JWT | Preparado |
| Listar disciplinas | DisciplinaRepository | `/api/v1/disciplinas` | GET | - | lista | JWT | Preparado |
| Criar disciplina | DisciplinaRepository | `/api/v1/disciplinas` | POST | `{ nome, codigo }` | disciplina | JWT ADMIN/SECRETARIA | Preparado |
| Atualizar disciplina | DisciplinaRepository | `/api/v1/disciplinas/:id` | PATCH | `{ nome?, codigo? }` | disciplina | JWT ADMIN/SECRETARIA | Preparado |
| Listar presencas | PresencaRepository | `/api/v1/presencas` | GET | paginacao futura | lista | JWT | Preparado |
| Presencas hoje | PresencaRepository | `/api/v1/presencas/hoje` | GET | - | lista | JWT | Preparado |
| Presencas por aluno | PresencaRepository | `/api/v1/presencas/aluno/:id` | GET | - | lista | JWT | Preparado |
| Presencas por turma | PresencaRepository | `/api/v1/presencas/turma/:id` | GET | - | lista | JWT | Preparado |
| Registrar presenca manual | PresencaRepository | `/api/v1/presencas` | POST | `{ alunoId, turmaId, disciplinaId?, status? }` | presenca | JWT | Preparado |
| Sincronizar offline | SyncRepository | `/api/v1/presencas/batch` | POST | lote de presencas | resultado batch | JWT | Preparado sem envio real |
| Registrar saida | PresencaRepository | `/api/v1/presencas/:id/saida` | PATCH | status/saida | presenca | JWT | Preparado |
| Reconhecimento IA | RecognitionRepository | `/api/v1/ia/registrar-presenca` | POST | `{ alunoId, turmaId, faceScore? }` | resultado reconhecimento/presenca | API key backend/IA | Preparado sem chamada real |
| Health IA | RecognitionRepository | `/api/v1/ia/health` | GET | - | status Python | Nao/API definida pelo backend | Preparado |
| Relatorio mensal | RelatorioController | `/api/v1/relatorios/mensal` | GET | query periodo | relatorio | JWT admin | Preparado |
| Relatorio cozinha | RelatorioController | `/api/v1/relatorios/cozinha` | GET | data | previsao | JWT | Preparado |
| Ausentes secretaria | RelatorioController | `/api/v1/relatorios/secretaria/ausentes` | GET | turma/data | lista | JWT | Preparado |
| Baixa frequencia | RelatorioController | `/api/v1/relatorios/secretaria/baixa-frequencia` | GET | limiar/periodo | lista | JWT | Preparado |

Nenhuma dessas chamadas esta ativa no frontend nesta etapa.
