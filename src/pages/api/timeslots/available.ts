import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { doctorId, startDate, endDate } = req.query;

    if (!doctorId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Consultar slots disponibles con información del doctor
    const { data: timeSlots, error } = await supabaseServer
      .from('time_slots')
      .select(`
        *,
        doctor:doctors(id, name, specialty)
      `)
      .eq('doctor_id', doctorId)
      .gte('slot_date', startDate)
      .lte('slot_date', endDate)
      .eq('is_available', true)
      .order('slot_date')
      .order('start_time');

    if (error) throw error;

    return res.status(200).json(timeSlots);
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return res.status(500).json({ error: 'Error fetching available time slots' });
  }
}
