# 🎯 Próximos Pasos para Ejecutar MedicBot

## ✅ Estado Actual
La aplicación MedicBot ha sido creada completamente. La instalación de dependencias está en progreso.

---

## 📝 Pasos Siguientes (En Orden)

### PASO 1: Esperar la instalación de dependencias ⏳
```bash
# La instalación ya está en progreso...
# Espera a que termine (puede tomar 2-5 minutos)
```

Verás un mensaje como: "added XXX packages" cuando termine.

---

### PASO 2: Configurar Firebase 🔥

#### 2.1 Crear Proyecto Firebase
1. Ve a: https://console.firebase.google.com/
2. Clic en "Agregar proyecto"
3. Nombre: "medicbot" (o el que prefieras)
4. Sigue los pasos (puedes desactivar Google Analytics)

#### 2.2 Habilitar Firestore
1. En el menú lateral: "Compilación" → "Firestore Database"
2. Clic en "Crear base de datos"
3. Modo: "Comenzar en modo de producción"
4. Ubicación: Elige la más cercana
5. Clic en "Habilitar"

#### 2.3 Obtener Credenciales Web
1. En "Configuración del proyecto" (⚙️)
2. En "Tus aplicaciones" → Ícono web (</>)
3. Nombre de la app: "medicbot-web"
4. Copia las credenciales que aparecen

#### 2.4 Obtener Credenciales Admin
1. En "Configuración del proyecto" → "Cuentas de servicio"
2. Clic en "Generar nueva clave privada"
3. Se descargará un archivo JSON
4. Guarda este archivo en lugar seguro

---

### PASO 3: Configurar Twilio (WhatsApp) 📱

#### 3.1 Crear Cuenta Twilio
1. Ve a: https://www.twilio.com/try-twilio
2. Regístrate (versión de prueba es gratuita)
3. Verifica tu número de teléfono

#### 3.2 Activar WhatsApp Sandbox
1. En el Dashboard: "Messaging" → "Try it out" → "Send a WhatsApp message"
2. Sigue las instrucciones para unirte al sandbox
3. Envía el mensaje desde tu WhatsApp al número indicado

#### 3.3 Obtener Credenciales
1. En "Account" → "API keys & tokens"
2. Copia:
   - Account SID
   - Auth Token
3. El número de WhatsApp del sandbox está en la configuración de WhatsApp

---

### PASO 4: Configurar Variables de Entorno 🔐

#### 4.1 Crear archivo .env
```bash
# En la carpeta medicbot, copia el ejemplo:
cp .env.example .env
```

#### 4.2 Editar .env con tus credenciales

Abre el archivo `.env` y completa:

```env
# Firebase Web (del paso 2.3)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=medicbot-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=medicbot-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=medicbot-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx

# Firebase Admin (del archivo JSON del paso 2.4)
FIREBASE_PROJECT_ID=medicbot-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@medicbot-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"

# Twilio (del paso 3.3)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
```

**⚠️ IMPORTANTE:** 
- La PRIVATE_KEY debe estar entre comillas
- Los saltos de línea deben ser `\n`
- NO compartas este archivo, está en .gitignore

---

### PASO 5: Iniciar la Aplicación 🚀

```bash
# Asegúrate de estar en la carpeta medicbot
cd c:\Users\walte\CascadeProjects\windsurf-project\medicbot

# Inicia el servidor de desarrollo
npm run dev
```

Deberías ver:
```
> medicbot@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Ready in XXXms
```

---

### PASO 6: Probar el Panel Web 🌐

1. Abre tu navegador en: http://localhost:3000
2. Verás el Dashboard principal
3. Ve a "Horarios" → Clic en "Nuevo Horario"
4. Completa el formulario:
   - Médico: "Dr. Juan Pérez"
   - Día: "Lunes"
   - Hora inicio: "09:00"
   - Hora fin: "17:00"
   - Duración: "30 minutos"
