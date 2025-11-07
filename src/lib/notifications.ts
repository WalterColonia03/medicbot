// src/lib/notifications.ts
import twilio from 'twilio';
import { supabaseServer } from './supabase/server';
import { format, isBefore, addHours } from 'date-fns';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface NotificationData {
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
}

// 1. NOTIFICACIÓN DE CONFIRMACIÓN (Enviar inmediatamente)
export async function sendConfirmationNotification(data: NotificationData): Promise<boolean> {
  try {
    const message = `✅ *CITA CONFIRMADA* ✅\n\n` +
      `Hola ${data.patientName},\n\n` +
      `Tu cita ha sido agendada exitosamente:\n\n` +
      `👨‍⚕️ *Médico:* ${data.doctorName}\n` +
      `📅 *Fecha:* ${format(new Date(data.appointmentDate), 'dd/MM/yyyy')}\n` +
      `🕐 *Hora:* ${data.startTime.substring(0, 5)} - ${data.endTime.substring(0, 5)}\n\n` +
      `📌 *Código de cita:* ${data.appointmentId.substring(0, 8).toUpperCase()}\n\n` +
      `⏰ Recibirás un recordatorio 24 horas antes.\n\n` +
      `💬 Escribe "cancelar ${data.appointmentId.substring(0, 8)}" para cancelar.`;

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${data.patientPhone}`,
      body: message,
    });

    // Registrar notificación en BD
    await supabaseServer.from('notifications').insert({
      appointment_id: data.appointmentId,
      patient_id: data.patientPhone,
      notification_type: 'confirmation',
      phone_number: data.patientPhone,
      message: message,
      status: 'sent',
    });

    console.log('✅ Notificación de confirmación enviada:', data.patientPhone);
    return true;
  } catch (error) {
    console.error('❌ Error enviando confirmación:', error);
    return false;
  }
}

// 2. RECORDATORIO 24 HORAS ANTES (Ejecutar con cron job)
export async function sendReminderNotification(data: NotificationData): Promise<boolean> {
  try {
    const message = `⏰ *RECORDATORIO DE CITA* ⏰\n\n` +
      `Hola ${data.patientName},\n\n` +
      `Te recordamos tu cita médica:\n\n` +
      `👨‍⚕️ *Médico:* ${data.doctorName}\n` +
      `📅 *Mañana:* ${format(new Date(data.appointmentDate), 'dd/MM/yyyy')}\n` +
      `🕐 *Hora:* ${data.startTime.substring(0, 5)}\n\n` +
      `📍 No olvides llegar 10 minutos antes.\n` +
      `📋 Trae tu documento de identidad.\n\n` +
      `¿Necesitas cancelar? Escribe:\n` +
      `"cancelar ${data.appointmentId.substring(0, 8)}"`;

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${data.patientPhone}`,
      body: message,
    });

    await supabaseServer.from('notifications').insert({
      appointment_id: data.appointmentId,
      patient_id: data.patientPhone,
      notification_type: 'reminder',
      phone_number: data.patientPhone,
      message: message,
      status: 'sent',
    });

    // Marcar como enviado
    await supabaseServer
      .from('appointments')
      .update({ reminder_sent: true })
      .eq('id', data.appointmentId);

    console.log('✅ Recordatorio enviado:', data.patientPhone);
    return true;
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error);
    return false;
  }
}

// 3. FUNCIÓN PARA PROCESAR RECORDATORIOS PENDIENTES
export async function processReminders(): Promise<void> {
  try {
    // Obtener citas para mañana que no tienen recordatorio
    const tomorrow = format(addHours(new Date(), 24), 'yyyy-MM-dd');

    const { data: appointments } = await supabaseServer
      .from('appointments')
      .select(`
        *,
        patient:patients(name, phone),
        doctor:doctors(name)
      `)
      .eq('appointment_date', tomorrow)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false);

    if (!appointments || appointments.length === 0) {
      console.log('No hay recordatorios pendientes');
      return;
    }

    console.log(`📨 Enviando ${appointments.length} recordatorios...`);

    for (const apt of appointments) {
      await sendReminderNotification({
        appointmentId: apt.id,
        patientName: apt.patient.name,
        patientPhone: apt.patient.phone,
        doctorName: apt.doctor.name,
        appointmentDate: apt.appointment_date,
        startTime: apt.start_time,
        endTime: apt.end_time,
      });

      // Pequeña pausa para no saturar Twilio
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Recordatorios procesados');
  } catch (error) {
    console.error('❌ Error procesando recordatorios:', error);
  }
}

// 4. NOTIFICACIÓN DE CANCELACIÓN
export async function sendCancellationNotification(
  data: NotificationData,
  reason: string
): Promise<boolean> {
  try {
    const message = `❌ *CITA CANCELADA* ❌\n\n` +
      `Hola ${data.patientName},\n\n` +
      `Tu cita ha sido cancelada:\n\n` +
      `👨‍⚕️ *Médico:* ${data.doctorName}\n` +
      `📅 *Fecha:* ${format(new Date(data.appointmentDate), 'dd/MM/yyyy')}\n` +
      `🕐 *Hora:* ${data.startTime.substring(0, 5)}\n\n` +
      `📝 *Razón:* ${reason}\n\n` +
      `💬 Escribe "nueva cita" para agendar otra cita.`;

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${data.patientPhone}`,
      body: message,
    });

    await supabaseServer.from('notifications').insert({
      appointment_id: data.appointmentId,
      patient_id: data.patientPhone,
      notification_type: 'cancellation',
      phone_number: data.patientPhone,
      message: message,
      status: 'sent',
    });

    console.log('✅ Notificación de cancelación enviada');
    return true;
  } catch (error) {
    console.error('❌ Error enviando cancelación:', error);
    return false;
  }
}
