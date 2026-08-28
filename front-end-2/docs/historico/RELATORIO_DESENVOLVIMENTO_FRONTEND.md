# Relatório de Desenvolvimento — Frontend do Aplicativo

**Projeto:** Sistema de Controle de Presença Escolar Baseado em Reconhecimento Facial e Gestão Automatizada de Frequência
**Etapa:** Desenvolvimento do Frontend (Aplicativo Flutter)
**Tecnologias:** Flutter / Dart · Material Design 3 · Provider

---

## 1. Objetivo da atividade

Nesta etapa do TCC, minha responsabilidade foi desenvolver **toda a interface do aplicativo Flutter** do sistema de controle de presença escolar baseado em reconhecimento facial. O objetivo foi construir o frontend completo — telas, navegação, componentes e fluxos — utilizando **dados fictícios (mockados)**, sem qualquer integração com o backend, com o reconhecimento facial real ou com banco de dados. Dessa forma, a interface pôde ser validada visualmente e funcionalmente de forma independente, ficando totalmente preparada para receber, em uma etapa posterior, as integrações com a API (`attendance-api`) desenvolvida pelos demais integrantes da equipe.

## 2. Planejamento

Antes da implementação, realizei o planejamento do aplicativo em três frentes:

- **Mapeamento das telas:** a partir dos requisitos do TCC, defini as oito telas necessárias para cobrir o fluxo completo de uso do tablet na escola: Splash, Tela Inicial, Reconhecimento Facial (simulado), Sucesso, Erro, Histórico, Sincronização e Configurações.
- **Fluxo de navegação:** desenhei o fluxo principal (Splash → Home → Reconhecimento → Sucesso/Erro → Home) e os fluxos secundários (Home → Histórico / Sincronização / Configurações), optando por **rotas nomeadas** centralizadas, o que facilita a manutenção e a inclusão de novas telas.
- **Arquitetura:** defini uma organização em camadas separando tema, constantes, modelos, repositórios de dados, controllers, providers, rotas, telas e widgets reutilizáveis. A decisão mais importante foi concentrar **todo o acesso a dados na camada de repositórios**: as telas nunca acessam os mocks diretamente, o que permitirá trocar os dados fictícios pelas chamadas reais à API sem alterar nenhuma tela.

Também foram definidos previamente a paleta de cores (azul como cor dominante, branco e cinza como neutros), o uso do Material Design 3 e a responsividade voltada a tablets Android, que serão os dispositivos utilizados nos pontos de autenticação da escola.

## 3. Desenvolvimento

### 3.1 Arquitetura e organização das pastas

O projeto foi organizado dentro de `Tcc_Face/lib/` da seguinte forma:

```
lib/
├── core/
│   ├── theme/         # app_colors.dart, app_theme.dart (tema global MD3)
│   ├── constants/     # app_constants.dart, app_strings.dart (textos centralizados)
│   └── utils/         # app_formatters.dart (datas pt-BR), responsive.dart
├── models/            # aluno, presenca, horario, notificacao, sync_status
├── repositories/      # mock_data + repositórios (camada de troca pela API)
├── providers/         # theme_provider, locale_provider, app_status_provider
├── controllers/       # recognition, history e sync (lógica de tela)
├── routes/            # app_routes.dart (rotas nomeadas + transições)
├── screens/           # splash, home, recognition, history, sync, settings
├── widgets/           # componentes reutilizáveis
└── main.dart
```

### 3.2 Tema global e identidade visual

Criei um tema global Material 3 (`AppTheme`) com variações **clara e escura**, ambas derivadas da paleta azul/branco/cinza definida em `AppColors`. O tema padroniza botões (altura mínima de 56dp, cantos arredondados), cards com borda sutil, campos de texto, diálogos, snackbars e tipografia — assim nenhuma tela define estilos próprios, garantindo consistência visual em todo o aplicativo.

### 3.3 Modelos e dados mockados