5. Clic en "Guardar"
6. Clic en "Generar Espacios de Tiempo"
7. Ve a "Citas" para ver el listado vacío inicialmente

---

### PASO 7: Configurar Webhook de Twilio 🔗

#### Para desarrollo local (usando ngrok):

**7.1 Instalar ngrok:**
1. Ve a: https://ngrok.com/download
2. Descarga e instala ngrok
3. Crea una cuenta gratuita

**7.2 Ejecutar ngrok:**
```bash
# En otra terminal (NUEVA):
ngrok http 3000
```

Verás algo como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**7.3 Configurar en Twilio:**
1. Ve a Twilio Console
2. "Messaging" → "Settings" → "WhatsApp sandbox settings"
3. En "When a message comes in":
   - URL: `https://abc123.ngrok.io/api/webhook/twilio`
   - Método: `POST`
4. Clic en "Save"

---

### PASO 8: Probar el Chatbot de WhatsApp 💬

1. Abre WhatsApp en tu teléfono
2. Ve a la conversación con el número de Twilio Sandbox
3. Envía cualquier mensaje (ej: "Hola")
4. El bot debería responder con el menú de médicos
5. Sigue el flujo:
   - Selecciona médico (1, 2 o 3)
   - Selecciona fecha (1, 2 o 3)
   - Selecciona horario
   - Escribe tu nombre
6. Recibirás confirmación de la cita

---

### PASO 9: Verificar la Cita en el Panel 📋

1. Vuelve a http://localhost:3000/appointments
2. Deberías ver la cita que acabas de crear
3. Puedes enviar un recordatorio con el botón

---

## 🎉 ¡Listo! Tu Sistema Está Funcionando

### Funcionalidades Disponibles:

✅ Panel web de administración  
✅ Gestión de horarios  
✅ Generación automática de slots  
✅ Chatbot de WhatsApp  
✅ Reserva de citas  
✅ Notificaciones automáticas  
✅ Listado de citas  
✅ Envío de recordatorios  

---

## 🚀 Desplegar a Producción (Opcional)

### Opción 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en:
# https://vercel.com/dashboard → tu-proyecto → Settings → Environment Variables
```

### Opción 2: Otras plataformas
- Netlify
- Railway
- AWS Amplify
- Google Cloud Run

**Recuerda:** Actualiza el webhook de Twilio con tu URL de producción.

---

## 📚 Documentación Disponible

- 📖 **README.md** - Documentación completa del proyecto
- 📝 **INSTRUCCIONES.txt** - Guía detallada de instalación
- ⚡ **GUIA_RAPIDA.md** - Inicio rápido en 5 minutos
- 📊 **RESUMEN_PROYECTO.md** - Arquitectura y detalles técnicos
- 🎯 **PROXIMOS_PASOS.md** - Este archivo

---

## ❓ Preguntas Frecuentes

### ¿Cuánto cuesta Twilio?
- Versión de prueba: GRATIS (con limitaciones)
- Producción: ~$0.005 por mensaje

### ¿Cuánto cuesta Firebase?
- Spark Plan (gratuito): 50,000 lecturas/día
- Para esta app, el plan gratuito es suficiente inicialmente

### ¿Necesito un dominio?
- Para desarrollo: NO
- Para producción: Recomendado pero no obligatorio

### ¿Funciona en móvil?
- ¡SÍ! Es una PWA instalable

---

## 🆘 Si Algo No Funciona

1. **Verifica que npm install terminó correctamente**
2. **Revisa que .env esté configurado correctamente**
3. **Asegúrate que Firebase Firestore esté habilitado**
4. **Verifica que el webhook de Twilio apunte a la URL correcta**
5. **Revisa la consola del navegador (F12) para errores**
6. **Revisa la terminal donde corre `npm run dev` para errores**

---

## 🎊 ¡Éxito!

Una vez que todo funcione, tendrás un sistema completo de citas médicas que tus pacientes pueden usar desde WhatsApp. 

**¡Buena suerte! 🚀**
