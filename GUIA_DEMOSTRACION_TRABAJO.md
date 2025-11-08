# ============================================
# GUÍA DE DEMOSTRACIÓN - MEDICBOT
# Sistema de Citas Médicas por WhatsApp
# ============================================

## ✅ CUMPLIMIENTO DE REQUISITOS

### 1️⃣ PROGRAMACIÓN DE HORARIOS DE ATENCIÓN

**Cómo demostrarlo:**
1. Abre `http://localhost:3000/schedules`
2. Clic en "Nuevo Horario"
3. Completa el formulario:
   - Médico: Dr. Carlos Rodríguez - Cardiología
   - Fecha específica: Selecciona mañana
   - Hora inicio: 09:00
   - Hora fin: 17:00
   - Duración: 30 minutos
4. Clic en "Crear Horario"

**✅ Resultado esperado:**
- Mensaje: "Horario creado exitosamente"
- Se generan automáticamente slots de 30 minutos entre 09:00 y 17:00
- Aparece en la lista de horarios configurados

**📸 Captura para el informe:**
- Pantalla del formulario completado
- Lista de horarios mostrando el horario creado

### 2️⃣ CLIENTE PUEDE ELEGIR HORARIO DISPONIBLE

**Cómo demostrarlo:**
1. Abre WhatsApp en tu móvil
2. Envía un mensaje al chatbot: "Hola"
3. El bot responderá con lista de médicos
4. Escribe: "1" (para seleccionar primer médico)
5. El bot muestra fechas disponibles
6. Escribe: "2" (para mañana)
7. El bot muestra horarios disponibles
8. Escribe: "1" (para el primer horario)
9. El bot pide tu nombre
10. Escribe tu nombre completo

**✅ Resultado esperado:**
- El chatbot muestra los pasos de forma clara
- Filtra horarios NO disponibles
- Permite seleccionar SOLO horarios disponibles
- El flujo es intuitivo y guiado

**📸 Captura para el informe:**
- Captura de la conversación completa en WhatsApp
- Mostrar los horarios disponibles

### 3️⃣ NOTIFICACIÓN DE CONFIRMACIÓN

**Cómo demostrarlo:**
Después de escribir tu nombre en el paso anterior, inmediatamente recibirás un mensaje de confirmación automático.

**✅ Resultado esperado:**
Mensaje de WhatsApp que contiene:

```
✅ ¡CITA CONFIRMADA! ✅

Tu cita ha sido agendada exitosamente:

👨‍⚕️ Médico: Dr. Carlos Rodríguez
📅 Fecha: 08/11/2025
🕐 Hora: 09:00 - 09:30

📌 Código de cita: ABC12345

⏰ Recibirás un recordatorio 24 horas antes.

💬 Escribe "cancelar ABC12345" para cancelar.
```

**📸 Captura para el informe:**
- Captura del mensaje de confirmación completo
- Mostrar que llega INMEDIATAMENTE después de confirmar

### 🎯 Características adicionales (mencionar en el informe):
- Recordatorio automático 24h antes (sistema cron)
- Código único de cita para gestión
- Opción de cancelación

### 4️⃣ LISTAR CITAS CONFIRMADAS

**Cómo demostrarlo:**

**Opción A: Desde WhatsApp (para el cliente)**
1. En WhatsApp, envía: "mis citas"
2. El bot responde con todas tus citas confirmadas

**✅ Resultado esperado:**
```
📅 TUS CITAS PROGRAMADAS

Hola Juan Pérez,

Tienes 2 cita(s) programada(s):

1. ✅ Dr. Carlos Rodríguez
   Cardiología
   📅 08/11/2025 a las 09:00
   🔑 Código: ABC12345

2. ✅ Dra. María González
   Pediatría
   📅 09/11/2025 a las 14:30
   🔑 Código: XYZ67890

💡 Para cancelar: "cancelar ABC12345"
```

**Opción B: Desde la Web (para administrador)**
1. Abre `http://localhost:3000/appointments`
2. Ver lista completa de citas con:
   - Datos del paciente
   - Fecha y hora
   - Estado (Confirmada/Pendiente/Cancelada)
   - Doctor asignado
   - Filtros por estado y fecha
   - Opción de enviar recordatorios manualmente
   - Opción de cancelar citas

**📸 Captura para el informe:**
- Captura de WhatsApp con el comando "mis citas"
- Captura de la interfaz web mostrando la lista completa

## 🎯 FUNCIONALIDADES EXTRA (Puntos adicionales)

### 1. Dashboard con Estadísticas (`http://localhost:3000`)
- Total de citas
- Citas para hoy
- Médicos activos
- Slots disponibles
- Notificaciones enviadas

### 2. Sistema de Recordatorios Automáticos
- Recordatorio 24h antes vía WhatsApp
- API cron: `/api/cron/send-reminders`
- Marca automáticamente como enviado

### 3. Cancelación de Citas
- Por WhatsApp: "cancelar ABC12345"
- Desde web: Botón en cada cita
- Libera automáticamente el horario
- Notifica al paciente

### 4. Validaciones Inteligentes
- No permite fechas pasadas
- Verifica que el horario esté disponible
- Valida conflictos de horarios
- Zona horaria de Perú (UTC-5)

### 5. Sistema de Calificación Post-Cita
- Solicitud automática 24h después de la cita
- El paciente califica de 1 a 5 estrellas
- Almacenamiento en base de datos

## 📊 TECNOLOGÍAS UTILIZADAS

