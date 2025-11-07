import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import { validateSchedule, validateScheduleModification, formatValidationErrors } from '@/lib/validations';
import { parse, format as formatDate } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== SCHEDULES API ===');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method === 'GET') {
    try {
      const { doctorId } = req.query;

      let query = supabaseServer
        .from('schedules')
        .select(`
          *,
          doctor:doctors(id, name, specialty)
        `)
        .eq('is_active', true)
        .order('day_of_week');

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      const { data: schedules, error } = await query;

      if (error) throw error;

      return res.status(200).json(schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      return res.status(500).json({ 
        error: 'Error al obtener horarios',
        message: 'No se pudieron cargar los horarios. Intente nuevamente.'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { doctor_id, day_of_week, start_time, end_time, slot_duration } = req.body;
      console.log('📝 POST /api/schedules - Crear horario');
      console.log('Datos recibidos:', { doctor_id, day_of_week, start_time, end_time, slot_duration });

      // VALIDACIÓN 1: Validar datos de entrada
      console.log('🔍 Validación 1: Validando datos de entrada...');
      const validation = validateSchedule({
        doctorId: doctor_id,
        dayOfWeek: day_of_week,
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

      // VALIDACIÓN 2: Verificar que el doctor existe y está activo
      console.log('🔍 Validación 2: Verificando médico...');
      const { data: doctor, error: doctorError } = await supabaseServer
        .from('doctors')
        .select('id, name, is_active')
        .eq('id', doctor_id)
        .single();

      if (doctorError || !doctor) {
        console.log('❌ Médico no encontrado:', doctorError?.message);
        return res.status(404).json({
          error: 'Médico no encontrado',
          message: 'El médico seleccionado no existe en el sistema'
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

      // VALIDACIÓN 3: Verificar conflictos con horarios existentes del mismo doctor
      console.log('🔍 Validación 3: Verificando conflictos de horarios...');
      const { data: existingSchedules, error: conflictError } = await supabaseServer
        .from('schedules')
        .select('*')
        .eq('doctor_id', doctor_id)
        .eq('day_of_week', day_of_week)
        .eq('is_active', true);

      if (conflictError) {
        console.log('❌ Error al consultar horarios:', conflictError.message);
        throw conflictError;
      }

      console.log('📋 Horarios existentes:', existingSchedules?.length || 0);

      if (existingSchedules && existingSchedules.length > 0) {
        // Verificar solapamiento de horarios
        const newStart = parse(start_time, 'HH:mm', new Date());
        const newEnd = parse(end_time, 'HH:mm', new Date());

        for (const existing of existingSchedules) {
          const existStart = parse(existing.start_time, 'HH:mm', new Date());
          const existEnd = parse(existing.end_time, 'HH:mm', new Date());

          // Verificar si hay solapamiento
          const hasOverlap = 
            (newStart >= existStart && newStart < existEnd) ||
            (newEnd > existStart && newEnd <= existEnd) ||
            (newStart <= existStart && newEnd >= existEnd);

          if (hasOverlap) {
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            return res.status(409).json({
              error: 'Conflicto de horarios',
              message: `Ya existe un horario para ${doctor.name} el día ${dayNames[day_of_week]} de ${existing.start_time} a ${existing.end_time}. Los horarios no pueden solaparse.`,
              conflictingSchedule: existing
            });
          }
        }
      }

      // VALIDACIÓN 4: Verificar que la duración del slot cabe en el rango horario
      const startDate = parse(start_time, 'HH:mm', new Date());
      const endDate = parse(end_time, 'HH:mm', new Date());
      const totalMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

      if (totalMinutes < slot_duration) {
        return res.status(400).json({
          error: 'Duración inválida',
          message: `La duración de cada cita (${slot_duration} min) debe ser menor al tiempo total disponible (${totalMinutes} min)`
        });
      }

      // Calcular cuántos slots se generarán
      const numberOfSlots = Math.floor(totalMinutes / slot_duration);
      console.log('✅ Validación 3 OK - Sin conflictos');
      console.log('📊 Se generarán aproximadamente', numberOfSlots, 'slots');

      // Crear el horario
      console.log('💾 Insertando horario en base de datos...');
      const { data: schedule, error: insertError } = await supabaseServer
        .from('schedules')
        .insert({
          doctor_id,
          day_of_week,
          start_time,
          end_time,
          slot_duration,
          is_active: true
        })
        .select(`
          *,
          doctor:doctors(id, name, specialty)
        `)
        .single();

      if (insertError) {
        console.log('❌ Error al insertar:', insertError.message);
        throw insertError;
      }

      console.log('✅ Horario creado exitosamente:', schedule.id);
      return res.status(201).json({
        ...schedule,
        message: `Horario creado exitosamente. Se generarán aproximadamente ${numberOfSlots} espacios de ${slot_duration} minutos cada uno.`,
        estimatedSlots: numberOfSlots
      });
    } catch (error: any) {
      console.error('❌ ERROR CRÍTICO en POST /api/schedules:', error.message);
      console.error('Stack:', error.stack);
      
      // Manejar errores específicos de Supabase
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Horario duplicado',
          message: 'Ya existe un horario idéntico en el sistema'
        });
      }

      return res.status(500).json({ 
        error: 'Error al crear horario',
        message: 'No se pudo crear el horario. Verifique los datos e intente nuevamente.'
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

      // VALIDACIÓN 1: Obtener horario existente
      const { data: existingSchedule, error: fetchError } = await supabaseServer
        .from('schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingSchedule) {
        return res.status(404).json({
          error: 'Horario no encontrado',
          message: 'El horario que intenta modificar no existe'
        });
      }

      // VALIDACIÓN 2: Verificar si hay citas programadas con este horario
      const { data: appointments, error: apptError } = await supabaseServer
        .from('appointments')
        .select('id')
        .eq('status', 'confirmed')
        .gte('appointment_date', formatDate(new Date(), 'yyyy-MM-dd'));

      if (apptError) throw apptError;

      const appointmentCount = appointments?.length || 0;

      // VALIDACIÓN 3: Validar modificación según citas existentes
      const modValidation = validateScheduleModification(
        existingSchedule,
        updateData,
        appointmentCount
      );

      if (!modValidation.isValid) {
        return res.status(400).json({
          error: 'No se puede modificar',
          message: formatValidationErrors(modValidation.errors),
          errors: modValidation.errors,
          affectedAppointments: appointmentCount
        });
      }

      // VALIDACIÓN 4: Validar nuevos datos
      const validation = validateSchedule({
        doctorId: updateData.doctor_id || existingSchedule.doctor_id,
        dayOfWeek: updateData.day_of_week !== undefined ? updateData.day_of_week : existingSchedule.day_of_week,
        startTime: updateData.start_time || existingSchedule.start_time,
        endTime: updateData.end_time || existingSchedule.end_time,
        slotDuration: updateData.slot_duration || existingSchedule.slot_duration
      });

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Datos inválidos',
          message: formatValidationErrors(validation.errors),
          errors: validation.errors
        });
      }

      // Actualizar horario
      const { data: updatedSchedule, error: updateError } = await supabaseServer
        .from('schedules')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          doctor:doctors(id, name, specialty)
        `)
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        ...updatedSchedule,
        message: 'Horario actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      return res.status(500).json({
        error: 'Error al actualizar',
        message: 'No se pudo actualizar el horario. Intente nuevamente.'
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

      // VALIDACIÓN: Verificar citas futuras
      const { data: futureAppointments, error: apptError } = await supabaseServer
        .from('time_slots')
        .select('id, appointments!inner(id, status)')
        .eq('schedule_id', id)
        .gte('slot_date', formatDate(new Date(), 'yyyy-MM-dd'));

      if (apptError) throw apptError;

      const activeAppointments = futureAppointments?.filter(
        (slot: any) => slot.appointments && slot.appointments.length > 0
      );

      if (activeAppointments && activeAppointments.length > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'Este horario tiene citas futuras programadas. Debe cancelarlas primero o marcar el horario como inactivo.',
          affectedSlots: activeAppointments.length
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
        note: 'El horario fue marcado como inactivo y no se generarán más espacios de tiempo'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return res.status(500).json({
        error: 'Error al eliminar',
        message: 'No se pudo eliminar el horario. Intente nuevamente.'
      });
    }
  }

  return res.status(405).json({ 
    error: 'Método no permitido',
    message: `El método ${req.method} no está soportado en este endpoint`
  });
}
