// src/pages/api/schedules/index.ts - VERSIÓN CORREGIDA
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

// Función auxiliar para obtener fecha actual en Perú (UTC-5)
function getPeruDate(): string {
  const now = new Date();
  const peruOffset = -5 * 60; // UTC-5 en minutos
  const peruTime = new Date(now.getTime() + (peruOffset + now.getTimezoneOffset()) * 60000);
  return peruTime.toISOString().split('T')[0];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method === 'GET') {
    try {
      const { data: schedules, error } = await supabaseServer
        .from('schedules')
        .select(`
          *,
          doctor:doctors(id, name, specialty)
        `)
        .eq('is_active', true)
        .not('specific_date', 'is', null)
        .order('specific_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return res.status(200).json(schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      return res.status(500).json({ 
        error: 'Error al obtener horarios',
        message: 'No se pudieron cargar los horarios.'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { doctor_id, specific_date, start_time, end_time, slot_duration } = req.body;

      console.log('📝 Creando schedule:', { doctor_id, specific_date, start_time, end_time, slot_duration });

      // VALIDACIÓN 1: Datos requeridos
      if (!doctor_id || !specific_date || !start_time || !end_time || !slot_duration) {
        return res.status(400).json({
          error: 'Datos incompletos',
          message: 'Todos los campos son obligatorios'
        });
      }

      // VALIDACIÓN 2: Verificar que el doctor existe
      const { data: doctor, error: doctorError } = await supabaseServer
        .from('doctors')
        .select('id, name, is_active')
        .eq('id', doctor_id)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({
          error: 'Médico no encontrado',
          message: 'El médico seleccionado no existe'
        });
      }

      if (!doctor.is_active) {
        return res.status(400).json({
          error: 'Médico inactivo',
          message: 'No se pueden crear horarios para médicos inactivos'
        });
      }

      // VALIDACIÓN 3: Validar fecha (CORREGIDA)
      const selectedDate = new Date(specific_date + 'T00:00:00');
      const today = new Date(getPeruDate() + 'T00:00:00');
      
      console.log('📅 Comparación de fechas:');
      console.log('   Fecha seleccionada:', selectedDate.toISOString());
      console.log('   Fecha hoy (Perú):', today.toISOString());
      
      if (selectedDate < today) {
        return res.status(400).json({
          error: 'Fecha inválida',
          message: 'No se pueden crear horarios para fechas pasadas'
        });
      }

      // VALIDACIÓN 4: Validar horarios
      const startHour = parseInt(start_time.split(':')[0]);
      const endHour = parseInt(end_time.split(':')[0]);

      if (startHour >= endHour) {
        return res.status(400).json({
          error: 'Horario inválido',
          message: 'La hora de fin debe ser posterior a la hora de inicio'
        });
      }

      // VALIDACIÓN 5: Verificar conflictos
      const { data: existingSchedules } = await supabaseServer
        .from('schedules')
        .select('id, start_time, end_time')
        .eq('doctor_id', doctor_id)
        .eq('specific_date', specific_date)
        .eq('is_active', true);

      if (existingSchedules && existingSchedules.length > 0) {
        return res.status(409).json({
          error: 'Conflicto de horarios',
          message: `Ya existe un horario para este médico en esta fecha` 
        });
      }

      // CREAR SCHEDULE
      const { data: schedule, error: insertError } = await supabaseServer
        .from('schedules')
        .insert({
          doctor_id,
          specific_date,
          day_of_week: selectedDate.getDay(),
          start_time,
          end_time,
          slot_duration: parseInt(slot_duration),
          is_active: true
        })
        .select(`
          *,
          doctor:doctors(id, name, specialty)
        `)
        .single();

      if (insertError) throw insertError;

      console.log('✅ Schedule creado:', schedule.id);

      // GENERAR TIME SLOTS AUTOMÁTICAMENTE
      try {
        await generateTimeSlotsForSchedule(schedule.id, specific_date, start_time, end_time, parseInt(slot_duration), doctor_id);
        console.log('✅ Time slots generados automáticamente');
      } catch (slotError) {
        console.error('⚠️ Error generando slots (no crítico):', slotError);
      }

      return res.status(201).json({
        ...schedule,
        message: 'Horario creado exitosamente'
      });

    } catch (error: any) {
      console.error('❌ Error creando schedule:', error);
      return res.status(500).json({ 
        error: 'Error al crear horario',
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          error: 'ID requerido',
          message: 'Debe especificar el ID del horario'
        });
      }

      // Desactivar en lugar de eliminar
      const { error: deleteError } = await supabaseServer
        .from('schedules')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.status(200).json({
        message: 'Horario desactivado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return res.status(500).json({
        error: 'Error al eliminar',
        message: 'No se pudo eliminar el horario'
      });
    }
  }

  return res.status(405).json({
    error: 'Método no permitido',
    message: `El método ${req.method} no está soportado` 
  });
}

// Función para generar time slots
async function generateTimeSlotsForSchedule(
  scheduleId: string,
  date: string,
  startTime: string,
  endTime: string,
  slotDuration: number,
  doctorId: string
): Promise<void> {
  const slots: any[] = [];
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  while (currentMinutes + slotDuration <= endMinutes) {
    const slotStartHour = Math.floor(currentMinutes / 60);
    const slotStartMin = currentMinutes % 60;
    const slotEndMinutes = currentMinutes + slotDuration;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMin = slotEndMinutes % 60;
    
    slots.push({
      doctor_id: doctorId,
      schedule_id: scheduleId,
      slot_date: date,
      start_time: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}:00`,
      end_time: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}:00`,
      is_available: true
    });
    
    currentMinutes += slotDuration;
  }
  
  if (slots.length > 0) {
    const { error } = await supabaseServer
      .from('time_slots')
      .insert(slots);
    
    if (error) {
      console.error('Error insertando slots:', error);
      throw error;
    }
    
    console.log(`✅ Generados ${slots.length} time slots`);
  }
}
