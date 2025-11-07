import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import { addDays, format } from 'date-fns';

// Genera slots de tiempo usando la función SQL de Supabase
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scheduleId, daysAhead = 30 } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ error: 'Schedule ID is required' });
    }

    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), daysAhead), 'yyyy-MM-dd');

    // Llamar a la función SQL para generar slots
    const { data, error } = await supabaseServer
      .rpc('generate_time_slots', {
        p_schedule_id: scheduleId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) throw error;

    // Obtener los slots generados
    const { data: slots, error: slotsError } = await supabaseServer
      .from('time_slots')
      .select(`
        *,
        doctor:doctors(id, name, specialty)
      `)
      .eq('schedule_id', scheduleId)
      .gte('slot_date', startDate)
      .lte('slot_date', endDate)
      .order('slot_date')
      .order('start_time');

    if (slotsError) throw slotsError;

    return res.status(200).json({
      message: `Generated ${data || 0} time slots`,
      slotsCreated: data,
      slots: slots || [],
    });
  } catch (error) {
    console.error('Error generating time slots:', error);
    return res.status(500).json({ error: 'Error generating time slots' });
  }
}
