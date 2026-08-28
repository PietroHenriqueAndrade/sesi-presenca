# SESI Presença — Terminal Flutter

O Flutter foi simplificado para funcionar como **terminal de presença**.

## Fluxo ativo

```text
Splash → Login → Reconhecimento facial
```

Cadastros de aluno/turma/biometria, relatórios e decisões administrativas pertencem ao Dashboard React.

## Executar no emulador

```powershell
flutter clean
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=TCC_SERVER_IP=10.0.2.2 --dart-define=TCC_TURMA_ID=<UUID_DA_TURMA>
```

## Tablet físico

Use o IPv4 do computador que hospeda Node/Python e mantenha ambos na mesma rede:

```powershell
flutter run --dart-define=TCC_SERVER_IP=192.168.x.x --dart-define=TCC_TURMA_ID=<UUID_DA_TURMA>
```

A WebView é servida por um HTTP loopback embutido no APK; não depende de Live Server nem `adb reverse` para carregar a interface.

## Correção do analyzer

A versão anterior do recálculo de rota ainda continha telas administrativas antigas dentro de `lib/`. Elas foram removidas em vez de reativar rotas obsoletas. O aplicativo mobile deve continuar somente com Splash, Login, Recuperação de Senha e Reconhecimento.
