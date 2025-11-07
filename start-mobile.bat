@echo off
title MedicBot - Acceso Movil
color 0B

echo ================================================
echo    MEDICBOT - ACCESO DESDE MOVIL
echo ================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0start-bot-mobile.ps1"

pause
