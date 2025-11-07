# Script corregido para iniciar el bot de WhatsApp con ngrok
# Uso: .\start-bot-fixed.ps1

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    BOT DE WHATSAPP + NGROK" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar package.json
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: No se encontro package.json" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la carpeta del proyecto" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar .env
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: Archivo .env no encontrado" -ForegroundColor Red
    Write-Host "Crea el archivo .env con tus credenciales" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar ngrok
try {
    $null = ngrok version 2>&1
    Write-Host "OK: ngrok encontrado" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: ngrok no esta instalado" -ForegroundColor Red
    Write-Host "Instala desde: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "Limpiando procesos anteriores..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Iniciar servidor Next.js
Write-Host "Iniciando servidor Next.js..." -ForegroundColor Yellow
Write-Host ""
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'SERVIDOR NEXT.JS' -ForegroundColor Green; npm run dev"

Write-Host "Esperando a que el servidor inicie (10 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Iniciar ngrok
Write-Host "Iniciando ngrok..." -ForegroundColor Yellow
Write-Host ""
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'NGROK TUNNEL' -ForegroundColor Green; ngrok http 3000"

Write-Host "Esperando a que ngrok genere la URL (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

# Intentar obtener URL de ngrok
$ngrokUrl = $null
$intentos = 0
Write-Host "Obteniendo URL de ngrok..." -ForegroundColor Yellow

while ($intentos -lt 10) {
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        if ($ngrokApi.tunnels -and $ngrokApi.tunnels.Count -gt 0) {
            $ngrokUrl = $ngrokApi.tunnels[0].public_url
            if ($ngrokUrl) {
                break
            }
        }
    }
    catch {
        # Silenciar errores mientras ngrok inicia
    }
    $intentos++
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    SERVICIOS INICIADOS" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if ($ngrokUrl) {
    $webhookUrl = "$ngrokUrl/api/webhook/twilio-supabase"
    
    Write-Host "Servidor local:  http://localhost:3000" -ForegroundColor Cyan
    Write-Host "URL publica:     $ngrokUrl" -ForegroundColor Green
    Write-Host "Panel ngrok:     http://localhost:4040" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "WEBHOOK URL PARA TWILIO:" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $webhookUrl -ForegroundColor Green
    Write-Host ""
    
    # Intentar copiar al portapapeles
    try {
        $webhookUrl | Set-Clipboard
        Write-Host "URL copiada al portapapeles!" -ForegroundColor Green
    }
    catch {
        Write-Host "No se pudo copiar al portapapeles (copiala manualmente)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "SIGUIENTES PASOS:" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Ve a: https://console.twilio.com" -ForegroundColor White
    Write-Host "2. Messaging -> Try it out -> WhatsApp Sandbox" -ForegroundColor White
    Write-Host "3. Clic en 'Sandbox Settings'" -ForegroundColor White
    Write-Host "4. En 'WHEN A MESSAGE COMES IN' pega la URL de arriba" -ForegroundColor White
    Write-Host "5. Metodo: HTTP POST" -ForegroundColor White
    Write-Host "6. Save" -ForegroundColor White
    Write-Host "7. Envia 'Hola' desde WhatsApp" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host "No se pudo obtener la URL automaticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pasos manuales:" -ForegroundColor Yellow
    Write-Host "1. Ve a: http://localhost:4040" -ForegroundColor White
    Write-Host "2. Busca la linea 'Forwarding'" -ForegroundColor White
    Write-Host "3. Copia la URL (https://xxxx.ngrok-free.app)" -ForegroundColor White
    Write-Host "4. Agregale: /api/webhook/twilio-supabase" -ForegroundColor White
    Write-Host "5. Pega en Twilio Console" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CONTROLES:" -ForegroundColor Yellow
Write-Host "- Ver panel ngrok:  http://localhost:4040" -ForegroundColor White
Write-Host "- Para detener:     Cierra las ventanas de PowerShell" -ForegroundColor White
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Servicios corriendo! Puedes cerrar esta ventana." -ForegroundColor Green
Write-Host ""
Read-Host "Presiona Enter para cerrar"
