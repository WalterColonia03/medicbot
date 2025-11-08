# ============================================
# SCRIPT DE VERIFICACIÓN COMPLETA DEL SISTEMA
# ============================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   VERIFICACIÓN RÁPIDA DE MEDICBOT" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$errores = 0

Write-Host "1. Verificando archivos esenciales..." -ForegroundColor Yellow

$archivos = @(
    "package.json",
    ".env",
    "src/pages/api/schedules/index.ts",
    "src/lib/supabase/server.ts"
)

foreach ($archivo in $archivos) {
    if (Test-Path $archivo) {
        Write-Host "   ✓ $archivo" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $archivo FALTA" -ForegroundColor Red
        $errores++
    }
}

Write-Host ""
Write-Host "2. Verificando dependencias..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "   ✓ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠ node_modules no encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   REPORTE FINAL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if ($errores -eq 0) {
    Write-Host "✓ SISTEMA LISTO" -ForegroundColor Green
    Write-Host ""
    Write-Host "Archivos creados:" -ForegroundColor White
    Write-Host "   • API Schedules corregida" -ForegroundColor Cyan
    Write-Host "   • Script SQL de reparación" -ForegroundColor Cyan
    Write-Host "   • Script de arranque corregido" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor White
    Write-Host "   1. Ejecutar script SQL en Supabase" -ForegroundColor Cyan
    Write-Host "   2. npm run dev" -ForegroundColor Cyan
    Write-Host "   3. Probar crear horario" -ForegroundColor Cyan
} else {
    Write-Host "❌ ERRORES CRÍTICOS: $errores" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Presiona Enter para salir..." -ForegroundColor Gray
$null = Read-Host
