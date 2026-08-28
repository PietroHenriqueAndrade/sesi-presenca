# PENDENCIAS DE INTEGRACAO

## BACKEND

### Validacao aluno-turma

Problema: a auditoria indicou ausencia de validacao do vinculo `TurmaAluno` antes de registrar presenca.

Arquivo/rota afetada: `POST /api/v1/presencas`, `POST /api/v1/ia/registrar-presenca`.

Impacto no frontend: o app pode enviar uma presenca com turma incorreta se o backend nao validar.

O que o backend precisa fazer: confirmar no service se o aluno pertence a turma antes de aceitar a presenca.

Prioridade: alta.

### Contrato de batch offline

Problema: o endpoint `POST /api/v1/presencas/batch` existe, mas o formato exato do payload precisa ser confirmado antes da integracao real.

Arquivo/rota afetada: `backend/src/modules/presencas/presenca.routes.js`.

Impacto no frontend: a fila local foi preparada, mas ainda nao envia lote.

O que o backend precisa fazer: documentar payload e resposta esperada no Swagger/README.

Prioridade: alta.

## PYTHON / RECONHECIMENTO

### Fluxo oficial Flutter -> backend -> Python

Problema: a proposta descreve o reconhecimento como servico independente, mas o frontend nao deve chamar Python diretamente sem decisao arquitetural.

Arquivo/rota afetada: `POST /api/v1/ia/registrar-presenca`, API Python.

Impacto no frontend: `RecognitionDataSource` esta preparado, mas sem integracao real.

O que o responsavel pela IA precisa fazer: confirmar o fluxo oficial e payloads.

Prioridade: critica.

### URL Python -> Node

Problema: a auditoria citou risco de URL sem `/api/v1` na comunicacao Python -> Node.

Arquivo/rota afetada: `python_api/main.py`, `.env` da API Python.

Impacto no frontend: pode impedir validacao ponta a ponta do reconhecimento.

O que o responsavel pela IA precisa fazer: garantir `NODE_API_URL` com prefixo correto ou compor a rota com `/api/v1`.

Prioridade: critica.

## BANCO

### Identificadores reais

Problema: o frontend mock usa IDs simples; o backend usa UUID.

Arquivo/rota afetada: entidades Prisma de alunos, turmas, disciplinas e presencas.

Impacto no frontend: data sources reais devem tratar UUIDs sem converter para IDs locais.

O que o responsavel pelo banco precisa fazer: manter contratos de ID estaveis e documentados.

Prioridade: media.

## DOCUMENTACAO

### Dashboard React

Problema: a auditoria afirma que Dashboard React era responsabilidade do frontend, mas a proposta oficial extraida descreve explicitamente Flutter como camada de apresentacao movel.

Arquivo/rota afetada: documentacao geral do TCC.

Impacto no frontend: nao implementei React dentro do projeto Flutter.

O que a equipe precisa fazer: confirmar se React ainda pertence ao escopo. Se sim, criar projeto separado.

Prioridade: media.
