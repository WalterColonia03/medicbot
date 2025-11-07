# 🚀 Guía Rápida - MedicBot

## Inicio Rápido (5 minutos)

### 1️⃣ Instalar Dependencias
```bash
npm install
```

### 2️⃣ Configurar Variables de Entorno
Copia `.env.example` a `.env` y completa tus credenciales:
```bash
cp .env.example .env
```

### 3️⃣ Iniciar Servidor
```bash
npm run dev
```

Abre: http://localhost:3000

---

## 📱 Flujo de Uso del Sistema

### Para Administradores (Panel Web):

1. **Configurar Horarios**
   - Ve a `/schedules`
   - Clic en "Nuevo Horario"
   - Selecciona médico, día, horario y duración
   - Guarda

2. **Generar Espacios de Tiempo**
   - En cada horario, clic en "Generar Espacios de Tiempo"
   - Esto crea slots disponibles para los próximos 30 días

3. **Ver Citas**
   - Ve a `/appointments`
   - Filtra por estado (Todas, Confirmadas, Canceladas)
   - Envía recordatorios manualmente

### Para Pacientes (WhatsApp):

El chatbot guía al paciente paso a paso:

```
Bot: ¡Bienvenido! Selecciona un médico:
     1. Dr. Juan Pérez
     2. Dra. María González
     3. Dr. Carlos Rodríguez

Paciente: 1

Bot: Selecciona una fecha:
     1. Hoy
     2. Mañana
     3. Pasado mañana

Paciente: 2

Bot: Horarios disponibles:
     1. 09:00 - 09:30
     2. 09:30 - 10:00
     ...

Paciente: 1

Bot: Escribe tu nombre completo

Paciente: Juan García

Bot: ✅ Cita confirmada!
     Nombre: Juan García
     Médico: Dr. Juan Pérez
     Fecha: 2024-11-07
     Hora: 09:00-09:30
```

---

## 🔧 Configuración de Twilio (WhatsApp)

### Opción A: Desarrollo Local (con ngrok)

1. Instala ngrok: https://ngrok.com/download
2. Ejecuta en otra terminal:
   ```bash
   ngrok http 3000
   ```
3. Copia la URL (ej: `https://abc123.ngrok.io`)
4. En Twilio Console:
   - WhatsApp Sandbox Settings
   - "When a message comes in": `https://abc123.ngrok.io/api/webhook/twilio`
   - Método: POST

### Opción B: Producción (Vercel)

1. Instala Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Despliega:
   ```bash
   vercel
   ```
3. Configura variables de entorno en Vercel Dashboard
4. Usa la URL de producción en Twilio webhook

---

## 📊 Estructura de Datos

### Collections en Firestore:

**schedules**
```json
{
  "doctorName": "Dr. Juan Pérez",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 30,
  "isActive": true
}
```

**timeSlots**
```json
{
  "doctorName": "Dr. Juan Pérez",
  "date": "2024-11-07",
  "startTime": "09:00",
  "endTime": "09:30",
  "isAvailable": true
}
```

**appointments**
```json
{
  "patientName": "Juan García",
  "patientPhone": "+1234567890",
  "doctorName": "Dr. Juan Pérez",
  "date": "2024-11-07",
  "timeSlot": "09:00-09:30",
  "status": "confirmed",
  "createdAt": "2024-11-06T10:00:00Z",
  "notificationSent": true
}
```

---

## 🎯 Funcionalidades Principales

### ✅ Implementadas

- [x] Chatbot conversacional por WhatsApp
- [x] Programación de horarios de atención
- [x] Selección de doctor por el paciente
- [x] Selección de fecha disponible
- [x] Selección de horario disponible
- [x] Confirmación de cita con nombre
- [x] Notificación automática de confirmación
- [x] Panel web de administración
- [x] Listado de todas las citas
- [x] Filtrado por estado de citas
- [x] Envío manual de recordatorios
- [x] PWA (Progressive Web App)

### 🔄 Endpoints API

**Horarios:**
- `GET /api/schedules` - Lista todos los horarios
- `POST /api/schedules` - Crea un nuevo horario

**Slots de Tiempo:**
- `GET /api/timeslots/available` - Slots disponibles
- `POST /api/timeslots/generate` - Genera slots automáticamente

**Citas:**
- `GET /api/appointments` - Lista todas las citas
- `POST /api/appointments` - Crea una nueva cita

**Webhook y Notificaciones:**
- `POST /api/webhook/twilio` - Recibe mensajes de WhatsApp
- `POST /api/notifications/send` - Envía recordatorios

---

## 📱 Instalar como App Móvil

### Android (Chrome):
1. Abre la app en Chrome
2. Menú (⋮) → "Agregar a pantalla de inicio"
3. ¡Listo! Ahora funciona como app nativa

### iOS (Safari):
1. Abre la app en Safari
2. Botón compartir → "Agregar a pantalla de inicio"
3. ¡Listo! Ahora funciona como app nativa

---

## 🐛 Solución de Problemas

### Error: "Cannot find module..."
```bash
# Elimina node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

### Firebase no conecta
- Verifica que `.env` tenga las credenciales correctas
- Asegúrate que Firestore esté habilitado en Firebase Console

### Twilio/WhatsApp no funciona
- Verifica que el webhook esté configurado correctamente
- Revisa que las credenciales de Twilio sean correctas
- Asegúrate que el número de WhatsApp esté activo

### La app no se instala como PWA
- Asegúrate de estar en HTTPS (ngrok o producción)
- Verifica que `manifest.json` esté en `/public`

---

## 📞 Contacto y Soporte

- 📖 Documentación completa: Ver `README.md`
- 📝 Instrucciones detalladas: Ver `INSTRUCCIONES.txt`
- 🐛 Reportar problemas: GitHub Issues

---

**¡Listo para usar! 🎉**
