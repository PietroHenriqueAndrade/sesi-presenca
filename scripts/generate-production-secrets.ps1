$ErrorActionPreference = 'Stop'

function New-HexSecret([int]$Bytes = 48) {
  $buffer = New-Object byte[] $Bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($buffer)
  return [Convert]::ToHexString($buffer).ToLowerInvariant()
}

Write-Host "POSTGRES_PASSWORD=$(New-HexSecret 32)"
Write-Host "JWT_SECRET=$(New-HexSecret 48)"
Write-Host "JWT_REFRESH_SECRET=$(New-HexSecret 48)"
Write-Host "IA_API_KEY=$(New-HexSecret 48)"
Write-Host ""
Write-Host "Copie cada valor para .env.production e não envie esse arquivo para ninguém."
