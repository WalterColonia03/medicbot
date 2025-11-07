# Base de Datos - MedicBot (Supabase)

## Configuración de la Base de Datos

### 1. Crear Proyecto en Supabase

1. Ve a [Supabase](https://supabase.com)
2. Clic en "Start your project"
3. Crea una cuenta o inicia sesión
4. Clic en "New Project"
5. Completa:
   - **Name**: medicbot
   - **Database Password**: (genera una contraseña segura y guárdala)
   - **Region**: Selecciona la región más cercana
6. Clic en "Create new project"

### 2. Ejecutar el Esquema SQL

1. En el panel de Supabase, ve a "SQL Editor"
2. Clic en "New query"
3. Copia todo el contenido del archivo `schema.sql`
4. Pégalo en el editor
5. Clic en "Run" para ejecutar

Esto creará:
- ✅ **7 tablas principales**: doctors, schedules, time_slots, patients, appointments, chat_sessions, notifications
- ✅ **1 tabla de auditoría**: audit_log
- ✅ **2 vistas**: v_appointments_full, v_available_slots
- ✅ **4 funciones**: update_updated_at, generate_time_slots, mark_slot_unavailable, release_slot
- ✅ **Triggers automáticos**: Para actualizar timestamps y gestionar disponibilidad
- ✅ **Datos iniciales**: 3 doctores de ejemplo
- ✅ **Políticas RLS**: Row Level Security configurado

### 3. Obtener Credenciales

#### API Keys:
1. Ve a "Settings" (⚙️) → "API"
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: Esta es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (clic en "Reveal"): Esta es tu `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANTE**: NUNCA expongas el service_role_key en el cliente

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_WHATSAPP_NUMBER=+14155238886
```

## Estructura de la Base de Datos

### Tablas Principales

#### `doctors` - Médicos
Almacena información de los médicos disponibles.

```sql
- id (UUID, PK)
- name (VARCHAR)
- specialty (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR, UNIQUE)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `schedules` - Horarios de Atención
Define los horarios semanales de cada médico.

```sql
- id (UUID, PK)
- doctor_id (UUID, FK → doctors)
- day_of_week (INTEGER, 0-6)
- start_time (TIME)
- end_time (TIME)
- slot_duration (INTEGER, minutos)
- is_active (BOOLEAN)
```

#### `time_slots` - Espacios de Tiempo
Slots específicos generados automáticamente.

```sql
- id (UUID, PK)
- doctor_id (UUID, FK → doctors)
- schedule_id (UUID, FK → schedules)
- slot_date (DATE)
- start_time (TIME)
- end_time (TIME)
- is_available (BOOLEAN)
```

#### `patients` - Pacientes
Información de los pacientes registrados.

```sql
- id (UUID, PK)
- name (VARCHAR)
- phone (VARCHAR, UNIQUE)
- email (VARCHAR)
- date_of_birth (DATE)
- address (TEXT)
- notes (TEXT)
```

#### `appointments` - Citas Médicas
Citas programadas.

```sql
- id (UUID, PK)
- patient_id (UUID, FK → patients)
- doctor_id (UUID, FK → doctors)
- time_slot_id (UUID, FK → time_slots)
- appointment_date (DATE)
- start_time (TIME)
- end_time (TIME)
- status (VARCHAR: pending, confirmed, cancelled, completed, no_show)
- reason (TEXT)
- notification_sent (BOOLEAN)
- reminder_sent (BOOLEAN)
```

#### `chat_sessions` - Sesiones de Chat
Sesiones activas del chatbot de WhatsApp.

```sql
- id (UUID, PK)
- phone_number (VARCHAR)
- patient_id (UUID, FK → patients)
- current_step (VARCHAR)
- selected_doctor_id (UUID, FK → doctors)
- selected_date (DATE)
- selected_time_slot_id (UUID, FK → time_slots)
- session_data (JSONB)
- is_active (BOOLEAN)
```

#### `notifications` - Notificaciones
Registro de todas las notificaciones enviadas.

```sql
- id (UUID, PK)
- appointment_id (UUID, FK → appointments)
- patient_id (UUID, FK → patients)
- notification_type (VARCHAR)
- channel (VARCHAR)
- phone_number (VARCHAR)
- message (TEXT)
- sent_at (TIMESTAMP)
- status (VARCHAR)
```

### Vistas (Views)

#### `v_appointments_full`
Citas con toda la información de paciente y doctor.

```sql
SELECT 
  a.*,
  p.name as patient_name,
  p.phone as patient_phone,
  d.name as doctor_name,
  d.specialty as doctor_specialty
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
```

#### `v_available_slots`
Slots disponibles con información del doctor.

```sql
SELECT 
  ts.*,
  d.name as doctor_name,
  d.specialty as doctor_specialty
FROM time_slots ts
JOIN doctors d ON ts.doctor_id = d.id
WHERE ts.is_available = true
  AND ts.slot_date >= CURRENT_DATE
```

### Funciones SQL

#### `generate_time_slots(schedule_id, start_date, end_date)`
Genera automáticamente los slots de tiempo para un horario.

```sql
SELECT generate_time_slots(
  'uuid-del-horario',
  '2024-11-06',
  '2024-12-06'
);
```

### Triggers Automáticos

1. **update_updated_at**: Actualiza automáticamente el campo `updated_at`
2. **mark_slot_unavailable**: Marca el slot como no disponible al crear una cita
3. **release_slot**: Libera el slot al cancelar una cita

## Consultas Útiles

### Ver todos los doctores activos
```sql
SELECT * FROM doctors WHERE is_active = true;
```

### Ver horarios de un doctor
```sql
SELECT * FROM schedules 
WHERE doctor_id = 'uuid-del-doctor' 
  AND is_active = true;
```

### Ver slots disponibles para hoy
```sql
SELECT * FROM v_available_slots 
WHERE slot_date = CURRENT_DATE;
```

### Ver citas confirmadas
```sql
SELECT * FROM v_appointments_full 
WHERE status = 'confirmed'
ORDER BY appointment_date, start_time;
```

### Generar slots para un horario
```sql
SELECT generate_time_slots(
  (SELECT id FROM schedules WHERE doctor_id = 'uuid-del-doctor' LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
);
```

## Mantenimiento

### Limpiar sesiones antiguas
```sql
DELETE FROM chat_sessions 
WHERE is_active = false 
  AND completed_at < NOW() - INTERVAL '7 days';
```

### Limpiar slots pasados
```sql
DELETE FROM time_slots 
WHERE slot_date < CURRENT_DATE - INTERVAL '30 days';
```

### Ver estadísticas
```sql
-- Citas por estado
SELECT status, COUNT(*) 
FROM appointments 
GROUP BY status;

-- Citas por doctor
SELECT d.name, COUNT(a.id) as total_citas
FROM doctors d
LEFT JOIN appointments a ON d.id = a.doctor_id
GROUP BY d.name;
```

## Seguridad (RLS)

La base de datos tiene Row Level Security (RLS) habilitado:

- **Lectura pública**: Cualquiera puede ver doctores activos y slots disponibles
- **Escritura autenticada**: Solo usuarios autenticados pueden crear/modificar citas
- **Service Role**: El backend usa service_role_key para operaciones completas

## Backup y Restauración

### Backup Automático
Supabase hace backups automáticos diarios.

### Backup Manual
1. Ve a "Database" → "Backups"
2. Clic en "Create backup"

### Exportar Datos
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Exportar schema
supabase db dump -f backup.sql
```

## Monitoring

### Ver logs en tiempo real
1. Ve a "Database" → "Logs"
2. Filtra por tipo: Queries, Errors, etc.

### Métricas
1. Ve a "Database" → "Reports"
2. Ver uso de CPU, memoria, conexiones

---

**¡Base de datos lista para usar! 🚀**
