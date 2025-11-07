# 🚀 Guía Rápida - MedicBot con Supabase

## ⚡ Inicio Rápido (10 minutos)

### 1️⃣ Instalar Dependencias
```bash
npm install
```

### 2️⃣ Configurar Supabase

#### A. Crear Proyecto Supabase

1. Ve a https://supabase.com
2. Clic en "Start your project" 
3. Regístrate/Inicia sesión
4. Clic en "New Project"
5. Completa:
   - **Name**: `medicbot`
   - **Database Password**: (genera y guarda)
   - **Region**: Elige la más cercana
6. Clic en "Create new project"
7. ⏳ Espera 2-3 minutos

#### B. Ejecutar Esquema SQL

1. En Supabase → "SQL Editor"
2. Clic en "New query"
3. Abre `database/schema.sql` en tu editor
4. Copia TODO el contenido
5. Pégalo en Supabase SQL Editor
6. Clic en "Run" (▶️)
7. ✅ Deberías ver "Success. No rows returned"

**Esto crea:**
- ✅ 7 tablas (doctors, schedules, time_slots, patients, appointments, chat_sessions, notifications)
- ✅ 2 vistas optimizadas
- ✅ Funciones SQL automatizadas
- ✅ Triggers para gestión automática
- ✅ 3 doctores de ejemplo
- ✅ Seguridad RLS configurada

#### C. Obtener Credenciales

1. En Supabase → Settings ⚙️ → API
2. Copia estos valores:

```
Project URL: https://xxxxx.supabase.co
anon public: eyJhbGc...
service_role: eyJhbGc... (clic en "Reveal")
```

### 3️⃣ Configurar Twilio (WhatsApp)

1. Ve a https://www.twilio.com/console
2. Copia:
   - Account SID: `ACxxxxx`
   - Auth Token: (clic en mostrar)
3. Ve a "Messaging" → "Try it out" → "Send a WhatsApp message"
4. Sigue instrucciones para unirte al sandbox
5. Anota el número: `+14155238886`

### 4️⃣ Configurar Variables de Entorno

```bash
# Copia el ejemplo
cp .env.example .env

# Edita .env con tus credenciales
```

Pega tus valores reales:

```env
# Supabase (de paso 2C)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Twilio (de paso 3)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 5️⃣ Iniciar la Aplicación

```bash
npm run dev
```

Abre: http://localhost:3000

---

## 📊 Verificar que Todo Funciona

### A. Verificar Base de Datos

En Supabase → "Table Editor":

1. Clic en tabla `doctors`
2. Deberías ver 3 doctores:
   - Dr. Juan Pérez (Medicina General)
   - Dra. María González (Pediatría)
   - Dr. Carlos Rodríguez (Cardiología)

### B. Verificar Panel Web

1. Abre http://localhost:3000
2. Deberías ver el Dashboard
3. Clic en "Horarios"
4. Clic en "Citas"

---

## 📅 Configurar Horarios

### 1. Crear Horario

1. Ve a http://localhost:3000/schedules
2. Clic en "Nuevo Horario"
3. Completa:
   - **Médico**: Dr. Juan Pérez
   - **Día**: Lunes
   - **Hora inicio**: 09:00
   - **Hora fin**: 17:00
   - **Duración**: 30 minutos
4. Clic en "Guardar"

### 2. Generar Slots

1. Verás el horario creado
2. Clic en "Generar Espacios de Tiempo"
3. ✅ Se generarán slots automáticamente

### 3. Verificar en Supabase

En Supabase → Table Editor → `time_slots`:
- Deberías ver múltiples filas generadas automáticamente
- Una por cada slot de 30 minutos de 09:00 a 17:00

---

## 💬 Configurar WhatsApp

### Para Desarrollo (ngrok)

```bash
# Terminal 1: Servidor Next.js
npm run dev

# Terminal 2: ngrok
npx ngrok http 3000
```

Verás algo como:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### Configurar en Twilio

1. Ve a https://console.twilio.com/
2. "Messaging" → "Settings" → "WhatsApp sandbox settings"
3. En "When a message comes in":
   - URL: `https://abc123.ngrok.io/api/webhook/twilio-supabase`
   - Method: `POST`
4. Guardar

---

## 📱 Probar el Chatbot

1. Abre WhatsApp en tu teléfono
2. Busca la conversación con el número de Twilio
3. Envía cualquier mensaje (ej: "Hola")

### Flujo Esperado:

```
Tú: Hola

Bot: ¡Bienvenido al sistema de citas médicas! 🏥

Selecciona un médico escribiendo el número:

1. Dr. Juan Pérez - Medicina General
2. Dra. María González - Pediatría
3. Dr. Carlos Rodríguez - Cardiología

Tú: 1

Bot: Has seleccionado a Dr. Juan Pérez (Medicina General).

Selecciona una fecha escribiendo el número:

1. Hoy (06/11/2024)
2. Mañana (07/11/2024)
3. Pasado mañana (08/11/2024)

Tú: 2

Bot: Horarios disponibles:

1. 09:00 - 09:30
2. 09:30 - 10:00
3. 10:00 - 10:30
...

Tú: 1

Bot: Has seleccionado:

👨‍⚕️ Médico: Dr. Juan Pérez
📅 Fecha: 07/11/2024
🕐 Hora: 09:00 - 09:30

Por favor, escribe tu nombre completo para confirmar la cita.

Tú: Juan García

Bot: ✅ ¡Cita confirmada exitosamente!

Nombre: Juan García
Médico: Dr. Juan Pérez
Fecha: 07/11/2024
Hora: 09:00-09:30

📌 Tu código de cita: ABC12345

Recibirás un recordatorio antes de tu cita. ¡Gracias!

💡 Escribe "nueva cita" si deseas agendar otra.
```

