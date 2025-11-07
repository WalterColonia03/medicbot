/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import { validateSchedule, formatValidationErrors } from '@/lib/validations';
import { parse, format as formatDate } from 'date-fns';
import { getPeruDateTime } from '../webhook/twilio-supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== SCHEDULES API ===');
  console.log('Method:', req.method);

  if (req.method === 'GET') {
    try {
      // Obtener todos los schedules con fechas específicas
      const { data: schedules, error } = await (supabaseServer
        .from('schedules')
        .select(`
          *,
          doctor:doctors(id, name, specialty)
        `)
        .eq('is_active', true)
        .not('specific_date', 'is', null)
        .order('specific_date', { ascending: true })
        .order('start_time', { ascending: true }) as any);

      if (error) {
        console.error('Error fetching schedules:', error);
        return res.status(500).json({
          error: 'Error al obtener horarios',
          message: 'No se pudieron cargar los horarios.'
        });
      }

      return res.status(200).json(schedules || []);
    } catch (error) {
      console.error('Error in GET /api/schedules:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener horarios'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { doctor_id, specific_date, start_time, end_time, slot_duration } = req.body;
      console.log('📝 POST /api/schedules - Crear horario');
      console.log('Datos recibidos:', { doctor_id, specific_date, start_time, end_time, slot_duration });

      // VALIDACIÓN 1: Validar datos de entrada
      console.log('🔍 Validación 1: Validando datos de entrada...');
      const validation = validateSchedule({
        doctorId: doctor_id,
        specificDate: specific_date,
        startTime: start_time,
        endTime: end_time,
        slotDuration: slot_duration
      });

      if (!validation.isValid) {
        console.log('❌ Validación falló:', validation.errors);
        return res.status(400).json({
          error: 'Datos inválidos',
          message: formatValidationErrors(validation.errors),
          errors: validation.errors
        });
      }
      console.log('✅ Validación 1 OK');

      // VALIDACIÓN 2: Verificar que el médico existe y está activo
      console.log('🔍 Validación 2: Verificando médico...');
      const { data: doctor, error: doctorError } = await (supabaseServer
        .from('doctors')
        .select('id, name, is_active')
        .eq('id', doctor_id)
        .single() as any);

      if (doctorError || !doctor) {
        console.log('❌ Médico no encontrado:', doctorError?.message);
        return res.status(404).json({
          error: 'Médico no encontrado',
          message: 'El médico especificado no existe'
        });
      }

      if (!doctor.is_active) {
        console.log('❌ Médico inactivo');
        return res.status(400).json({
          error: 'Médico inactivo',
          message: 'No se pueden crear horarios para médicos inactivos'
        });
      }
      console.log('✅ Validación 2 OK - Doctor:', doctor.name);

      // VALIDACIÓN 3: Si es hoy, verificar que la hora de inicio sea futura
      console.log('🔍 Validación 3: Verificando hora para hoy...');
      const selectedDate = new Date(specific_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateOnly = new Date(selectedDate);
      selectedDateOnly.setHours(0, 0, 0, 0);

      if (selectedDateOnly.getTime() === today.getTime()) {
        // Es hoy, verificar que la hora de inicio sea futura
        const now = getPeruDateTime();
        const scheduleStart = parse(start_time, 'HH:mm', new Date());
        scheduleStart.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

        if (formatDate(scheduleStart, 'HH:mm') <= formatDate(now, 'HH:mm')) {
          return res.status(400).json({
            error: 'Hora inválida',
            message: 'Para horarios de hoy, la hora de inicio debe ser posterior a la hora actual'
          });
        }
      }

      // VALIDACIÓN 4: Verificar que la duración del slot cabe en el rango horario
      const startDate = parse(start_time, 'HH:mm', new Date());
      const endDate = parse(end_time, 'HH:mm', new Date());
      const totalMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

      // Calcular cuántos slots se generarán
      const numberOfSlots = Math.floor(totalMinutes / slot_duration);
      console.log('✅ Validaciones OK');
      console.log('📊 Se generarán aproximadamente', numberOfSlots, 'slots');

      if (totalMinutes < slot_duration) {
        return res.status(400).json({
          error: 'Duración inválida',
          message: `La duración de cada cita (${slot_duration} min) debe ser menor al tiempo total disponible (${totalMinutes} min)`
        });
      }

      // Crear el horario
      console.log('💾 Insertando horario en base de datos...');
      const { data: schedule, error: insertError } = await (supabaseServer
        .from('schedules')
        .insert({
          doctor_id,
          specific_date,
          start_time,
          end_time,
          slot_duration,
          is_active: true
        })
        .select(`
          *,
          doctor:doctors(id, name, specialty)
        `)
        .single() as any);

      if (insertError) {
        console.log('❌ Error al insertar:', insertError.message);
        throw insertError;
      }

      console.log('✅ Horario creado exitosamente:', schedule.id);
      return res.status(201).json({
        ...schedule,
        message: `Horario creado exitosamente. Se generarán aproximadamente ${numberOfSlots} espacios de ${slot_duration} minutos cada uno.`,
        slotsToGenerate: numberOfSlots
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      return res.status(500).json({
        error: 'Error al crear horario',
        message: 'No se pudo crear el horario. Intente nuevamente.'
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          error: 'ID requerido',
          message: 'Debe especificar el ID del horario a modificar'
        });
      }

      // Actualizar horario (simplificado)
      const { data: updatedSchedule, error: updateError } = await (supabaseServer
        .from('schedules')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          doctor:doctors(id, name, specialty)
        `)
        .single() as any);

      if (updateError) throw updateError;

      return res.status(200).json({
        ...updatedSchedule,
        message: 'Horario actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      return res.status(500).json({
        error: 'Error al actualizar',
        message: 'No se pudo actualizar el horario.'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          error: 'ID requerido',
          message: 'Debe especificar el ID del horario a eliminar'
        });
      }

      // Marcar como inactivo en lugar de eliminar
      const { error: deleteError } = await supabaseServer
        .from('schedules')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.status(200).json({
        message: 'Horario desactivado exitosamente',
        note: 'El horario fue marcado como inactivo'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return res.status(500).json({
        error: 'Error al eliminar',
        message: 'No se pudo eliminar el horario.'
      });
    }
  }

  return res.status(405).json({
    error: 'Método no permitido',
    message: `El método ${req.method} no está soportado`
  });
}
