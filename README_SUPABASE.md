# MedicBot - Sistema de Citas Médicas por WhatsApp (Supabase)

Sistema completo de gestión de citas médicas que permite a los pacientes reservar citas a través de WhatsApp mediante un chatbot inteligente, utilizando **Supabase** como base de datos.

## 🚀 Características

- ✅ **Chatbot de WhatsApp**: Los pacientes pueden agendar citas mediante conversación natural
- 📅 **Gestión de Horarios**: Configuración flexible de horarios de atención por médico
- ⏰ **Generación Automática de Slots**: Crea automáticamente espacios de tiempo disponibles usando funciones SQL
- 📱 **Notificaciones**: Envío de recordatorios por WhatsApp
- 🗂️ **Gestión de Citas**: Visualiza y administra todas las citas confirmadas
- 💻 **Interfaz Web Moderna**: Panel de control con diseño responsivo
- 📲 **PWA Ready**: Instalable como app móvil
- 🔐 **Base de Datos PostgreSQL**: Robusta, relacional y escalable con Supabase

## 📋 Requisitos

- Node.js 18+ 
- Cuenta de Supabase (gratuita disponible)
- Cuenta de Twilio con WhatsApp Business API habilitado

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd medicbot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

#### 3.1 Crear Proyecto

1. Ve a [Supabase](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Clic en "New Project"
4. Completa:
   - **Name**: medicbot
   - **Database Password**: (genera y guarda una contraseña segura)
   - **Region**: Selecciona la más cercana
5. Espera a que el proyecto se cree (~2 minutos)

#### 3.2 Ejecutar el Esquema SQL

1. En Supabase, ve a "SQL Editor"
2. Clic en "New query"
3. Abre el archivo `database/schema.sql`
4. Copia todo su contenido
5. Pégalo en el editor SQL
6. Clic en "Run"

✅ Esto creará:
- 7 tablas principales
- 2 vistas para consultas eficientes
- 4 funciones SQL automatizadas
- Triggers para gestión automática
- 3 doctores de ejemplo
- Políticas de seguridad RLS

#### 3.3 Obtener Credenciales

1. En Supabase, ve a "Settings" (⚙️) → "API"
2. Copia:
   - **Project URL**: Tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: Tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (Reveal): Tu `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configurar Twilio

1. Crea una cuenta en [Twilio](https://www.twilio.com/)
2. Activa WhatsApp Business API Sandbox
3. Copia Account SID y Auth Token
4. Anota el número de WhatsApp del sandbox

### 5. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Twilio
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 6. Iniciar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Configuración del Webhook de Twilio

### Para Desarrollo Local (ngrok):

```bash
# Instala ngrok
npm install -g ngrok

# En otra terminal
ngrok http 3000
```

Configura en Twilio Console:
- URL: `https://xxxxx.ngrok.io/api/webhook/twilio-supabase`
- Método: POST

### Para Producción:

Usa tu URL de producción:
- URL: `https://tu-dominio.com/api/webhook/twilio-supabase`
- Método: POST

## 🔧 Estructura del Proyecto

```
medicbot/
├── database/
│   ├── schema.sql              # Esquema completo de la base de datos
│   └── README.md               # Documentación de la base de datos
│
├── src/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── config.ts      # Configuración
│   │   │   ├── client.ts       # Cliente para navegador
│   │   │   ├── server.ts       # Cliente para servidor
│   │   │   └── database.types.ts  # Tipos TypeScript
│   │   ├── types.ts            # Tipos compartidos
│   │   └── utils.ts            # Utilidades
│   │
│   ├── pages/
│   │   ├── api/
│   │   │   ├── doctors/        # API de médicos
│   │   │   ├── schedules/      # API de horarios
│   │   │   ├── timeslots/      # API de slots
│   │   │   ├── appointments/   # API de citas
│   │   │   ├── webhook/        # Webhook de Twilio
│   │   │   └── notifications/  # Notificaciones
│   │   │
│   │   ├── index.tsx           # Dashboard
│   │   ├── appointments.tsx    # Gestión de citas
│   │   └── schedules.tsx       # Gestión de horarios
│   │
│   └── styles/
│       └── globals.css
│
└── public/
    └── manifest.json           # PWA manifest
```

## 📊 Esquema de Base de Datos

### Tablas Principales:

1. **doctors** - Médicos del sistema
2. **schedules** - Horarios semanales
3. **time_slots** - Espacios de tiempo específicos
4. **patients** - Pacientes registrados
5. **appointments** - Citas programadas
6. **chat_sessions** - Sesiones de WhatsApp
7. **notifications** - Registro de notificaciones

### Vistas:

- **v_appointments_full** - Citas con info completa
- **v_available_slots** - Slots disponibles con doctor

### Funciones SQL:

- **generate_time_slots()** - Genera slots automáticamente
- **mark_slot_unavailable()** - Marca slot como ocupado
- **release_slot_on_cancel()** - Libera slot al cancelar

Ver `database/README.md` para documentación completa.

## 📖 Uso del Sistema

### 1. Configurar Horarios (Administrador)

```
1. Ir a /schedules
2. Clic en "Nuevo Horario"
3. Seleccionar doctor, día, horario
4. Guardar
5. Clic en "Generar Espacios de Tiempo"
```

### 2. Reservar Cita (Paciente por WhatsApp)

```
Paciente: Hola
Bot: ¡Bienvenido! Selecciona un médico:
     1. Dr. Juan Pérez - Medicina General
     2. Dra. María González - Pediatría
     3. Dr. Carlos Rodríguez - Cardiología

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
Bot: ✅ ¡Cita confirmada!
```

### 3. Ver Citas (Administrador)

```
1. Ir a /appointments
2. Filtrar por estado
3. Enviar recordatorios
```

## 🎯 Ventajas de Supabase

### vs Firebase:

✅ **Base de Datos Relacional (PostgreSQL)**
- Consultas SQL complejas
- Joins eficientes
- Integridad referencial
- Transacciones ACID

✅ **Funciones SQL y Triggers**
- Lógica de negocio en la base de datos
- Generación automática de slots
- Validaciones a nivel de base de datos

✅ **Vistas Materializadas**
- Consultas optimizadas
- Mejor rendimiento

✅ **Row Level Security (RLS)**
- Seguridad a nivel de fila
- Políticas granulares

✅ **Tipos Fuertemente Tipados**
- TypeScript generado automáticamente
- Autocomplete en el IDE

✅ **Realtime Subscriptions**
- Actualizaciones en tiempo real (opcional)

✅ **Open Source**
- Self-hosteable
- Sin vendor lock-in

## 🔐 Seguridad

- **RLS habilitado**: Control de acceso a nivel de fila
- **Service Role Key**: Solo para servidor
- **Anon Key**: Segura para el cliente
- **Variables de entorno**: Credenciales protegidas
- **Validaciones SQL**: Constraints en base de datos

## 🚀 Despliegue

### Vercel:

```bash
npm i -g vercel
vercel
```

Configurar variables de entorno en Vercel Dashboard.

### Otras Opciones:
- Netlify
- Railway
- AWS Amplify

Actualizar webhook de Twilio con URL de producción.

## 📈 Escalabilidad

Supabase soporta:
- ✅ Hasta 500MB en plan gratuito
- ✅ 50,000 usuarios activos mensuales
- ✅ 2GB de ancho de banda
- ✅ Backups automáticos
- ✅ Escalamiento horizontal

## 🔄 Migración desde Firebase

Si tienes datos en Firebase:

1. Exporta datos de Firestore
2. Transforma a formato SQL
3. Importa a Supabase

Script de ayuda disponible en `database/migration.js` (crear si es necesario).

## 🐛 Troubleshooting

### Error: Cannot connect to Supabase
- Verifica credenciales en `.env`
- Verifica que el proyecto esté activo
- Revisa políticas RLS

### Error: Slot not available
- Regenera los slots
- Verifica que el horario esté activo

### Error: Twilio webhook not working
- Verifica URL del webhook
- Verifica que apunte a `/api/webhook/twilio-supabase`
- Revisa logs en Twilio Console

## 📞 Consultas SQL Útiles

Ver `database/README.md` para consultas completas.

## 📄 Licencia

MIT License

## 🤝 Contribuciones

Las contribuciones son bienvenidas.

---

**Desarrollado con Next.js, Supabase (PostgreSQL) y Twilio** 🚀

Para documentación completa de la base de datos, ver `database/README.md`
