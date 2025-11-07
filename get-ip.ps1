# Script para obtener la IP local de tu PC
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   OBTENER IP LOCAL PARA ACCESO MÓVIL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Obtener la IP local
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | 
              Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | 
              Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "✅ Tu IP local es: $ipAddress" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Para acceder desde tu móvil:" -ForegroundColor Yellow
    Write-Host "   http://${ipAddress}:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Instrucciones:" -ForegroundColor Cyan
    Write-Host "   1. Asegúrate de que tu móvil esté en la misma red WiFi" -ForegroundColor White
    Write-Host "   2. Abre el navegador en tu móvil" -ForegroundColor White
    Write-Host "   3. Ingresa: http://${ipAddress}:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "   - Desactiva temporalmente el firewall de Windows si no puedes acceder" -ForegroundColor White
    Write-Host "   - O permite conexiones en el puerto 3000" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ No se pudo obtener la IP local" -ForegroundColor Red
    Write-Host "   Ejecuta: ipconfig" -ForegroundColor Yellow
    Write-Host "   Busca la línea 'Dirección IPv4'" -ForegroundColor Yellow
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