---

## 🎯 Verificar la Cita

### En el Panel Web

1. Ve a http://localhost:3000/appointments
2. Deberías ver la cita que acabas de crear
3. Información completa:
   - Paciente: Juan García
   - Teléfono
   - Médico: Dr. Juan Pérez
   - Fecha y hora
   - Estado: confirmed

### En Supabase

1. Ve a Table Editor → `appointments`
2. Verás la cita registrada
3. Ve a `patients`
4. Verás el paciente creado automáticamente
5. Ve a `time_slots`
6. El slot usado tendrá `is_available = false`

---

## 🔍 Características de la Base de Datos

### ✅ Generación Automática de Slots

La función SQL `generate_time_slots()` crea automáticamente todos los espacios de tiempo basándose en los horarios configurados.

### ✅ Triggers Automáticos

- **Slot ocupado**: Al crear una cita, el slot se marca automáticamente como no disponible
- **Liberar slot**: Al cancelar una cita, el slot se libera automáticamente
- **Timestamps**: Los campos `updated_at` se actualizan solos

### ✅ Vistas Optimizadas

- `v_appointments_full`: Citas con toda la info (paciente + doctor)
- `v_available_slots`: Slots disponibles con info del doctor

### ✅ Integridad Referencial

- Si borras un doctor, sus horarios también se borran
- Si borras un paciente, sus citas también se borran
- Constraints validan que los datos sean correctos

---

## 📚 Consultas SQL Útiles

### Ver todos los horarios

```sql
SELECT 
  s.*,
  d.name as doctor_name
FROM schedules s
JOIN doctors d ON s.doctor_id = d.id
WHERE s.is_active = true;
```

### Ver citas de hoy

```sql
SELECT * FROM v_appointments_full
WHERE appointment_date = CURRENT_DATE
ORDER BY start_time;
```

### Ver slots disponibles mañana

```sql
SELECT * FROM v_available_slots
WHERE slot_date = CURRENT_DATE + 1;
```

### Generar más slots

```sql
-- Obtener ID del horario
SELECT id FROM schedules WHERE doctor_id = (
  SELECT id FROM doctors WHERE name = 'Dr. Juan Pérez'
) LIMIT 1;

-- Generar slots
SELECT generate_time_slots(
  'el-id-del-horario',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '60 days'
);
```

---

## 🎨 Interfaz Web

### Dashboard (/)
- Estadísticas generales
- Total de citas
- Citas de hoy
- Número de doctores

### Horarios (/schedules)
- Crear nuevo horario
- Listar horarios existentes
- Generar slots automáticamente
- Día de semana, horarios, duración

### Citas (/appointments)
- Listar todas las citas
- Filtrar por estado
- Ver información completa
- Enviar recordatorios

---

## 🔐 Seguridad

- **RLS Habilitado**: Row Level Security activo
- **Políticas**:
  - Lectura pública: Doctores y slots disponibles
  - Escritura autenticada: Solo el backend puede crear citas
- **Service Role**: Solo para servidor (no exponer)
- **Anon Key**: Segura para cliente

---

## 🐛 Solución de Problemas

### "Cannot connect to Supabase"
```bash
# Verifica .env
cat .env | grep SUPABASE

# Verifica que el proyecto esté activo en Supabase
```

### "No slots available"
```bash
# Regenera slots desde el panel web
# O ejecuta en Supabase SQL Editor:
SELECT generate_time_slots(
  (SELECT id FROM schedules LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
);
```

### "Twilio webhook not responding"
```bash
# Verifica que ngrok esté corriendo
# Verifica la URL en Twilio Console
# Debe terminar en /api/webhook/twilio-supabase
```

### Ver logs de Supabase
1. Ve a "Logs" en el panel de Supabase
2. Filtra por "API" o "Database"
3. Revisa errores

---

## 📈 Próximos Pasos

1. ✅ Configura más médicos
2. ✅ Crea horarios para cada día
3. ✅ Genera slots para el próximo mes
4. ✅ Prueba el chatbot con varios escenarios
5. ✅ Envía recordatorios desde el panel
6. 🚀 Despliega a producción (Vercel)

---

## 🚀 Despliegue a Producción

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en Vercel Dashboard
# Actualizar webhook de Twilio con URL de producción
```

---

## ✅ Checklist Final

- [ ] Supabase proyecto creado
- [ ] Schema SQL ejecutado
- [ ] Credenciales en .env
- [ ] Twilio configurado
- [ ] `npm run dev` funcionando
- [ ] Panel web accesible
- [ ] Horarios creados
- [ ] Slots generados
- [ ] ngrok corriendo
- [ ] Webhook configurado
- [ ] Chatbot respondiendo
- [ ] Cita de prueba creada
- [ ] Cita visible en panel web

---

**¡Sistema listo para usar! 🎉**

Para más detalles:
- **Base de datos**: Ver `database/README.md`
- **Documentación completa**: Ver `README_SUPABASE.md`
