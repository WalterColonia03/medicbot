@echo off
:: Script para iniciar el bot de WhatsApp
:: Doble clic para ejecutar

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "%~dp0start-bot-fixed.ps1"
