param(
  [Parameter(Mandatory=$true)][string]$BackendUrl,
  [Parameter(Mandatory=$true)][string]$PythonUrl,
  [Parameter(Mandatory=$true)][string]$TurmaId
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$FlutterDir = Join-Path $Root 'front-end-2'

if ($BackendUrl -notmatch '^https://') { throw 'BackendUrl precisa comecar com https:// em release.' }
if ($PythonUrl -notmatch '^https://') { throw 'PythonUrl precisa comecar com https:// em release.' }
if ($TurmaId -notmatch '^[0-9a-fA-F-]{36}$') { throw 'TurmaId parece invalido. Use o UUID retornado por npm run turmas:list.' }

Push-Location $FlutterDir
try {
  flutter clean
  flutter pub get
  flutter analyze
  flutter build apk --release `
    --dart-define="TCC_SERVER_URL=$BackendUrl" `
    --dart-define="TCC_PYTHON_URL=$PythonUrl" `
    --dart-define="TCC_TURMA_ID=$TurmaId"

  Write-Host '\nAPK gerado em:' -ForegroundColor Green
  Write-Host (Join-Path $FlutterDir 'build\app\outputs\flutter-apk\app-release.apk')
} finally {
  Pop-Location
}
