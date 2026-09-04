param(
  [Parameter(Mandatory=$true)][string]$BackendUrl,
  [Parameter(Mandatory=$true)][string]$PythonUrl
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$FlutterDir = Join-Path $Root 'front-end-2'
$KeyProperties = Join-Path $FlutterDir 'android\key.properties'

$BackendUrl = $BackendUrl.TrimEnd('/')
$PythonUrl = $PythonUrl.TrimEnd('/')

if ($BackendUrl -notmatch '^https://') { throw 'BackendUrl precisa comecar com https:// em release.' }
if ($PythonUrl -notmatch '^https://') { throw 'PythonUrl precisa comecar com https:// em release.' }
if (-not (Test-Path $KeyProperties)) {
  throw 'Assinatura release ausente. Rode primeiro .\scripts\create-android-keystore.ps1 na raiz do projeto.'
}

function Test-Endpoint([string]$Nome, [string]$Url) {
  Write-Host "Testando $Nome -> $Url" -ForegroundColor Cyan
  try {
    $r = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 45 -UseBasicParsing
    if ($r.StatusCode -lt 200 -or $r.StatusCode -ge 300) {
      throw "HTTP $($r.StatusCode)"
    }
    Write-Host "$Nome OK (HTTP $($r.StatusCode))" -ForegroundColor Green
  } catch {
    throw "$Nome nao respondeu corretamente em $Url. Detalhe: $($_.Exception.Message)"
  }
}

# Render pode estar adormecido; 45 s evita confundir cold start com URL errada.
Test-Endpoint 'Backend' "$BackendUrl/api/health"
Test-Endpoint 'Python IA' "$PythonUrl/health"

Push-Location $FlutterDir
try {
  flutter clean
  if ($LASTEXITCODE -ne 0) { throw 'flutter clean falhou.' }
  flutter pub get
  if ($LASTEXITCODE -ne 0) { throw 'flutter pub get falhou.' }
  flutter analyze
  if ($LASTEXITCODE -ne 0) { throw 'flutter analyze falhou.' }
  flutter test
  if ($LASTEXITCODE -ne 0) { throw 'flutter test falhou.' }
  flutter build apk --release `
    --dart-define="TCC_SERVER_URL=$BackendUrl" `
    --dart-define="TCC_PYTHON_URL=$PythonUrl"
  if ($LASTEXITCODE -ne 0) { throw 'flutter build apk --release falhou.' }

  Write-Host "`nAPK gerado em:" -ForegroundColor Green
  Write-Host (Join-Path $FlutterDir 'build\app\outputs\flutter-apk\app-release.apk')
} finally {
  Pop-Location
}
