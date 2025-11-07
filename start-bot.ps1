# Script para iniciar el bot de WhatsApp con ngrok
# Uso: .\start-bot.ps1

# Colores
$Green = "Green"
$Yellow = "Yellow"
$Cyan = "Cyan"
$Red = "Red"

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor $Cyan
Write-Host "    🤖 INICIANDO BOT DE WHATSAPP + NGROK" -ForegroundColor $Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor $Cyan
Write-Host ""

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json" -ForegroundColor $Red
    Write-Host "   Ejecuta este script desde la carpeta del proyecto" -ForegroundColor $Yellow
    Write-Host ""
    exit 1
}

# Verificar .env
Write-Host "📋 Verificando configuración..." -ForegroundColor $Yellow
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: Archivo .env no encontrado" -ForegroundColor $Red
    Write-Host "   Crea el archivo .env con tus credenciales" -ForegroundColor $Yellow
    Write-Host ""
    exit 1
}

# Verificar que ngrok está instalado
try {
    $null = ngrok version
    Write-Host "✅ ngrok encontrado" -ForegroundColor $Green
} catch {
    Write-Host "❌ Error: ngrok no está instalado" -ForegroundColor $Red
    Write-Host "   Instala con: choco install ngrok" -ForegroundColor $Yellow
    Write-Host "   O descarga de: https://ngrok.com/download" -ForegroundColor $Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Configuración OK" -ForegroundColor $Green
Write-Host ""

# Matar procesos existentes de node y ngrok (por si quedaron corriendo)
Write-Host "🧹 Limpiando procesos anteriores..." -ForegroundColor $Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*Next.js*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "✅ Listo" -ForegroundColor $Green
Write-Host ""

# Iniciar servidor Next.js en background
Write-Host "🚀 Iniciando servidor Next.js..." -ForegroundColor $Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

# Esperar a que el servidor esté listo
Write-Host "   Esperando a que el servidor inicie..." -ForegroundColor $Yellow
Start-Sleep -Seconds 5

# Verificar que el servidor está corriendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Servidor corriendo en http://localhost:3000" -ForegroundColor $Green
} catch {
    Write-Host "⚠️  El servidor está iniciando (esto es normal)" -ForegroundColor $Yellow
}
Write-Host ""

# Iniciar ngrok en background
Write-Host "🌐 Iniciando ngrok..." -ForegroundColor $Yellow
$ngrokJob = Start-Job -ScriptBlock {
    ngrok http 3000 --log=stdout
}

# Esperar a que ngrok genere la URL
Write-Host "   Esperando URL pública de ngrok..." -ForegroundColor $Yellow
Start-Sleep -Seconds 3

# Obtener la URL de ngrok
$ngrokUrl = $null
$maxAttempts = 10
$attempt = 0

while ($attempt -lt $maxAttempts -and $null -eq $ngrokUrl) {
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $ngrokUrl = $ngrokApi.tunnels[0].public_url
        
        if ($ngrokUrl) {
            Write-Host "✅ ngrok iniciado correctamente" -ForegroundColor $Green
            break
        }
    } catch {
        $attempt++
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor $Cyan
Write-Host "    ✅ TODO LISTO - BOT FUNCIONANDO" -ForegroundColor $Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor $Cyan
Write-Host ""

if ($ngrokUrl) {
    Write-Host "📍 INFORMACIÓN IMPORTANTE:" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "   Servidor local:  http://localhost:3000" -ForegroundColor $Cyan
    Write-Host "   URL pública:     $ngrokUrl" -ForegroundColor $Green
    Write-Host "   Panel ngrok:     http://localhost:4040" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "🔗 WEBHOOK URL PARA TWILIO:" -ForegroundColor $Yellow
    Write-Host ""
    $webhookUrl = "$ngrokUrl/api/webhook/twilio-supabase"
    Write-Host "   $webhookUrl" -ForegroundColor $Green
    Write-Host ""
    
    # Copiar al portapapeles
    $webhookUrl | Set-Clipboard
    Write-Host "📋 URL copiada al portapapeles!" -ForegroundColor $Green
    Write-Host ""
    
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor $Cyan
    Write-Host "    📝 SIGUIENTE PASO:" -ForegroundColor $Yellow
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "1. Ve a Twilio Console:" -ForegroundColor $White
    Write-Host "   https://console.twilio.com" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "2. Ve a: Messaging → Try it out → WhatsApp Sandbox" -ForegroundColor $White
    Write-Host ""
    Write-Host "3. Haz clic en 'Sandbox Settings'" -ForegroundColor $White
    Write-Host ""
    Write-Host "4. En 'WHEN A MESSAGE COMES IN' pega la URL:" -ForegroundColor $White
    Write-Host "   (Ya está en tu portapapeles, solo Ctrl+V)" -ForegroundColor $Green
    Write-Host ""
    Write-Host "5. Método: HTTP POST" -ForegroundColor $White
    Write-Host ""
    Write-Host "6. Haz clic en 'Save'" -ForegroundColor $White
    Write-Host ""
    Write-Host "7. Envía 'Hola' desde WhatsApp al número del sandbox" -ForegroundColor $White
    Write-Host ""
    
} else {
    Write-Host "⚠️  No se pudo obtener la URL de ngrok" -ForegroundColor $Yellow
    Write-Host "   Ve a: http://localhost:4040 para verla manualmente" -ForegroundColor $Cyan
    Write-Host ""
}

Write-Host "════════════════════════════════════════════════════" -ForegroundColor $Cyan
Write-Host ""
Write-Host "💡 CONTROLES:" -ForegroundColor $Yellow
Write-Host "   • Ver logs del servidor: http://localhost:3000" -ForegroundColor $White
Write-Host "   • Ver tráfico de ngrok:  http://localhost:4040" -ForegroundColor $White
Write-Host "   • Detener todo:          Presiona Ctrl+C" -ForegroundColor $White
Write-Host ""
Write-Host "El bot está corriendo. Presiona Ctrl+C para detener..." -ForegroundColor $Green
Write-Host ""

# Mantener el script corriendo y mostrar logs
try {
    while ($true) {
        # Verificar que los jobs sigan corriendo
        if ($serverJob.State -ne "Running") {
            Write-Host "⚠️  El servidor se detuvo" -ForegroundColor $Red
            break
        }
        
        if ($ngrokJob.State -ne "Running") {
            Write-Host "⚠️  ngrok se detuvo" -ForegroundColor $Red
            break
        }
        
        # Mostrar algunos logs del servidor
        $logs = Receive-Job -Job $serverJob -ErrorAction SilentlyContinue
        if ($logs) {
            Write-Host $logs
        }
        
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Deteniendo servicios..." -ForegroundColor $Yellow
    
    # Detener jobs
    Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
    Stop-Job -Job $ngrokJob -ErrorAction SilentlyContinue
    Remove-Job -Job $serverJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $ngrokJob -Force -ErrorAction SilentlyContinue
    
    # Matar procesos
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*Next.js*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Servicios detenidos" -ForegroundColor $Green
    Write-Host ""
}
