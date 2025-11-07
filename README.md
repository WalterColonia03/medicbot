# MedicBot - Sistema de Citas Médicas por WhatsApp

Sistema completo de gestión de citas médicas que permite a los pacientes reservar citas a través de WhatsApp mediante un chatbot inteligente.

## 🚀 Características

- ✅ **Chatbot de WhatsApp**: Los pacientes pueden agendar citas mediante conversación natural
- 📅 **Gestión de Horarios**: Configuración flexible de horarios de atención por médico
- ⏰ **Generación Automática de Slots**: Crea automáticamente espacios de tiempo disponibles
- 📱 **Notificaciones**: Envío de recordatorios por WhatsApp
- 🗂️ **Gestión de Citas**: Visualiza y administra todas las citas confirmadas
- 💻 **Interfaz Web Moderna**: Panel de control con diseño responsivo
- 📲 **PWA Ready**: Instalable como app móvil

## 📋 Requisitos

- Node.js 18+ 
- Cuenta de Firebase (Firestore Database)
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

### 3. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Firestore Database
3. Crea una aplicación web y copia las credenciales
4. En "Project Settings" > "Service Accounts", genera una nueva clave privada

### 4. Configurar Twilio

1. Crea una cuenta en [Twilio](https://www.twilio.com/)
2. Activa WhatsApp Business API
3. Configura un número de WhatsApp
4. Copia tu Account SID y Auth Token

### 5. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales reales.

### 6. Iniciar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Configuración del Webhook de Twilio

Para que el chatbot funcione, debes configurar el webhook en Twilio:

1. En Twilio Console, ve a "Messaging" > "Settings" > "WhatsApp Sandbox Settings"
2. En "When a message comes in", configura:
   - URL: `https://tu-dominio.com/api/webhook/twilio`
   - Method: POST
3. Guarda los cambios

**Nota**: Para desarrollo local, puedes usar [ngrok](https://ngrok.com/) para exponer tu servidor:

```bash
ngrok http 3000
```

Luego usa la URL de ngrok en el webhook de Twilio.

## 🔧 Estructura del Proyecto

```
medicbot/
├── src/
│   ├── lib/
│   │   ├── types.ts          # Tipos de datos TypeScript
│   │   └── firebase/         # Configuración de Firebase
│   ├── pages/
│   │   ├── api/              # API Routes de Next.js
│   │   │   ├── appointments/ # Gestión de citas
│   │   │   ├── schedules/    # Gestión de horarios
│   │   │   ├── timeslots/    # Gestión de slots de tiempo
│   │   │   ├── webhook/      # Webhook de Twilio
│   │   │   └── notifications/# Envío de notificaciones
│   │   ├── index.tsx         # Página principal
│   │   ├── appointments.tsx  # Listado de citas
│   │   └── schedules.tsx     # Gestión de horarios
│   └── styles/               # Estilos globales
└── public/                   # Archivos estáticos
```

## 📖 Uso del Sistema

### 1. Configurar Horarios

1. Accede a la sección "Horarios" en el panel web
2. Clic en "Nuevo Horario"
3. Selecciona el médico, día de la semana, horario y duración de citas
4. Guarda el horario

### 2. Generar Espacios de Tiempo

1. En cada horario configurado, haz clic en "Generar Espacios de Tiempo"
2. El sistema creará automáticamente los slots disponibles para los próximos 30 días

### 3. Reservar Citas por WhatsApp

Los pacientes pueden enviar un mensaje al número de WhatsApp configurado. El chatbot los guiará:

1. Saludo inicial
2. Selección de médico
3. Selección de fecha
4. Selección de horario
5. Confirmación con nombre del paciente
6. Notificación de cita confirmada

### 4. Ver Citas Confirmadas

- Accede a la sección "Citas" en el panel web
- Filtra por estado: Todas, Confirmadas o Canceladas
- Envía recordatorios manualmente con el botón "Enviar Recordatorio"

## 🔐 Estructura de Datos (Firebase)

### Colección: `schedules`
```typescript
{
  doctorName: string
  dayOfWeek: number (0-6)
  startTime: string (HH:MM)
  endTime: string (HH:MM)
  slotDuration: number (minutos)
  isActive: boolean
}
```

### Colección: `timeSlots`
```typescript
{
  doctorName: string
  date: string (YYYY-MM-DD)
  startTime: string (HH:MM)
  endTime: string (HH:MM)
  isAvailable: boolean
  appointmentId?: string
}
```

### Colección: `appointments`
```typescript
{
  patientName: string
  patientPhone: string
  doctorName: string
  date: string (YYYY-MM-DD)
  timeSlot: string (HH:MM-HH:MM)
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
  notificationSent: boolean
}
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel`
3. Configura las variables de entorno en Vercel Dashboard
4. Actualiza el webhook de Twilio con tu URL de producción

### Otras plataformas

El proyecto es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Railway

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para soporte y preguntas, abre un issue en el repositorio.

---

Desarrollado con ❤️ usando Next.js, Firebase y Twilio
