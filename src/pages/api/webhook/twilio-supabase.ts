import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import twilio from 'twilio';
import { format, addDays } from 'date-fns';

// Perú: UTC-5 (sin horario de verano)
const PERU_UTC_OFFSET = -5;

// Helper: Obtener fecha/hora actual en Perú
function getPeruDateTime(): Date {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const peruTime = new Date(utcTime + (3600000 * PERU_UTC_OFFSET));
  return peruTime;
}

// Helper: Formatear fecha en zona horaria de Perú
function formatPeruDate(date: Date, formatStr: string): string {
  return format(date, formatStr);
}

// Helper: Obtener hora actual en formato HH:mm
function getCurrentPeruTime(): string {
  const peru = getPeruDateTime();
  const hours = peru.getHours().toString().padStart(2, '0');
  const minutes = peru.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

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
    console.log('📱 WEBHOOK: Request recibido');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    
    const { From, Body } = req.body;
    
    if (!From || !Body) {
      console.log('❌ WEBHOOK: From o Body undefined');
      return res.status(400).json({ error: 'From y Body son requeridos' });
    }
    
    const phoneNumber = From.replace('whatsapp:', '');
    const message = Body.trim();
    
    console.log('📱 De:', phoneNumber);
    console.log('💬 Mensaje:', message);

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

async function getOrCreateSession(phoneNumber: string) {
  // Buscar sesión activa existente
  const { data: sessions, error } = await supabaseServer
    .from('chat_sessions')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (sessions && sessions.length > 0) {
    return sessions[0];
  }

  // Crear nueva sesión
  const { data: newSession, error: createError } = await supabaseServer
    .from('chat_sessions')
    .insert({
      phone_number: phoneNumber,
      current_step: 'greeting',
      is_active: true,
    })
    .select()
    .single();

  if (createError) throw createError;

  return newSession;
}

async function processMessage(session: any, message: string): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Resetear sesión si el usuario escribe "nueva cita" o "ayuda"
  if (lowerMessage.includes('nueva cita') || lowerMessage.includes('ayuda') || lowerMessage.includes('hola') || lowerMessage.includes('menu')) {
    await updateSession(session.id, { 
      current_step: 'greeting',
      selected_doctor_id: null,
      selected_date: null,
      selected_time_slot_id: null
    });
    session.current_step = 'greeting';
  }

  switch (session.current_step) {
    case 'greeting':
      await updateSession(session.id, { current_step: 'selecting_doctor' });
      
      // Obtener doctores activos desde Supabase
      const { data: doctors, error: doctorsError } = await supabaseServer
        .from('doctors')
        .select('id, name, specialty')
        .eq('is_active', true)
        .order('name');

      if (doctorsError || !doctors || doctors.length === 0) {
        return 'Lo siento, no hay médicos disponibles en este momento. Por favor, intente más tarde.';
      }

      let doctorsMessage = '¡Bienvenido al sistema de citas médicas! 🏥\n\n';
      doctorsMessage += 'Selecciona un médico escribiendo el número:\n\n';
      
      doctors.forEach((doctor: any, index: number) => {
        doctorsMessage += `${index + 1}. ${doctor.name} - ${doctor.specialty}\n`;
      });

      doctorsMessage += '\n💡 Escribe "nueva cita" en cualquier momento para empezar de nuevo.';

      return doctorsMessage;

    case 'selecting_doctor':
      const doctorIndex = parseInt(message) - 1;
      
      const { data: doctorsForSelection } = await supabaseServer
        .from('doctors')
        .select('id, name, specialty')
        .eq('is_active', true)
        .order('name');

      if (!doctorsForSelection || doctorIndex < 0 || doctorIndex >= doctorsForSelection.length) {
        return 'Por favor, selecciona un número válido de la lista de médicos.';
      }

      const selectedDoctor = doctorsForSelection[doctorIndex];
      
      await updateSession(session.id, {
        current_step: 'selecting_date',
        selected_doctor_id: selectedDoctor.id,
      });

      // Obtener fecha/hora actual de Perú
      const peruNow = getPeruDateTime();
      const currentTime = getCurrentPeruTime();
      const today = formatPeruDate(peruNow, 'yyyy-MM-dd');
      
      // Verificar si hay horarios disponibles HOY después de la hora actual
      const { data: todaySlots } = await supabaseServer
        .from('time_slots')
        .select('id')
        .eq('doctor_id', selectedDoctor.id)
        .eq('slot_date', today)
        .eq('is_available', true)
        .gt('start_time', currentTime)
        .limit(1);
      
      let dateMessage = `Has seleccionado a ${selectedDoctor.name} (${selectedDoctor.specialty}).\n\n`;
      dateMessage += 'Selecciona una fecha escribiendo el número:\n\n';
      
      let dateOptions = [];
      
      // Solo mostrar "Hoy" si hay horarios disponibles
      if (todaySlots && todaySlots.length > 0) {
        dateOptions.push(`1. Hoy (${formatPeruDate(peruNow, 'dd/MM/yyyy')})`);
      }
      
      dateOptions.push(`2. Mañana (${formatPeruDate(addDays(peruNow, 1), 'dd/MM/yyyy')})`);
      dateOptions.push(`3. Pasado mañana (${formatPeruDate(addDays(peruNow, 2), 'dd/MM/yyyy')})`);
      
      dateMessage += dateOptions.join('\n');
      
      // Si no hay horarios hoy, agregar nota
      if (!todaySlots || todaySlots.length === 0) {
        dateMessage += '\n\n⚠️ No hay horarios disponibles para hoy.';
      }
      
      return dateMessage;

    case 'selecting_date':
      const peruNowForDate = getPeruDateTime();
      const currentTimeForSlots = getCurrentPeruTime();
      const todayDate = formatPeruDate(peruNowForDate, 'yyyy-MM-dd');
      
      const dateMap: { [key: string]: string } = {
        '1': todayDate,
        '2': formatPeruDate(addDays(peruNowForDate, 1), 'yyyy-MM-dd'),
        '3': formatPeruDate(addDays(peruNowForDate, 2), 'yyyy-MM-dd'),
      };

      const selectedDate = dateMap[message];
      if (!selectedDate) {
        return 'Por favor, selecciona un número válido (1, 2 o 3).';
      }

      // Si es HOY, filtrar horarios pasados
      const isToday = selectedDate === todayDate;
      
      let query = supabaseServer
        .from('time_slots')
        .select('*')
        .eq('doctor_id', session.selected_doctor_id)
        .eq('slot_date', selectedDate)
        .eq('is_available', true);
      
      // Filtrar horarios pasados solo si es hoy
      if (isToday) {
        query = query.gt('start_time', currentTimeForSlots);
      }
      
      const { data: availableSlots } = await query
        .order('start_time')
        .limit(10);

      if (!availableSlots || availableSlots.length === 0) {
        return 'Lo sentimos, no hay horarios disponibles para esa fecha.\n\n' +
          'Por favor, selecciona otra fecha:\n' +
          '1. Hoy\n' +
          '2. Mañana\n' +
          '3. Pasado mañana';
      }

      await updateSession(session.id, {
        current_step: 'selecting_time',
        selected_date: selectedDate,
      });

      let slotsMessage = 'Horarios disponibles:\n\n';
      availableSlots.forEach((slot, index) => {
        slotsMessage += `${index + 1}. ${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}\n`;
      });
      slotsMessage += '\nEscribe el número del horario que prefieres.';

      return slotsMessage;

    case 'selecting_time':
      const slotIndex = parseInt(message) - 1;
      
      const { data: slotsForSelection } = await supabaseServer
        .from('time_slots')
        .select('*')
        .eq('doctor_id', session.selected_doctor_id)
        .eq('slot_date', session.selected_date)
        .eq('is_available', true)
        .order('start_time')
        .limit(10);

      if (!slotsForSelection || slotIndex < 0 || slotIndex >= slotsForSelection.length) {
        return 'Por favor, selecciona un número válido de la lista de horarios.';
      }

      const selectedSlot = slotsForSelection[slotIndex];
      
      // Obtener información del doctor
      const { data: doctorInfo } = await supabaseServer
        .from('doctors')
        .select('name, specialty')
        .eq('id', session.selected_doctor_id)
        .single();

      await updateSession(session.id, {
        current_step: 'confirming',
        selected_time_slot_id: selectedSlot.id,
      });

      return `Has seleccionado:\n\n` +
        `👨‍⚕️ Médico: ${doctorInfo?.name}\n` +
        `📅 Fecha: ${format(new Date(session.selected_date), 'dd/MM/yyyy')}\n` +
        `🕐 Hora: ${selectedSlot.start_time.substring(0, 5)} - ${selectedSlot.end_time.substring(0, 5)}\n\n` +
        'Por favor, escribe tu nombre completo para confirmar la cita.';

    case 'confirming':
      const patientName = message;

      // Buscar o crear paciente
      let { data: patient } = await supabaseServer
        .from('patients')
        .select('*')
        .eq('phone', session.phone_number)
        .single();

      if (!patient) {
        const { data: newPatient } = await supabaseServer
          .from('patients')
          .insert({ name: patientName, phone: session.phone_number })
          .select()
          .single();
        patient = newPatient;
      } else {
        // Actualizar nombre si es diferente
        await supabaseServer
          .from('patients')
          .update({ name: patientName })
          .eq('id', patient.id);
      }

      // Obtener información del slot
      const { data: slotData } = await supabaseServer
        .from('time_slots')
        .select('*')
        .eq('id', session.selected_time_slot_id)
        .single();

      if (!slotData || !slotData.is_available) {
        return 'Lo sentimos, este horario ya no está disponible. Por favor, inicia una nueva reserva escribiendo "nueva cita".';
      }

      // Crear la cita
      const { data: appointment, error: appointmentError } = await supabaseServer
        .from('appointments')
        .insert({
          patient_id: patient!.id,
          doctor_id: session.selected_doctor_id,
          time_slot_id: session.selected_time_slot_id,
          appointment_date: slotData.slot_date,
          start_time: slotData.start_time,
          end_time: slotData.end_time,
          status: 'confirmed',
          notification_sent: true,
        })
        .select(`
          *,
          doctor:doctors(name, specialty)
        `)
        .single();

      if (appointmentError) throw appointmentError;

      // Registrar notificación
      await supabaseServer
        .from('notifications')
        .insert({
          appointment_id: appointment.id,
          patient_id: patient!.id,
          notification_type: 'confirmation',
          phone_number: session.phone_number,
          message: 'Cita confirmada',
          status: 'sent',
        });

      // Marcar sesión como completada
      await updateSession(session.id, {
        current_step: 'completed',
        is_active: false,
        patient_id: patient!.id,
        completed_at: new Date().toISOString(),
      });

      return `✅ ¡Cita confirmada exitosamente!\n\n` +
        `Nombre: ${patientName}\n` +
        `Médico: ${appointment.doctor.name}\n` +
        `Fecha: ${format(new Date(appointment.appointment_date), 'dd/MM/yyyy')}\n` +
        `Hora: ${appointment.start_time.substring(0, 5)} - ${appointment.end_time.substring(0, 5)}\n\n` +
        `📌 Tu código de cita: ${appointment.id.substring(0, 8).toUpperCase()}\n\n` +
        'Recibirás un recordatorio antes de tu cita. ¡Gracias!\n\n' +
        '💡 Escribe "nueva cita" si deseas agendar otra.';

    case 'completed':
      await updateSession(session.id, { 
        current_step: 'greeting',
        is_active: true 
      });
      return '¿Deseas agendar otra cita? Empecemos de nuevo... 😊';

    default:
      return 'Lo siento, algo salió mal. Escribe "ayuda" para comenzar de nuevo.';
  }
}

async function updateSession(sessionId: string, updates: any): Promise<void> {
  await supabaseServer
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId);
}

async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to,
    body: message,
  });
}
