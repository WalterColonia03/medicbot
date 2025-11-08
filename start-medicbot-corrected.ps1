# ============================================
# SCRIPT DE ARRANQUE CORREGIDO PARA MEDICBOT
# ============================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   INICIANDO MEDICBOT - VERSIÓN CORREGIDA" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si un puerto está en uso
function Test-PortInUse {
    param([int]$port)
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return $connections -ne $null
}

# Función para matar procesos en un puerto
function Kill-ProcessOnPort {
    param([int]$port)
    Write-Host "🔪 Matando procesos en puerto $port..." -ForegroundColor Yellow

    # Obtener procesos usando el puerto
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
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

# 1. VERIFICAR ARCHIVOS ESENCIALES
Write-Host "1. Verificando archivos esenciales..." -ForegroundColor Yellow

$archivos = @(
    "package.json",
    ".env",
    "src/pages/api/schedules/index.ts",
    "src/lib/supabase/server.ts"
)

$archivosFaltantes = @()
foreach ($archivo in $archivos) {
    if (Test-Path $archivo) {
        Write-Host "   ✓ $archivo" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $archivo FALTA" -ForegroundColor Red
        $archivosFaltantes += $archivo
    }
}

if ($archivosFaltantes.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ ARCHIVOS FALTANTES - No se puede continuar" -ForegroundColor Red
    Write-Host "Archivos faltantes:" -ForegroundColor Red
    foreach ($archivo in $archivosFaltantes) {
        Write-Host "   • $archivo" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Presiona Enter para salir..." -ForegroundColor Gray
    $null = Read-Host
    exit 1
}

# 2. VERIFICAR Y MATAR PROCESOS EXISTENTES
Write-Host ""
Write-Host "2. Liberando puertos..." -ForegroundColor Yellow

Kill-ProcessOnPort 3000
Kill-ProcessOnPort 4040

Start-Sleep -Seconds 2

# 3. VERIFICAR DEPENDENCIAS
Write-Host ""
Write-Host "3. Verificando dependencias..." -ForegroundColor Yellow

if (!(Test-Path "node_modules")) {
    Write-Host "   📦 Instalando dependencias..." -ForegroundColor Cyan
    try {
        npm install
        Write-Host "   ✓ Dependencias instaladas" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error instalando dependencias" -ForegroundColor Red
        Write-Host "   $error" -ForegroundColor Red
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
    Write-Host "   Copia .env.example a .env y configura las variables" -ForegroundColor Red
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
    Write-Host "Configura estas variables en .env:" -ForegroundColor Red
    foreach ($var in $variablesFaltantes) {
        Write-Host "   • $var" -ForegroundColor Red
    }
    exit 1
}

# 5. INICIAR SERVIDOR NEXT.JS
Write-Host ""
Write-Host "5. Iniciando servidor Next.js..." -ForegroundColor Yellow

try {
    Write-Host "   🚀 Ejecutando: npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "   SERVIDOR INICIADO - ACCEDE A:" -ForegroundColor Green
    Write-Host "   http://localhost:3000" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
    Write-Host ""

    npm run dev
} catch {
    Write-Host ""
    Write-Host "❌ Error iniciando el servidor" -ForegroundColor Red
    Write-Host "   $error" -ForegroundColor Red
    exit 1
}
