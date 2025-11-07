import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import { validateDoctor, formatValidationErrors } from '@/lib/validations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { includeInactive } = req.query;
      
      let query = supabaseServer
        .from('doctors')
        .select('*')
        .order('name');

      // Por defecto solo mostrar activos
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data: doctors, error } = await query;

      if (error) throw error;

      return res.status(200).json(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return res.status(500).json({ 
        error: 'Error al obtener médicos',
        message: 'No se pudieron cargar los médicos. Intente nuevamente.'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, specialty, phone, email } = req.body;

      // VALIDACIÓN: Validar datos de entrada
      const validation = validateDoctor({ name, specialty, phone, email });

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Datos inválidos',
          message: formatValidationErrors(validation.errors),
          errors: validation.errors
        });
      }

      // VALIDACIÓN: Verificar que no exista email duplicado
      if (email) {
        const { data: existingDoctor } = await supabaseServer
          .from('doctors')
          .select('id')
          .eq('email', email)
          .single();

        if (existingDoctor) {
          return res.status(409).json({
            error: 'Email duplicado',
            message: 'Ya existe un médico registrado con este email'
          });
        }
      }

      // Crear doctor
      const { data: doctor, error } = await supabaseServer
        .from('doctors')
        .insert({
          name,
          specialty,
          phone: phone || null,
          email: email || null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        // Error de duplicado
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'Médico duplicado',
            message: 'Ya existe un médico con estos datos'
          });
        }
        throw error;
      }

      return res.status(201).json({
        ...doctor,
        message: `Médico ${name} registrado exitosamente`
      });
    } catch (error: any) {
      console.error('Error creating doctor:', error);
      return res.status(500).json({ 
        error: 'Error al crear médico',
        message: 'No se pudo registrar el médico. Verifique los datos e intente nuevamente.'
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
          message: 'Debe especificar el ID del médico a modificar'
        });
      }

      // Validar si existe
      const { data: existingDoctor, error: fetchError } = await supabaseServer
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingDoctor) {
        return res.status(404).json({
          error: 'Médico no encontrado',
          message: 'El médico que intenta modificar no existe'
        });
      }

      // Validar datos
      const validation = validateDoctor({
        name: updateData.name || existingDoctor.name,
        specialty: updateData.specialty || existingDoctor.specialty,
        phone: updateData.phone,
        email: updateData.email
      });

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Datos inválidos',
          message: formatValidationErrors(validation.errors),
          errors: validation.errors
        });
      }

      // Actualizar
      const { data: updatedDoctor, error: updateError } = await supabaseServer
        .from('doctors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        ...updatedDoctor,
        message: 'Médico actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error updating doctor:', error);
      return res.status(500).json({
        error: 'Error al actualizar',
        message: 'No se pudo actualizar el médico. Intente nuevamente.'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          error: 'ID requerido',
          message: 'Debe especificar el ID del médico a eliminar'
        });
      }

      // VALIDACIÓN: Verificar si tiene horarios o citas activas
      const { data: schedules } = await supabaseServer
        .from('schedules')
        .select('id')
        .eq('doctor_id', id)
        .eq('is_active', true);

      if (schedules && schedules.length > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'Este médico tiene horarios activos. Desactívelos primero.',
          affectedSchedules: schedules.length
        });
      }

      // Marcar como inactivo en lugar de eliminar
      const { error: deleteError } = await supabaseServer
        .from('doctors')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.status(200).json({
        message: 'Médico desactivado exitosamente',
        note: 'El médico fue marcado como inactivo'
      });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      return res.status(500).json({
        error: 'Error al eliminar',
        message: 'No se pudo eliminar el médico. Intente nuevamente.'
      });
    }
  }

  return res.status(405).json({ 
    error: 'Método no permitido',
    message: `El método ${req.method} no está soportado en este endpoint`
  });
}
