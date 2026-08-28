# Dashboard SESI Presença — React

Painel administrativo React/Vite. A regra de negócio permanece no Backend Node.

## Funções

- indicadores consolidados (`/dashboard/resumo`);
- alunos e situação de biometria;
- presenças com filtros e CSV;
- turmas e disciplinas;
- justificativas e alertas;
- relatórios e baixa frequência;
- auditoria para ADMIN;
- previsão da cozinha;
- health/readiness dos serviços;
- **cadastro biométrico protegido**;
- **segundo fator para gêmeos/casos especiais**.

## Cadastro biométrico protegido

ADMIN/SECRETARIA seleciona o aluno e confirma a própria senha. O Node emite um token de 5 minutos amarrado ao aluno e à turma. O Python obtém a identidade oficial desse token e captura três poses. O navegador não decide livremente qual UUID será salvo.

## Executar

```powershell
Copy-Item .env.example .env
npm install
npm run test:unit
npm run build
npm run dev
```

`.env` local:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_PYTHON_API_URL=http://localhost:5000
```
