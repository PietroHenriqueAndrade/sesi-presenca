# Correção Flutter — arquitetura de terminal SESI

Esta revisão corrige o `flutter analyze` reportado após o recálculo de rota.

## Causa dos erros

As rotas administrativas foram removidas quando o Flutter passou a ser apenas um terminal de presença, mas telas antigas (Dashboard, Home, CRUDs e Drawer) ainda permaneciam dentro de `lib/`. O analyzer verifica todos os arquivos Dart do pacote, mesmo os que não são alcançados pelo fluxo principal, e por isso encontrava referências a rotas que já não deveriam existir.

## Decisão aplicada

Não foram recriadas as rotas administrativas antigas. Os arquivos de tela legados foram removidos do aplicativo para preservar a arquitetura correta:

```text
Splash -> Login -> Reconhecimento facial
```

Administração continua no Dashboard React.

## Outras correções

- `CargoUsuario.backendValue` alinhado com a injeção de configuração da WebView;
- refresh do `ApiClient` aguardado corretamente dentro do bloco `try`;
- alias de import local padronizado;
- exceções constantes ajustadas onde aplicável;
- teste de widget atualizado para a Splash SESI atual;
- recuperação de senha alinhada ao mínimo de 8 caracteres exigido pelo Backend;
- tentativa de reiniciar a biometria agora limpa o erro anterior e volta a exibir o loader;
- assets `assets/branding/` permanecem declarados no `pubspec.yaml`.

## Validação no PC com Flutter instalado

Na pasta `front-end-2` execute:

```powershell
flutter clean
flutter pub get
flutter analyze
flutter test
```

Depois, no Android Emulator:

```powershell
flutter run --dart-define=TCC_SERVER_IP=10.0.2.2 --dart-define=TCC_TURMA_ID=<UUID_DA_TURMA>
```

No tablet físico, substitua `10.0.2.2` pelo IPv4 do computador que executa Node/Python.
