# ================================================
# Script para iniciar MedicBot con acceso móvil
# ================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   INICIAR MEDICBOT - ACCESO MÓVIL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Obtener la IP local
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | 
              Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | 
              Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "✅ Tu IP local: $ipAddress" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 URLs de acceso:" -ForegroundColor Yellow
    Write-Host "   Desde esta PC:  http://localhost:3000" -ForegroundColor White
    Write-Host "   Desde tu móvil: http://${ipAddress}:3000" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️  No se pudo obtener la IP local" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🚀 Iniciando servidor Next.js..." -ForegroundColor Cyan
Write-Host ""

# Iniciar Next.js con acceso desde red local
npm run dev-mobile
