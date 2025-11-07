import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { ChatSession, Appointment } from '@/lib/types';
import twilio from 'twilio';
import { format, addDays, startOfDay } from 'date-fns';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { From, Body } = req.body;
    const phoneNumber = From.replace('whatsapp:', '');
    const message = Body.trim();

    // Obtener o crear sesión de chat
    let session = await getOrCreateSession(phoneNumber);

    // Procesar el mensaje según el paso actual
    const response = await processMessage(session, message);

    // Enviar respuesta por WhatsApp
    await sendWhatsAppMessage(From, response);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
}

async function getOrCreateSession(phoneNumber: string): Promise<ChatSession> {
  const sessionsSnapshot = await adminDb
    .collection('chatSessions')
    .where('phoneNumber', '==', phoneNumber)
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (!sessionsSnapshot.empty) {
    const doc = sessionsSnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ChatSession;
  }

  // Crear nueva sesión
  const newSession: Omit<ChatSession, 'id'> = {
    phoneNumber,
    currentStep: 'greeting',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await adminDb.collection('chatSessions').add(newSession);
  return { id: docRef.id, ...newSession };
}

async function processMessage(
  session: ChatSession,
  message: string
): Promise<string> {
  const lowerMessage = message.toLowerCase();

  switch (session.currentStep) {
    case 'greeting':
      await updateSession(session.id, { currentStep: 'selecting_doctor' });
      return '¡Bienvenido al sistema de citas médicas! 🏥\n\n' +
        'Tenemos los siguientes médicos disponibles:\n' +
        '1. Dr. Juan Pérez - Medicina General\n' +
        '2. Dra. María González - Pediatría\n' +
        '3. Dr. Carlos Rodríguez - Cardiología\n\n' +
        'Por favor, responde con el número del médico que deseas consultar.';

    case 'selecting_doctor':
      const doctorMap: { [key: string]: string } = {
        '1': 'Dr. Juan Pérez',
        '2': 'Dra. María González',
        '3': 'Dr. Carlos Rodríguez',
      };

      const selectedDoctor = doctorMap[message];
      if (!selectedDoctor) {
        return 'Por favor, selecciona un número válido (1, 2 o 3).';
      }

      await updateSession(session.id, {
        currentStep: 'selecting_date',
        selectedDoctor,
      });

      return `Has seleccionado a ${selectedDoctor}.\n\n` +
        'Fechas disponibles:\n' +
        '1. Hoy\n' +
        '2. Mañana\n' +
        '3. Pasado mañana\n\n' +
        'Por favor, responde con el número de la fecha que prefieres.';

    case 'selecting_date':
      const dateMap: { [key: string]: string } = {
        '1': format(new Date(), 'yyyy-MM-dd'),
        '2': format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        '3': format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      };

      const selectedDate = dateMap[message];
      if (!selectedDate) {
        return 'Por favor, selecciona un número válido (1, 2 o 3).';
      }

      // Obtener horarios disponibles
      const availableSlots = await getAvailableTimeSlots(
        session.selectedDoctor!,
        selectedDate
      );

      if (availableSlots.length === 0) {
        return 'Lo sentimos, no hay horarios disponibles para esa fecha. Por favor, selecciona otra fecha:\n' +
          '1. Hoy\n' +
          '2. Mañana\n' +
          '3. Pasado mañana';
      }

      await updateSession(session.id, {
        currentStep: 'selecting_time',
        selectedDate,
      });

      let slotsMessage = 'Horarios disponibles:\n';
      availableSlots.forEach((slot, index) => {
        slotsMessage += `${index + 1}. ${slot.startTime} - ${slot.endTime}\n`;
      });
      slotsMessage += '\nPor favor, responde con el número del horario que prefieres.';

      return slotsMessage;

    case 'selecting_time':
      const slotIndex = parseInt(message) - 1;
      const slots = await getAvailableTimeSlots(
        session.selectedDoctor!,
        session.selectedDate!
      );

      if (slotIndex < 0 || slotIndex >= slots.length) {
        return 'Por favor, selecciona un número válido de la lista.';
      }

      const selectedSlot = slots[slotIndex];
      await updateSession(session.id, {
        currentStep: 'confirming',
        selectedTimeSlot: `${selectedSlot.startTime}-${selectedSlot.endTime}`,
      });

      return `Has seleccionado:\n` +
        `👨‍⚕️ Médico: ${session.selectedDoctor}\n` +
        `📅 Fecha: ${session.selectedDate}\n` +
        `🕐 Hora: ${selectedSlot.startTime} - ${selectedSlot.endTime}\n\n` +
        'Por favor, escribe tu nombre completo para confirmar la cita.';

    case 'confirming':
      const patientName = message;

      // Crear la cita
      const appointment: Omit<Appointment, 'id' | 'createdAt'> = {
        patientName,
        patientPhone: session.phoneNumber,
        doctorName: session.selectedDoctor!,
        date: session.selectedDate!,
        timeSlot: session.selectedTimeSlot!,
        status: 'confirmed',
        notificationSent: true,
      };

      const appointmentData: Omit<Appointment, 'id'> = {
        ...appointment,
        createdAt: new Date().toISOString(),
      };

      const docRef = await adminDb.collection('appointments').add(appointmentData);

      // Marcar slot como no disponible
      const timeSlotSnapshot = await adminDb
        .collection('timeSlots')
        .where('doctorName', '==', session.selectedDoctor)
        .where('date', '==', session.selectedDate)
        .where('startTime', '==', session.selectedTimeSlot!.split('-')[0])
        .get();

      if (!timeSlotSnapshot.empty) {
        await adminDb.collection('timeSlots').doc(timeSlotSnapshot.docs[0].id).update({
          isAvailable: false,
          appointmentId: docRef.id,
        });
      }

      await updateSession(session.id, { currentStep: 'completed' });

      return `✅ ¡Cita confirmada!\n\n` +
        `Nombre: ${patientName}\n` +
        `Médico: ${session.selectedDoctor}\n` +
        `Fecha: ${session.selectedDate}\n` +
        `Hora: ${session.selectedTimeSlot}\n\n` +
        `Tu número de cita es: ${docRef.id}\n\n` +
        'Recibirás un recordatorio antes de tu cita. ¡Gracias!';

    case 'completed':
      return '¿Deseas agendar otra cita? Escribe "nueva cita" para comenzar.';

    default:
      return 'Lo siento, algo salió mal. Escribe "ayuda" para comenzar de nuevo.';
  }
}

async function updateSession(
  sessionId: string,
  updates: Partial<ChatSession>
): Promise<void> {
  await adminDb
    .collection('chatSessions')
    .doc(sessionId)
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
}

async function getAvailableTimeSlots(doctorName: string, date: string) {
  const slotsSnapshot = await adminDb
    .collection('timeSlots')
    .where('doctorName', '==', doctorName)
    .where('date', '==', date)
    .where('isAvailable', '==', true)
    .orderBy('startTime')
    .get();

  const slots: any[] = [];
  slotsSnapshot.forEach((doc) => {
    slots.push({ id: doc.id, ...doc.data() });
  });

  return slots;
}

async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to,
    body: message,
  });
}
