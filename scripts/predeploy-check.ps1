$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host '=== SESI Presenca - verificacao pre-deploy ===' -ForegroundColor Cyan

Write-Host "`n[1/4] Backend Node + Prisma" -ForegroundColor Yellow
Push-Location backend
try {
  npm ci

  # prisma validate só precisa que DATABASE_URL exista sintaticamente; não precisa acessar o banco.
  $OriginalDatabaseUrl = $env:DATABASE_URL
  if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    $env:DATABASE_URL = 'postgresql://predeploy:predeploy@localhost:5432/predeploy?schema=public'
  }
  try {
    npx prisma validate
    if ($LASTEXITCODE -ne 0) { throw 'prisma validate falhou.' }
  } finally {
    if ($null -eq $OriginalDatabaseUrl) { Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue }
    else { $env:DATABASE_URL = $OriginalDatabaseUrl }
  }

  npm run test:rules
  if ($LASTEXITCODE -ne 0) { throw 'test:rules falhou.' }
  npm test
  if ($LASTEXITCODE -ne 0) { throw 'testes Jest falharam.' }
} finally {
  Pop-Location
}

Write-Host "`n[2/4] Dashboard React/Vite" -ForegroundColor Yellow
Push-Location dashboard-react
try {
  npm ci
  npm run test:unit
  if ($LASTEXITCODE -ne 0) { throw 'testes do Dashboard falharam.' }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'build do Dashboard falhou.' }
} finally {
  Pop-Location
}

Write-Host "`n[3/4] Python/FastAPI" -ForegroundColor Yellow
Push-Location python_api
try {
  python -m pip install -r requirements-dev.txt
  if ($LASTEXITCODE -ne 0) { throw 'dependencias de teste do Python falharam.' }
  python -m py_compile main.py core_utils.py image_utils.py run.py
  if ($LASTEXITCODE -ne 0) { throw 'py_compile falhou.' }
  python -m unittest discover -s tests
  if ($LASTEXITCODE -ne 0) { throw 'testes Python falharam.' }
} finally {
  Pop-Location
}

Write-Host "`n[4/4] Flutter" -ForegroundColor Yellow
if (Get-Command flutter -ErrorAction SilentlyContinue) {
  Push-Location front-end-2
  try {
    flutter pub get
    if ($LASTEXITCODE -ne 0) { throw 'flutter pub get falhou.' }
    flutter analyze
    if ($LASTEXITCODE -ne 0) { throw 'flutter analyze falhou.' }
    flutter test
    if ($LASTEXITCODE -ne 0) { throw 'flutter test falhou.' }
  } finally {
    Pop-Location
  }
} else {
  Write-Warning 'Flutter nao encontrado. Rode flutter analyze/test antes de gerar o APK release.'
}

Write-Host "`nOK: verificacoes locais concluidas." -ForegroundColor Green
Write-Host 'A publicacao ainda depende das variaveis reais de Supabase/Render/Vercel.'
