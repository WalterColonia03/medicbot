import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import { validateAppointment, validateAppointmentCancellation, formatValidationErrors } from '@/lib/validations';
import { format as formatDate, isBefore, startOfDay } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { status, date, doctorId } = req.query;

      // Usar la vista con información completa
      let query = supabaseServer
        .from('v_appointments_full')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      if (date) {
        query = query.eq('appointment_date', date);
      }

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      const { data: appointments, error } = await query;

      if (error) throw error;

      return res.status(200).json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({ 
        error: 'Error al obtener citas',
        message: 'No se pudieron cargar las citas. Intente nuevamente.'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { patientName, patientPhone, doctorId, timeSlotId, reason } = req.body;

      // VALIDACIÓN 1: Validar datos de entrada
      const validation = validateAppointment({
        patientName,
        patientPhone,
        doctorId,
        timeSlotId,
        appointmentDate: new Date().toISOString().split('T')[0]
      });

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Datos inválidos',
          message: formatValidationErrors(validation.errors),
          errors: validation.errors
        });
      }

      // VALIDACIÓN 2: Verificar que el doctor existe y está activo
      const { data: doctor, error: doctorError } = await supabaseServer
        .from('doctors')
        .select('id, name, is_active')
        .eq('id', doctorId)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({
          error: 'Médico no encontrado',
          message: 'El médico seleccionado no existe en el sistema'
        });
      }

      if (!doctor.is_active) {
        return res.status(400).json({
          error: 'Médico inactivo',
          message: 'No se pueden agendar citas con médicos inactivos'
        });
      }

      // VALIDACIÓN 3: Verificar que el slot esté disponible
      const { data: timeSlot, error: slotError } = await supabaseServer
        .from('time_slots')
        .select('*')
        .eq('id', timeSlotId)
        .eq('is_available', true)
        .single();

      if (slotError || !timeSlot) {
        return res.status(400).json({
          error: 'Horario no disponible',
          message: 'El horario seleccionado ya no está disponible. Por favor, seleccione otro.'
        });
      }

      // VALIDACIÓN 4: Verificar que el slot sea del doctor correcto
      if (timeSlot.doctor_id !== doctorId) {
        return res.status(400).json({
          error: 'Datos inconsistentes',
          message: 'El horario seleccionado no pertenece al médico elegido'
        });
      }

      // VALIDACIÓN 5: Verificar que la fecha no sea en el pasado
      const slotDate = new Date(timeSlot.slot_date);
      const today = startOfDay(new Date());

      if (isBefore(slotDate, today)) {
        return res.status(400).json({
          error: 'Fecha inválida',
          message: 'No se pueden agendar citas en fechas pasadas'
        });
      }

      // VALIDACIÓN 6: Verificar que el paciente no tenga otra cita a la misma hora
      const { data: conflictingAppointments } = await supabaseServer
        .from('appointments')
        .select('id')
        .eq('patient_id', patientPhone)
        .eq('appointment_date', timeSlot.slot_date)
        .eq('status', 'confirmed');

      if (conflictingAppointments && conflictingAppointments.length > 0) {
        return res.status(409).json({
          error: 'Cita duplicada',
          message: 'Ya tiene una cita programada para esta fecha. Cancele la anterior si desea reprogramar.'
        });
      }

      // TODO: Buscar o crear paciente
      let { data: patient, error: patientError } = await supabaseServer
        .from('patients')
        .select('*')
        .eq('phone', patientPhone)
        .single();

      if (patientError || !patient) {
        // Crear nuevo paciente
        const { data: newPatient, error: createError } = await supabaseServer
          .from('patients')
          .insert({ name: patientName, phone: patientPhone })
          .select()
          .single();

        if (createError) {
          // Verificar si es error de duplicado
          if (createError.code === '23505') {
            return res.status(400).json({
              error: 'Número duplicado',
              message: 'Este número de teléfono ya está registrado con otro nombre'
            });
          }
          throw createError;
        }
        patient = newPatient;
      }

      // TODO: Crear la cita
      const { data: appointment, error: appointmentError } = await supabaseServer
        .from('appointments')
        .insert({
          patient_id: patient.id,
          doctor_id: doctorId,
          time_slot_id: timeSlotId,
          appointment_date: timeSlot.slot_date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time,
          status: 'confirmed',
          reason: reason || null,
          notification_sent: false,
          reminder_sent: false,
        })
        .select(`
          *,
          patient:patients(*),
          doctor:doctors(*),
          time_slot:time_slots(*)
        `)
        .single();

      if (appointmentError) throw appointmentError;

      // El trigger automáticamente marca el slot como no disponible

      return res.status(201).json({
        ...appointment,
        message: `Cita agendada exitosamente para ${formatDate(new Date(appointment.appointment_date), 'dd/MM/yyyy')} a las ${appointment.start_time}`
      });
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Cita duplicada',
          message: 'Ya existe una cita con estos datos'
        });
      }

      return res.status(500).json({ 
        error: 'Error al crear cita',
        message: 'No se pudo agendar la cita. Verifique los datos e intente nuevamente.'
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const { status, cancellation_reason } = req.body;

      if (!id) {
        return res.status(400).json({
          error: 'ID requerido',
          message: 'Debe especificar el ID de la cita a modificar'
        });
      }

      // Obtener cita existente
      const { data: existingAppointment, error: fetchError } = await supabaseServer
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingAppointment) {
        return res.status(404).json({
          error: 'Cita no encontrada',
          message: 'La cita que intenta modificar no existe'
        });
      }

      // Si es cancelación, validar
      if (status === 'cancelled') {
        const cancelValidation = validateAppointmentCancellation(
          existingAppointment,
          cancellation_reason
        );

        if (!cancelValidation.isValid) {
          return res.status(400).json({
            error: 'No se puede cancelar',
            message: formatValidationErrors(cancelValidation.errors),
            errors: cancelValidation.errors
          });
        }

        // Actualizar cita como cancelada
        const { data: cancelledAppointment, error: updateError } = await supabaseServer
          .from('appointments')
          .update({
            status: 'cancelled',
            cancellation_reason,
            cancelled_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        // El trigger automáticamente libera el slot

        return res.status(200).json({
          ...cancelledAppointment,
          message: 'Cita cancelada exitosamente. El horario está nuevamente disponible.'
        });
      }

      // Actualización general
      const { data: updatedAppointment, error: updateError } = await supabaseServer
        .from('appointments')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        ...updatedAppointment,
        message: 'Cita actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      return res.status(500).json({
        error: 'Error al actualizar',
        message: 'No se pudo actualizar la cita. Intente nuevamente.'
      });
    }
  }

  return res.status(405).json({ 
    error: 'Método no permitido',
    message: `El método ${req.method} no está soportado en este endpoint`
  });
}