Foram criados os modelos `Aluno`, `Presenca` (com enum de status: presente, atrasado, saída antecipada, ausente), `Horario`, `Notificacao` e `SyncStatus`. Todos já possuem `fromJson`/`toJson` compatíveis com a serialização que será usada na integração real. Os dados fictícios ficam concentrados em `MockData` (alunos, histórico de presenças com datas relativas ao dia atual, grade horária e notificações), e todos os pontos de futura integração estão sinalizados no código com o comentário:

```dart
// TODO: Substituir dados mockados pela API quando o backend for integrado.
```

### 3.4 Repositórios, controllers e providers

- **Repositórios** (`ReconhecimentoRepository`, `PresencaRepository`, `EscolaRepository`, `SyncRepository`): simulam a latência de rede com `Future.delayed` e devolvem os dados mockados. São o único ponto do código que precisará ser alterado na integração.
- **Controllers** (`ChangeNotifier` com Provider): `RecognitionController` controla os estados do reconhecimento (aguardando → processando → sucesso/erro); `HistoryController` gerencia carregamento, busca por nome/RA e filtro por status; `SyncController` simula a verificação em etapas de Internet, Servidor e Banco local.
- **Providers globais:** `ThemeProvider` (tema claro/escuro), `LocaleProvider` (idioma, apenas visual nesta etapa) e `AppStatusProvider` (status Online/Offline simulado).

### 3.5 Navegação

Toda a navegação usa **rotas nomeadas** definidas em `AppRoutes`, com `onGenerateRoute` centralizando a criação das telas e as transições animadas (fade para telas de resultado, deslizamento horizontal entre seções e vertical para o fluxo de reconhecimento). A tela de sucesso recebe os dados do aluno reconhecido por meio de argumentos de rota, exatamente como ocorrerá com os dados reais.

### 3.6 Animações e responsividade

Implementei animações suaves em pontos estratégicos: entrada da logo na splash (escala + fade), arco giratório no círculo de enquadramento facial (`CustomPainter` + `AnimationController`), ícones de sucesso/erro com efeito elástico, contagem animada de registros pendentes e transições entre telas. Para tablets, o utilitário `Responsive` ajusta paddings, aumenta o círculo de enquadramento e limita a largura máxima do conteúdo (720dp), mantendo a leitura confortável em telas grandes.

## 4. Telas implementadas

| Tela | Finalidade |
|---|---|
| **Splash Screen** | Apresenta a logo e o nome do sistema com animação e indicador de carregamento; navega automaticamente para a Home. |
| **Tela Inicial (Home)** | Exibe data por extenso, relógio em tempo real, indicador de status 🟢 Online / 🔴 Offline (alternável para demonstração), botão principal "Iniciar Reconhecimento Facial", botão "Histórico", atalhos para Sincronização e Configurações, card de próxima aula e painel de notificações (bottom sheet). |
| **Reconhecimento Facial** | Simulação sem câmera real: círculo de enquadramento animado, mensagem "Posicione seu rosto" e botão "Simular Reconhecimento", que exibe o loading e direciona ao resultado. |
| **Tela de Sucesso** | Mostra a foto fictícia (avatar), nome (João da Silva), RA (202600123), turma (3º DS), horário e a mensagem "Entrada registrada com sucesso", com botão Voltar. |
| **Tela de Erro** | Mensagem "Face não reconhecida" com orientações, botão "Tentar novamente" e retorno ao início. |
| **Histórico** | Lista mockada de registros em cards modernos (aluno, entrada, saída, data e status com selo colorido), com busca por nome/RA, filtros por situação e pull-to-refresh. |
| **Sincronização** | Painel visual com o estado da Internet, do Servidor e do Banco local, contador de registros pendentes, última sincronização e botão "Sincronizar" com verificação animada em etapas. |
| **Configurações** | Alternância de tema claro/escuro (funcional), seleção de idioma (visual), versão do aplicativo e diálogo "Sobre o sistema". |

