# Validação da entrega

## Passou neste ambiente

- `render.yaml`: YAML válido e estrutura esperada (2 serviços, disk e migrate deploy).
- `dashboard-react/vercel.json`: JSON válido.
- `python_api/docker-entrypoint.sh`: sintaxe shell válida.
- Python: `py_compile` em `main.py`, `core_utils.py`, `image_utils.py` e `run.py`.
- Node: `node --check` nos arquivos alterados de produção, integração, seed e listagem de turmas.
- Backend regras de negócio: 11/11 testes passaram.
- Dashboard sessão/autenticação: 3/3 testes passaram.
- Python: 22/22 testes passaram.
- Seed 3 B: 32 nomes conferidos.

## Deve ser executado antes do primeiro deploy

No ambiente desta auditoria, a instalação disponível de dependências Node estava parcial (Prisma/Vite CLI incompletos), e Flutter/Docker não estavam instalados. Por isso estes checks devem ser executados no PC de desenvolvimento com internet/dependências completas:

```powershell
.\scripts\predeploy-check.ps1
```

O script executa `npm ci`, `prisma validate`, testes/build do Dashboard, testes Python e Flutter analyze/test quando Flutter estiver instalado.

Também gere o APK final somente depois que as URLs reais do Render existirem.
