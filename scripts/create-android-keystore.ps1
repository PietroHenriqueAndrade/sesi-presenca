$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $Root 'front-end-2\android'
$Keystore = Join-Path $AndroidDir 'app\upload-keystore.jks'
$Props = Join-Path $AndroidDir 'key.properties'

if (Test-Path $Keystore) { throw "A keystore já existe em $Keystore. Não sobrescreva a chave usada para assinar o app." }
if (Test-Path $Props) { throw "android/key.properties já existe. Remova-o somente se souber o que está fazendo." }

$PasswordSecure = Read-Host 'Crie uma senha forte para a keystore' -AsSecureString
$BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($PasswordSecure)
try { $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($BSTR) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR) }

if ($Password.Length -lt 12) { throw 'Use uma senha de pelo menos 12 caracteres.' }

& keytool -genkeypair -v -keystore $Keystore -storepass $Password -keypass $Password -alias upload -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=SESI Presenca, OU=TCC, O=SESI, L=Unknown, ST=Unknown, C=BR'
if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar a keystore.' }

@"
storePassword=$Password
keyPassword=$Password
keyAlias=upload
storeFile=upload-keystore.jks
"@ | Set-Content -Path $Props -Encoding UTF8

Write-Host 'Keystore criada. Faça backup seguro de upload-keystore.jks e key.properties.'
