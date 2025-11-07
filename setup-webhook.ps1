# Script para configurar el webhook de Twilio con ngrok
# Ejecutar: .\setup-webhook.ps1

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   CONFIGURACIÓN WEBHOOK TWILIO + NGROK" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar que npm está instalado
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js NO encontrado. Instala desde: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar que las dependencias están instaladas
Write-Host ""
Write-Host "2. Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✓ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "   ! Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host "   ✓ Dependencias instaladas" -ForegroundColor Green
}

# Verificar archivo .env
Write-Host ""
Write-Host "3. Verificando archivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content .env -Raw
    
    $checks = @{
        "NEXT_PUBLIC_SUPABASE_URL" = $envContent -match "NEXT_PUBLIC_SUPABASE_URL=.+"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY" = $envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=.+"
        "SUPABASE_SERVICE_ROLE_KEY" = $envContent -match "SUPABASE_SERVICE_ROLE_KEY=.+"
        "TWILIO_ACCOUNT_SID" = $envContent -match "TWILIO_ACCOUNT_SID=.+"
        "TWILIO_AUTH_TOKEN" = $envContent -match "TWILIO_AUTH_TOKEN=.+"
        "TWILIO_WHATSAPP_NUMBER" = $envContent -match "TWILIO_WHATSAPP_NUMBER=.+"
    }
    
    $allConfigured = $true
    foreach ($key in $checks.Keys) {
        if ($checks[$key]) {
            Write-Host "   ✓ $key configurado" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $key NO configurado" -ForegroundColor Red
            $allConfigured = $false
        }
    }
    
    if (-not $allConfigured) {
        Write-Host ""
        Write-Host "   ⚠️  Configura las variables faltantes en .env antes de continuar" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
} else {
    Write-Host "   ✗ Archivo .env NO encontrado" -ForegroundColor Red
    Write-Host "   ! Crea el archivo .env basándote en .env.example" -ForegroundColor Yellow
    exit 1
}

# Verificar ngrok
Write-Host ""
Write-Host "4. Verificando ngrok..." -ForegroundColor Yellow
try {
    $ngrokVersion = ngrok version
    Write-Host "   ✓ ngrok instalado: $ngrokVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ ngrok NO encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Para instalar ngrok:" -ForegroundColor Yellow
    Write-Host "   1. Ve a: https://ngrok.com/download" -ForegroundColor White
    Write-Host "   2. Descarga y descomprime ngrok.exe" -ForegroundColor White
    Write-Host "   3. Mueve ngrok.exe a una carpeta en tu PATH" -ForegroundColor White
    Write-Host ""
    Write-Host "   O instala con Chocolatey:" -ForegroundColor Yellow
    Write-Host "   choco install ngrok" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Instrucciones finales
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✅ TODO LISTO PARA INICIAR" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sigue estos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "TERMINAL 1 (Esta terminal):" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "TERMINAL 2 (Abre otra terminal/PowerShell):" -ForegroundColor Cyan
Write-Host "  ngrok http 3000" -ForegroundColor White
Write-Host ""
Write-Host "Luego:" -ForegroundColor Yellow
Write-Host "1. Copia la URL de ngrok (https://xxxx.ngrok.io)" -ForegroundColor White
Write-Host "2. Ve a Twilio Console → WhatsApp Sandbox Settings" -ForegroundColor White
Write-Host "3. En 'WHEN A MESSAGE COMES IN' pega:" -ForegroundColor White
Write-Host "   https://xxxx.ngrok.io/api/webhook/twilio-supabase" -ForegroundColor Green
Write-Host "4. Método: POST" -ForegroundColor White
Write-Host "5. Guarda (Save)" -ForegroundColor White
Write-Host "6. Envía 'Hola' desde WhatsApp" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "¿Iniciar servidor ahora? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "Ejecuta 'npm run dev' cuando estés listo." -ForegroundColor Yellow
    Write-Host ""
}
