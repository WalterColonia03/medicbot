// src/pages/api/cron/send-rating-requests.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('⭐ Ejecutando proceso de solicitudes de calificación...');

    // Buscar citas que terminaron hace 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: appointments } = await supabaseServer
      .from('appointments')
      .select(`
        *,
        patient:patients(name, phone),
        doctor:doctors(name)
      `)
      .eq('appointment_date', yesterdayStr)
      .eq('status', 'confirmed')
      .eq('rating_requested', false)
      .eq('rated', false);

    if (!appointments || appointments.length === 0) {
      console.log('No hay solicitudes de calificación pendientes');
      return res.status(200).json({
        success: true,
        message: 'No hay solicitudes de calificación pendientes',
        processed: 0
      });
    }

    console.log(`📨 Enviando ${appointments.length} solicitudes de calificación...`);

    // Importar la función después de las verificaciones
    const { processRatingRequests } = await import('../../../lib/notifications');

    await processRatingRequests();

    return res.status(200).json({
      success: true,
      message: `Solicitudes de calificación procesadas correctamente`,
      processed: appointments.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error procesando solicitudes de calificación:', error);
    return res.status(500).json({
      error: 'Error procesando solicitudes de calificación',
      timestamp: new Date().toISOString()
    });
  }
}
