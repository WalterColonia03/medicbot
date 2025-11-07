// src/pages/api/notifications/send.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import { sendConfirmationNotification, sendReminderNotification } from '@/lib/notifications';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { appointmentId, type } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required' });
    }

    // Obtener datos de la cita
    const { data: appointment, error } = await supabaseServer
      .from('appointments')
      .select(`
        *,
        patient:patients(name, phone),
        doctor:doctors(name, specialty)
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Determinar tipo de notificación
    const notificationType = type || 'confirmation';

    let success = false;
    if (notificationType === 'confirmation') {
      success = await sendConfirmationNotification({
        appointmentId: appointment.id,
        patientName: appointment.patient.name,
        patientPhone: appointment.patient.phone,
        doctorName: appointment.doctor.name,
        appointmentDate: appointment.appointment_date,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
      });
    } else if (notificationType === 'reminder') {
      success = await sendReminderNotification({
        appointmentId: appointment.id,
        patientName: appointment.patient.name,
        patientPhone: appointment.patient.phone,
        doctorName: appointment.doctor.name,
        appointmentDate: appointment.appointment_date,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
      });
    }

    if (success) {
      // Actualizar estado en la base de datos
      await supabaseServer
        .from('appointments')
        .update({
          notification_sent: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      return res.status(200).json({
        success: true,
        message: 'Notificación enviada correctamente'
      });
    } else {
      return res.status(500).json({
        error: 'Error al enviar la notificación'
      });
    }

  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}
