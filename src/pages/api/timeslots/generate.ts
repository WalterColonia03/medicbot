import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import { addDays, format } from 'date-fns';

// Genera slots de tiempo para TODOS los horarios de un médico
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { doctorName, daysAhead = 30 } = req.body;

    if (!doctorName) {
      return res.status(400).json({ error: 'Doctor name is required' });
    }

    // Buscar el doctor por nombre
    const { data: doctor, error: doctorError } = await supabaseServer
      .from('doctors')
      .select('id, name')
      .eq('name', doctorName)
      .eq('is_active', true)
      .single();

    if (doctorError || !doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Buscar todos los schedules ACTIVOS con fechas específicas para este doctor
    const { data: schedules, error: schedulesError } = await supabaseServer
      .from('schedules')
      .select('*')
      .eq('doctor_id', doctor.id)
      .eq('is_active', true)
      .not('specific_date', 'is', null); // Solo schedules con fecha específica

    if (schedulesError) throw schedulesError;

    if (!schedules || schedules.length === 0) {
      return res.status(400).json({
        error: 'No schedules found',
        message: `No se encontraron horarios activos con fechas específicas para ${doctorName}`
      });
    }

    let totalSlotsGenerated = 0;
    const results = [];

    // Generar slots para cada schedule con fecha específica
    for (const schedule of schedules) {
      try {
        // Para schedules con fecha específica, generar slots solo para esa fecha
        const startDate = schedule.specific_date;
        const endDate = schedule.specific_date; // Solo un día

        // Llamar a la función SQL para generar slots
        const { data: slotsCount, error: generateError } = await supabaseServer
          .rpc('generate_time_slots_for_date', {
            p_schedule_id: schedule.id,
            p_target_date: startDate
          });

        if (generateError) {
          console.error(`Error generando slots para schedule ${schedule.id}:`, generateError);
          continue; // Continuar con el siguiente schedule
        }

        totalSlotsGenerated += slotsCount || 0;
        results.push({
          scheduleId: schedule.id,
          specificDate: schedule.specific_date,
          slotsGenerated: slotsCount || 0
        });

      } catch (scheduleError) {
        console.error(`Error procesando schedule ${schedule.id}:`, scheduleError);
        continue;
      }
    }

    // Obtener los slots generados para mostrar al usuario
    const { data: slots, error: slotsError } = await supabaseServer
      .from('time_slots')
      .select(`
        *,
        doctor:doctors(id, name, specialty),
        schedule:schedules(specific_date, start_time, end_time)
      `)
      .eq('doctor_id', doctor.id)
      .in('schedule_id', schedules.map(s => s.id))
      .eq('is_available', true)
      .order('slot_date')
      .order('start_time');

    if (slotsError) {
      console.error('Error obteniendo slots generados:', slotsError);
    }

    return res.status(200).json({
      message: `Generated ${totalSlotsGenerated} time slots for ${doctorName}`,
      slotsCreated: totalSlotsGenerated,
      schedulesProcessed: results.length,
      doctor: doctorName,
      slots: slots || [],
      details: results
    });
  } catch (error) {
    console.error('Error generating time slots:', error);
    return res.status(500).json({ error: 'Error generating time slots' });
  }
}
