// src/pages/api/cron/send-reminders.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { processReminders } from '@/lib/notifications';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar que sea una petición autorizada (opcional para desarrollo)
  // En producción usarías un token secreto
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('⏰ Ejecutando proceso de recordatorios automáticos...');

    await processReminders();

    return res.status(200).json({
      success: true,
      message: 'Recordatorios procesados correctamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error procesando recordatorios:', error);
    return res.status(500).json({
      error: 'Error procesando recordatorios',
      timestamp: new Date().toISOString()
    });
  }
}
