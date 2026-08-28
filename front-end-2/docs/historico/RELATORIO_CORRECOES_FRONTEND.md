# RELATORIO DE CORRECOES DO FRONTEND

Durante esta etapa do desenvolvimento, realizei a reorganizacao da camada de dados do frontend Flutter para deixar o aplicativo funcional em modo isolado e preparado para integracao futura com o backend Node.js.

## 1. Objetivo da etapa

Preparar o frontend para conversar futuramente com o backend sem realizar integracao real nesta etapa. O foco foi separar responsabilidades, isolar mocks, criar infraestrutura de API, implementar fila offline local e documentar pendencias.

## 2. Problemas encontrados

- Repositories dependiam diretamente de `MockData`.
- Login de demonstracao estava implementado como regra dentro do repository.
- Tela de sincronizacao usava quantidade fixa de registros pendentes.
- Reconhecimento facial retornava mock sem registrar pendencia offline real.
- Models aceitavam campos diferentes dos nomes reais do backend.
- `widget_test.dart` ainda era o teste padrao do contador.

## 3. Arquivos alterados

- `pubspec.yaml`
- `README.md`
- `lib/repositories/*`
- `lib/controllers/sync_controller.dart`
- `lib/controllers/relatorio_controller.dart`
- `lib/models/*`
- `lib/screens/sync/sync_screen.dart`
- `test/widget_test.dart`

## 4. Arquitetura antes

Antes, as telas consumiam controllers, os controllers chamavam repositories, e os repositories acessavam dados mockados diretamente ou mantinham listas em memoria.

## 5. Arquitetura depois

A estrutura passou a seguir:

UI -> Controllers/Providers -> Repositories -> Data Sources -> Mock/Local/Futuro API

Foram adicionadas as pastas:

- `lib/core/network`
- `lib/core/session`
- `lib/data/dto`
- `lib/data/mock`
- `lib/data/local`

## 6. Melhorias realizadas

- Centralizei endpoints futuros em `ApiEndpoints`.
- Criei `ApiClient`, `ApiConfig`, `ApiException` e `ApiResponse`.
- Isolei os mocks em `lib/data/mock`.
- Criei DTOs para aluno, turma, disciplina, usuario e presenca.
- Mantive as telas funcionando sem backend.
- Ajustei repositories para dependerem de data sources.

## 7. Persistencia offline

Implementei uma fila local com SQLite por meio de `SyncQueueDataSource` e `SqliteSyncQueueDataSource`. Tambem criei uma factory condicional para usar fila em memoria no Flutter Web durante desenvolvimento. Cada item armazena identificador local, operacao, payload, data de criacao, tentativas, status, ultima tentativa e erro.

## 8. Preparacao para API

Mapeei o prefixo real `/api/v1` e os endpoints existentes no backend atual. O `ApiClient` foi criado, mas a integracao fica bloqueada por `API_INTEGRATION_ENABLED=false`.

## 9. Autenticacao

Refatorei a autenticacao para usar `AuthDataSource` e `SessionManager`. As credenciais de demonstracao ficaram isoladas no mock, sem virar regra permanente do repository.

## 10. Reconhecimento

Criei `RecognitionDataSource` e `MockRecognitionDataSource`. Quando o reconhecimento mock tem sucesso, o app grava um registro real na fila offline local.

## 11. Responsividade

Mantive a estrutura existente de responsividade do projeto, voltada para tablet Android, celular, desktop e web de desenvolvimento.

## 12. Testes realizados

Atualizei o `widget_test.dart` e criei `sync_queue_test.dart`. O `dart format .` foi executado com sucesso usando o Dart SDK direto. O `flutter pub get`, `flutter analyze` e `flutter test` nao puderam ser concluidos porque o comando `flutter` local travou sem saida, inclusive em `flutter --version`.

## 13. Problemas corrigidos

- MockData removido da pasta `repositories`.
- Repositories desacoplados de listas globais diretas.
- Sincronizacao deixou de exibir `registrosPendentes: 7`.
- Fila offline local criada.
- Reconhecimento passou a gerar pendencia real local.
- Teste padrao do contador foi corrigido.

## 14. Pendencias

- Ligar `ApiDataSource` reais ao backend.
- Resolver `turmaId` real no registro offline de reconhecimento.
- Validar fluxo real com token JWT e refresh token.
- Rodar `flutter pub get`, `flutter analyze` e `flutter test` em um SDK Flutter local funcional.

## 15. Proximos passos para integracao

Na proxima etapa, devo implementar data sources reais para auth, alunos, turmas, disciplinas, presencas, reconhecimento e relatorios. A troca principal devera acontecer nos data sources, preservando controllers e telas.

Nenhuma integracao real com backend ou Python foi realizada nesta etapa.
