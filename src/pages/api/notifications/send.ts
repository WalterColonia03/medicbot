// src/pages/api/notifications/send.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseSecret = process.env.SUPABASE_SECRET;

const supabase = createClient(supabaseUrl, supabaseKey, supabaseSecret);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .select()
      .eq('id', appointmentId)
      .single();
      .collection('appointments')
      .doc(appointmentId)
      .get();

    if (!appointmentDoc.exists) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = {
      id: appointmentDoc.id,
      ...appointmentDoc.data(),
    } as Appointment;

    // Enviar notificación por WhatsApp
    const message = `🔔 Recordatorio de cita\n\n` +
      `Nombre: ${appointment.patientName}\n` +
      `Médico: ${appointment.doctorName}\n` +
      `Fecha: ${appointment.date}\n` +
      `Hora: ${appointment.timeSlot}\n\n` +
      `No olvides asistir a tu cita. ¡Te esperamos!`;

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${appointment.patientPhone}`,
      body: message,
    });

    // Marcar notificación como enviada
    await adminDb.collection('appointments').doc(appointmentId).update({
      notificationSent: true,
    });

    return res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ error: 'Error sending notification' });
  }
}
