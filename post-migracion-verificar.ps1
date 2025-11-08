# ============================================
# SCRIPT POST-MIGRACIÓN - VERIFICACIÓN COMPLETA
# ============================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   POST-MIGRACIÓN - VERIFICACIÓN COMPLETA" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si un puerto está en uso
function Test-PortInUse {
    param([int]$port)
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return $null -ne $connections
}

# Función para detener procesos en un puerto
function Stop-ProcessOnPort {
    param([int]$port)
    Write-Host "🔪 Deteniendo procesos en puerto $port..." -ForegroundColor Yellow

    # Obtener procesos usando el puerto
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($null -ne $connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            try {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "   ✓ Proceso $processId terminado" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠ No se pudo terminar proceso $processId" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ✓ Puerto $port ya está libre" -ForegroundColor Green
    }
}

# 1. VERIFICAR QUE SE EJECUTÓ LA MIGRACIÓN
Write-Host "1. Recordatorio: ¿Ejecutaste la migración SQL?" -ForegroundColor Yellow
Write-Host "   Ve a Supabase Dashboard → SQL Editor" -ForegroundColor White
Write-Host "   Ejecuta el archivo: database/01-agregar-specific-date.sql" -ForegroundColor White
Write-Host ""
$confirmacion = Read-Host "   ¿Ya ejecutaste la migración? (S/N)"

if ($confirmacion -ne "S" -and $confirmacion -ne "s") {
    Write-Host ""
    Write-Host "❌ Primero ejecuta la migración en Supabase" -ForegroundColor Red
    Write-Host "   Archivo: database/01-agregar-specific-date.sql" -ForegroundColor Red
    Write-Host ""
    Write-Host "Presiona Enter para salir..." -ForegroundColor Gray
    $null = Read-Host
    exit 1
}

Write-Host "   ✅ Migración ejecutada" -ForegroundColor Green

# 2. LIBERAR PUERTOS
Write-Host ""
Write-Host "2. Liberando puertos..." -ForegroundColor Yellow

Stop-ProcessOnPort 3000
Stop-ProcessOnPort 4040

Start-Sleep -Seconds 2

# 3. VERIFICAR DEPENDENCIAS
Write-Host ""
Write-Host "3. Verificando dependencias..." -ForegroundColor Yellow

if (!(Test-Path "node_modules")) {
    Write-Host "   📦 Instalando dependencias..." -ForegroundColor Cyan
    try {
        & npm install
        Write-Host "   ✓ Dependencias instaladas" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✓ node_modules existe" -ForegroundColor Green
}

# 4. VERIFICAR VARIABLES DE ENTORNO
Write-Host ""
Write-Host "4. Verificando configuración..." -ForegroundColor Yellow

if (!(Test-Path ".env")) {
    Write-Host "   ❌ Archivo .env no encontrado" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content .env -Raw
$variablesFaltantes = @()

$variablesRequeridas = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_NUMBER"
)

foreach ($var in $variablesRequeridas) {
    if ($envContent -match "$var=.+") {
        Write-Host "   ✓ $var configurado" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $var NO CONFIGURADO" -ForegroundColor Red
        $variablesFaltantes += $var
    }
}

if ($variablesFaltantes.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ VARIABLES DE ENTORNO FALTANTES" -ForegroundColor Red
    foreach ($var in $variablesFaltantes) {
        Write-Host "   • $var" -ForegroundColor Red
    }
    exit 1
}

# 5. INICIAR SERVIDOR NEXT.JS
Write-Host ""
Write-Host "5. Iniciando servidor Next.js..." -ForegroundColor Yellow

try {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "   🚀 SERVIDOR INICIADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 URLs disponibles:" -ForegroundColor White
    Write-Host "   🌐 Web App:    http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   🔗 API Docs:   http://localhost:3000/api" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor White
    Write-Host "   1. Crear horario desde: /schedules" -ForegroundColor Cyan
    Write-Host "   2. Iniciar ngrok: ngrok http 3000" -ForegroundColor Cyan
    Write-Host "   3. Configurar webhook en Twilio" -ForegroundColor Cyan
    Write-Host "   4. Probar chatbot enviando 'hola'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📖 Ver guía completa: GUIA_DEMOSTRACION_TRABAJO.md" -ForegroundColor White
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""

    & npm run dev
} catch {
    Write-Host ""
    Write-Host "❌ Error iniciando el servidor" -ForegroundColor Red
    Write-Host "   $error" -ForegroundColor Red
    exit 1
}