### Frontend & Backend
- ✅ **Next.js 14** - Framework React con API Routes
- ✅ **TypeScript** - Tipado estático
- ✅ **Tailwind CSS** - Estilos modernos

### Base de Datos
- ✅ **Supabase** - PostgreSQL en la nube
- ✅ Tablas: doctors, schedules, time_slots, appointments, patients, notifications
- ✅ Funciones SQL para generación de slots

### Comunicación
- ✅ **Twilio API** - WhatsApp Business
- ✅ Webhooks para mensajes entrantes
- ✅ Notificaciones automáticas

### Despliegue Local
- ✅ **ngrok** - Túnel para desarrollo local
- ✅ Variables de entorno (.env)
- ✅ Scripts PowerShell para automatización

## 📝 CHECKLIST PARA LA DEMOSTRACIÓN

### Antes de la demostración:
- [ ] Ejecutar script SQL de migración
- [ ] Verificar que la migración fue exitosa
- [ ] Reiniciar servidor: `npm run dev`
- [ ] Crear al menos 1 horario desde la web
- [ ] Verificar que se generaron time slots
- [ ] Iniciar ngrok: `ngrok http 3000`
- [ ] Configurar webhook en Twilio
- [ ] Probar chatbot enviando "hola"

### Durante la demostración:
- [ ] Mostrar Dashboard (`http://localhost:3000`)
- [ ] Explicar las estadísticas
- [ ] Crear Horario (`/schedules`)
- [ ] Mostrar formulario
- [ ] Explicar validaciones
- [ ] Crear horario de ejemplo
- [ ] Demostración en WhatsApp
- [ ] Agendar una cita completa
- [ ] Mostrar notificación de confirmación
- [ ] Ejecutar "mis citas"
- [ ] Cancelar una cita
- [ ] Mostrar Citas en Web (`/appointments`)
- [ ] Lista completa
- [ ] Filtros
- [ ] Acciones disponibles

### Características Extra (si hay tiempo)
- [ ] Recordatorios automáticos
- [ ] Sistema de calificación
- [ ] Zona horaria de Perú

## 🎬 GUION SUGERIDO (5 minutos)

**Minuto 1: Introducción**
"MedicBot es un sistema completo de gestión de citas médicas por WhatsApp. Utiliza Next.js, Supabase y Twilio para ofrecer una experiencia moderna y eficiente tanto para pacientes como para administradores."

**Minuto 2: Requisito 1 - Horarios**
"Primero, el administrador configura los horarios de atención. Aquí selecciono un médico, fecha, rango horario y duración de citas. El sistema genera automáticamente los espacios disponibles."

**Minuto 3: Requisito 2 - Reserva**
"El paciente abre WhatsApp y escribe 'Hola'. El chatbot lo guía paso a paso: elige médico, fecha y horario. Solo muestra horarios DISPONIBLES."

**Minuto 4: Requisito 3 - Notificación**
"Al confirmar, el paciente recibe inmediatamente una notificación con todos los detalles y un código único de cita. Además, recibirá un recordatorio automático 24 horas antes."

**Minuto 5: Requisito 4 - Listado**
"El paciente puede escribir 'mis citas' para ver todas sus citas. El administrador tiene una interfaz web completa con filtros, estadísticas y opciones de gestión."

## 📸 CAPTURAS RECOMENDADAS PARA EL INFORME

- Arquitectura del sistema (diagrama simple)
- Dashboard principal con estadísticas
- Formulario de creación de horario
- Lista de horarios configurados
- Conversación completa en WhatsApp (todos los pasos)
- Mensaje de confirmación en WhatsApp
- Comando "mis citas" con respuesta
- Interfaz web de gestión de citas
- Panel de ngrok mostrando el tráfico
- Código relevante (opcional: webhook handler)

## ⚠️ TROUBLESHOOTING

**Problema: "Could not find 'specific_date'"**
- **Solución:** Ejecutar el script SQL de migración en Supabase

**Problema: "Slot already taken"**
- **Solución:** El horario fue tomado por otro usuario. Elegir otro horario.

**Problema: ngrok no funciona**
- **Solución:** Ejecutar `ngrok http 3000` en una terminal separada

**Problema: WhatsApp no responde**
- **Solución:** Verificar que el webhook esté configurado correctamente en Twilio

## 🎓 CONCLUSIÓN PARA EL INFORME

MedicBot cumple exitosamente con los 4 requisitos obligatorios del proyecto:

### ✅ Programación de horarios: Interfaz web completa con validaciones
### ✅ Selección de horarios: Chatbot intuitivo que muestra solo disponibles
### ✅ Notificaciones: Confirmación inmediata + recordatorios automáticos
### ✅ Listado de citas: Comando WhatsApp + interfaz web de administración

**Además, incluye funcionalidades avanzadas:**
- Dashboard con estadísticas en tiempo real
- Sistema de recordatorios automáticos (cron jobs)
- Cancelación de citas vía WhatsApp
- Validaciones inteligentes de fechas y horarios
- Zona horaria configurable (Perú UTC-5)
- Sistema de calificación post-cita
- Interfaz responsive y moderna

**Tecnologías demostradas:**
- Frontend/Backend: Next.js + TypeScript
- Base de datos: Supabase (PostgreSQL)
- Comunicación: Twilio WhatsApp API
- Arquitectura: API RESTful + Webhooks

El sistema está listo para ser desplegado en producción y escalable para múltiples médicos y pacientes.
