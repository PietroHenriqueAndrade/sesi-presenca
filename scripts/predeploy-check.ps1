$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host '=== SESI Presenca - verificacao pre-deploy ===' -ForegroundColor Cyan

Write-Host '\n[1/4] Backend Node + Prisma' -ForegroundColor Yellow
Push-Location backend
npm ci
npx prisma validate
npm run test:rules
npm test
Pop-Location

Write-Host '\n[2/4] Dashboard React/Vite' -ForegroundColor Yellow
Push-Location dashboard-react
npm ci
npm run test:unit
npm run build
Pop-Location

Write-Host '\n[3/4] Python/FastAPI' -ForegroundColor Yellow
Push-Location python_api
python -m py_compile main.py core_utils.py image_utils.py run.py
python -m unittest discover -s tests
Pop-Location

Write-Host '\n[4/4] Flutter' -ForegroundColor Yellow
if (Get-Command flutter -ErrorAction SilentlyContinue) {
  Push-Location front-end-2
  flutter pub get
  flutter analyze
  flutter test
  Pop-Location
} else {
  Write-Warning 'Flutter nao encontrado. Rode flutter analyze/test antes de gerar o APK release.'
}

Write-Host '\nOK: verificacoes locais concluidas.' -ForegroundColor Green
Write-Host 'A publicacao ainda depende das variaveis reais de Supabase/Render/Vercel.'
