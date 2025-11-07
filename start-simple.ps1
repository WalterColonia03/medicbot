# Script simple para iniciar bot + ngrok
# Uso: .\start-simple.ps1

Write-Host ""
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "⏳ Esperando 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🌐 Iniciando ngrok..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3000"

Write-Host ""
Write-Host "✅ ¡Todo iniciado!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PASOS:" -ForegroundColor Yellow
Write-Host "1. En la ventana de ngrok, busca la línea 'Forwarding'" -ForegroundColor White
Write-Host "2. Copia la URL (https://xxxx.ngrok-free.app)" -ForegroundColor White
Write-Host "3. Agrégale al final: /api/webhook/twilio-supabase" -ForegroundColor White
Write-Host "4. Pega esa URL completa en Twilio Console" -ForegroundColor White
Write-Host ""
Write-Host "💡 Abre http://localhost:4040 para ver la URL de ngrok" -ForegroundColor Cyan
Write-Host ""
