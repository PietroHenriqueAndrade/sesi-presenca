# Relatório técnico — Recálculo de rota SESI

## 1. Decisão de produto

O aplicativo Android deixa de competir com o Dashboard. Ele passa a cumprir um objetivo único: **ser um terminal de presença facial**. O fluxo ativo é Splash → Login → Reconhecimento. Administração e cadastro biométrico foram centralizados no React.

Isso reduz navegação, superfície de erro no tablet e risco de alunos alcançarem telas administrativas.

## 2. Identidade SESI

A paleta principal foi padronizada em vermelho `#E30613`, branco e neutros de alto contraste. Logo local é usada em Flutter, WebView, React e página diagnóstica do Python, evitando dependência de internet durante a banca.

## 3. Flutter / terminal

### Mudanças

- login seguido diretamente do reconhecimento;
- rotas administrativas removidas do fluxo ativo;
- perfis `COZINHA` e `SISTEMA_IA` não operam o terminal;
- WebView SESI responsiva com câmera circular robusta;
- feedback de sucesso sem fechar a WebView;
- retorno automático ao estado “próximo aluno”;
- modal de segundo fator para identidade ambígua/caso especial;
- logout e expiração de sessão tratados por canal JavaScript ↔ Flutter;
- logo e HTML/CSS/JS servidos por loopback dentro do APK.

### Correção da tela preta

O fluxo antigo podia executar `Navigator.pop` após `presenca_processada`. Na nova arquitetura a WebView é a tela principal; portanto a confirmação apenas altera o estado visual por alguns segundos e mantém a câmera aberta.

## 4. Cadastro facial anti-abuso

O cadastro foi removido do terminal e implementado no Dashboard React.

Fluxo:

1. ADMIN/SECRETARIA autenticado seleciona um aluno oficial;
2. o operador confirma a própria senha;
3. o Node revalida a senha e gera JWT de propósito `biometric_enrollment`, validade de 5 minutos, vinculado a operador + aluno + turma;
4. o React envia somente `enrollment_token`, número da foto e imagem ao Python;
5. o Python valida o token via Node usando `IA_API_KEY`;
6. nome/UUID/turma são recebidos do Backend — não são confiados ao navegador;
7. são exigidas três imagens guiadas;
8. conclusão atualiza `fotoTreinamento` e gera AuditLog.

Isso impede que um aluno comum use o terminal para escolher o nome de outra pessoa e cadastrar seu próprio rosto. Uma conta administrativa deixada aberta ainda exige a senha do operador para iniciar novo cadastro.

## 5. Melhorias da IA

### Cadastro

- Pillow/EXIF → RGB 8-bit → NumPy C-contiguous;
- imagem BGR é derivada apenas quando necessária ao OpenCV;
- limite de tamanho de upload;
- rejeição de foto borrada;
- exatamente um rosto;
- tamanho mínimo do rosto;
- três poses (frente, leve esquerda, leve direita);
- encoding calculado antes de persistir a etapa;
- identidade de arquivo baseada no UUID do aluno.

### Reconhecimento

- normalização RGB/uint8/contiguous antes do dlib;
- tentativa controlada de orientação quando nenhum rosto aparece;
- exatamente um rosto por captura;
- tamanho mínimo;
- comparação agrupada por identidade, usando múltiplas fotos por aluno;
- distância agregada ponderando melhor amostra + consistência;
- `FACE_TOLERANCE` padrão reduzido para `0.43`;
- margem de ambiguidade padrão elevada para `0.07`;
- quando os dois melhores candidatos são próximos, a IA **não escolhe** automaticamente.

## 6. Gêmeos idênticos / rostos muito semelhantes

Reconhecimento facial convencional não deve ser tratado como infalível para gêmeos idênticos. Por isso o projeto usa duas camadas:

1. **detecção automática de ambiguidade**: candidatos próximos são recusados como decisão facial única;
2. **caso especial administrado**: ADMIN/SECRETARIA pode ativar segundo fator para um aluno. Mesmo se a face parecer clara, o Node exige o código.

O código pessoal:

- possui 6 dígitos;
- é gerado criptograficamente no Node;
- é salvo apenas como hash bcrypt;
- é exibido ao operador apenas na resposta de criação/rotação;
- possui rate limit específico de 8 tentativas/minuto na confirmação;
- é usado dentro de desafio assinado HMAC, validade de 2 minutos;
- desafio concluído é single-use.

O objetivo não é prometer separar gêmeos somente pela face; é **falhar com segurança** e usar um fator individual quando necessário.

## 7. Dashboard React

O painel agora concentra:

- visão geral consolidada;
- alunos e status de biometria;
- presenças com data/status e exportação CSV;
- turmas e disciplinas;
- justificativas;
- alertas;
- relatórios/baixa frequência;
- auditoria ADMIN;
- previsão da cozinha;
- health/readiness da stack;
- cadastro biométrico protegido;
- configuração de segundo fator para gêmeos/casos especiais.

RBAC de interface respeita os papéis do Backend.

## 8. Backend / Banco

Adicionado `BiometricSecondFactor` com relação 1:1 para `Aluno`. Cadastro facial usa sessão curta reautenticada. Reconhecimento marcado como caso especial retorna HTTP 428 até o segundo fator ser validado. Confirmação usa rate limiter dedicado.

Em instalação limpa desta entrega, executar `npx prisma db push` para criar/atualizar a tabela, pois o repositório não possui migrations completas para `migrate deploy`.

## 9. Compatibilidade dlib / Windows

A equipe observou `Unsupported image type, must be 8bit gray or RGB image` mesmo após conversão RGB. Para reduzir a instabilidade do stack legado no Windows, o ambiente recomendado é Python 3.11 com:

- `numpy==1.26.4`;
- `opencv-python==4.10.0.84`;
- `setuptools<81`;
- `face-recognition==1.3.0`;
- `face-recognition-models==0.3.0`.

Também é obrigatório conferir que `face_recognition.__file__` pertence à `.venv`, evitando mistura com a instalação global do Python.

## 10. Testes e validações desta rodada

Executados no ambiente de auditoria:

- `node --check` em JavaScript/MJS;
- 11/11 testes puros de regras Node;
- 22/22 testes Python, incluindo desafio single-use, contrato de cadastro e cenário de identidades muito próximas;
- 3/3 testes unitários de sessão React;
- parsing JSX de `App.jsx` e `main.jsx` via compilador TypeScript;
- `py_compile` do serviço Python;
- verificação de imports relativos Dart;
- verificação de assets do Flutter.

Limitações do ambiente de auditoria:

- Flutter SDK não está instalado aqui, então `flutter analyze/test/build` deve ser rodado no PC da equipe;
- instalação npm externa do React não concluiu neste ambiente, então o `vite build` final deve ser executado após `npm install` no PC;
- não há PostgreSQL de demonstração configurado aqui para validar o novo model Prisma em runtime;
- câmera/dlib real e diferenciação de gêmeos precisam de ensaio físico.

## 11. Critério de pronto para banca

A entrega só deve ser considerada comprovadamente pronta depois de executar o E2E descrito em `VALIDACAO_PRE_BANCA.md`, especialmente cadastro pelo React, reconhecimento no tablet, segundo fator de caso especial e permanência da câmera após sucesso.
