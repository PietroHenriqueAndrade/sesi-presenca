# Auditoria final — stack Render + Vercel + Supabase

## Situação

O projeto foi adaptado para a stack de produção escolhida sem alterar a identidade visual ou o fluxo funcional principal.

## Correções de produção presentes

- Migration versionada para `biometric_second_factors`.
- `prisma migrate deploy` no pipeline do Backend Render.
- Seed idempotente com 3 A e 3 B.
- Seed de produção bloqueia senha de administrador fraca.
- Usuários professores de demonstração não são criados em produção por padrão.
- Node e Python usam a rede privada do Render para comunicação server-to-server.
- A mesma `IA_API_KEY` é compartilhada automaticamente via Blueprint.
- JWT secrets são gerados pelo Render e não ficam no Git.
- CORS de produção exige a origem HTTPS do Vercel.
- Python usa Docker reproduzível por depender de dlib/face_recognition e bibliotecas do sistema.
- Templates/fotos biométricos usam Persistent Disk em `/app/data`.
- O APK release exige HTTPS para serviços remotos.
- APK release exige keystore própria.
- Tokens Flutter usam armazenamento seguro.
- Vercel recebe apenas URLs públicas `VITE_*`; nenhum segredo é colocado no frontend.

## Limitações arquiteturais conhecidas

O Python roda com uma única instância porque o banco facial e parte do estado de desafio ficam em memória e o Persistent Disk do Render só pode ser anexado a uma instância. Para a escala de um TCC/escola isso é aceitável. Escala horizontal futura exigiria mover templates/estado para armazenamento compartilhado.

A grade real do 3 B não foi fornecida e não foi inventada. Cadastre-a pelo Dashboard antes de usar presença automática dessa turma.

## O que não deve ser usado nesta stack

- Caddy próprio
- docker-compose de produção em VPS
- PostgreSQL local como banco de produção
- `prisma db push` para deploy
- IP LAN fixo no APK de produção
- chave Android de debug