## 5. Componentes criados

Todos os componentes reutilizáveis ficam em `lib/widgets/`:

- **AppButton** — botão com variações primária/secundária/contornada, ícone e estado de loading;
- **AppCard** — card padrão com borda sutil e suporte a toque;
- **AppInput** — campo de texto padronizado com ícone;
- **AppSnackbar** — snackbars de sucesso, erro e informação;
- **AppDialog** — diálogos informativos e de confirmação;
- **AppLoading** — indicador de carregamento com rótulo;
- **StatusIndicator** — ponto colorido + rótulo (Online/Offline, conexões);
- **StatusBadge** — selo colorido para a situação da presença;
- **StudentAvatar** — avatar fictício do aluno com iniciais;
- **SectionHeader** — cabeçalho de seção;
- **FaceFrame** — círculo de enquadramento facial animado (CustomPainter).

## 6. Estrutura do projeto

A separação em camadas (core / models / repositories / controllers / providers / routes / screens / widgets) garante que cada arquivo tenha uma responsabilidade única. Essa organização facilita a manutenção porque: (1) alterações visuais ficam restritas a `core/theme` e `widgets`; (2) alterações de dados ficam restritas a `repositories`; (3) novas telas exigem apenas um arquivo em `screens` e uma linha em `routes`; e (4) os textos centralizados em `app_strings.dart` preparam o app para internacionalização. Não há duplicação de estilos nem de lógica entre as telas.

## 7. Preparação para integração

O frontend foi desenvolvido inteiramente sobre dados mockados justamente para permitir testes visuais e de navegação sem dependência do backend. A estrutura já está pronta para a integração: os repositórios possuem assinaturas assíncronas (`Future`) idênticas às que as chamadas HTTP reais terão, os modelos já implementam `fromJson`/`toJson`, e todos os pontos de troca estão marcados com o comentário `// TODO: Substituir dados mockados pela API quando o backend for integrado.` Assim, quando a `attendance-api` estiver disponível, bastará substituir o corpo dos métodos dos repositórios pelas requisições reais — sem alterar telas, controllers ou widgets.

## 8. Desafios encontrados

- **Simular o reconhecimento facial sem câmera:** para transmitir a sensação real de leitura biométrica, desenvolvi o widget `FaceFrame` com `CustomPainter`, desenhando um anel pontilhado e um arco giratório com gradiente. Foi necessário ajustar a animação para reagir ao estado de processamento.
- **Cobrir os dois resultados do fluxo:** como não há backend, o repositório de reconhecimento retorna sucesso em cerca de 80% das tentativas e erro nas demais, permitindo validar visualmente tanto a tela de sucesso quanto a de erro.
- **Responsividade para tablets:** os componentes foram planejados para telas grandes (limite de largura do conteúdo, alvos de toque de 56dp e paddings adaptativos), evitando que a interface ficasse "esticada" nos tablets da escola.
- **Manter o app desacoplado do backend:** exigiu disciplina para que nenhuma tela acessasse os mocks diretamente; toda leitura de dados passa pelos repositórios, o que foi essencial para deixar a integração futura simples.

## 9. Considerações finais

O frontend do aplicativo foi concluído de forma **modular, organizada, responsiva e totalmente navegável**, cobrindo todas as telas e fluxos previstos para a operação nos tablets da escola: abertura, registro de presença por reconhecimento facial (simulado), consulta de histórico, acompanhamento da sincronização offline e configurações. Nenhuma regra de negócio, autenticação real ou conexão com banco foi implementada nesta etapa, conforme o escopo definido. A arquitetura em camadas, os modelos serializáveis e a concentração dos dados fictícios na camada de repositórios deixam o projeto preparado para receber, na próxima etapa, as integrações com o backend (`attendance-api`) e com o serviço de reconhecimento facial desenvolvidos pelos demais integrantes da equipe.
