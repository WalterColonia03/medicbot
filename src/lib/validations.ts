// Sistema de validaciones de negocio
import { addMinutes, parse, isAfter, isBefore, format, isValid } from 'date-fns';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================
// VALIDACIONES DE HORARIOS
// ============================================

export function validateSchedule(data: {
  doctorId?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  slotDuration?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validar que exista doctorId
  if (!data.doctorId || data.doctorId.trim() === '') {
    errors.push('Debe seleccionar un médico');
  }

  // Validar día de la semana
  if (data.dayOfWeek === undefined || data.dayOfWeek === null) {
    errors.push('Debe seleccionar un día de la semana');
  } else if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    errors.push('El día de la semana debe estar entre 0 (Domingo) y 6 (Sábado)');
  }

  // Validar formato de horas
  if (!data.startTime || !isValidTimeFormat(data.startTime)) {
    errors.push('La hora de inicio debe tener formato HH:mm (ej: 09:00)');
  }

  if (!data.endTime || !isValidTimeFormat(data.endTime)) {
    errors.push('La hora de fin debe tener formato HH:mm (ej: 17:00)');
  }

  // Validar que hora de fin sea después de hora de inicio
  if (data.startTime && data.endTime && isValidTimeFormat(data.startTime) && isValidTimeFormat(data.endTime)) {
    const start = parse(data.startTime, 'HH:mm', new Date());
    const end = parse(data.endTime, 'HH:mm', new Date());

    if (!isAfter(end, start)) {
      errors.push('La hora de fin debe ser posterior a la hora de inicio');
    }

    // Validar que haya al menos 30 minutos de diferencia
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (diffMinutes < 30) {
      errors.push('Debe haber al menos 30 minutos entre la hora de inicio y fin');
    }

    // Validar horario laboral razonable (6 AM - 10 PM)
    const startHour = start.getHours();
    const endHour = end.getHours();
    
    if (startHour < 6) {
      errors.push('La hora de inicio no puede ser antes de las 6:00 AM');
    }
    
    if (endHour > 22 || (endHour === 22 && end.getMinutes() > 0)) {
      errors.push('La hora de fin no puede ser después de las 10:00 PM');
    }

    // Validar que no exceda 12 horas de jornada
    if (diffMinutes > 720) {
      errors.push('La jornada no puede exceder 12 horas continuas');
    }
  }

  // Validar duración del slot
  if (!data.slotDuration) {
    errors.push('Debe especificar la duración de cada cita');
  } else {
    if (data.slotDuration < 15) {
      errors.push('La duración mínima de una cita es 15 minutos');
    }
    
    if (data.slotDuration > 240) {
      errors.push('La duración máxima de una cita es 4 horas (240 minutos)');
    }

    // Validar que sea múltiplo de 5 para mantener horarios ordenados
    if (data.slotDuration % 5 !== 0) {
      errors.push('La duración debe ser múltiplo de 5 minutos (ej: 15, 20, 30, 45, 60)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================
// VALIDACIONES DE CITAS
// ============================================

export function validateAppointment(data: {
  patientName?: string;
  patientPhone?: string;
  doctorId?: string;
  timeSlotId?: string;
  appointmentDate?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validar nombre del paciente
  if (!data.patientName || data.patientName.trim() === '') {
    errors.push('El nombre del paciente es obligatorio');
  } else {
    if (data.patientName.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    }
    
    if (data.patientName.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }

    // Validar que contenga al menos nombre y apellido
    const nameParts = data.patientName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      errors.push('Debe ingresar nombre y apellido completo');
    }

    // Validar que solo contenga letras y espacios
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.patientName)) {
      errors.push('El nombre solo puede contener letras y espacios');
    }
  }

  // Validar teléfono
  if (!data.patientPhone || data.patientPhone.trim() === '') {
    errors.push('El teléfono del paciente es obligatorio');
  } else {
    // Remover espacios y caracteres especiales excepto + al inicio
    const cleanPhone = data.patientPhone.replace(/[\s\-\(\)]/g, '');
    
    // Validar formato internacional o local
    if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
      errors.push('El teléfono debe tener entre 10 y 15 dígitos (puede incluir + al inicio)');
    }
  }

  // Validar que exista doctor
  if (!data.doctorId || data.doctorId.trim() === '') {
    errors.push('Debe seleccionar un médico');
  }

  // Validar que exista slot
  if (!data.timeSlotId || data.timeSlotId.trim() === '') {
    errors.push('Debe seleccionar un horario disponible');
  }

  // Validar fecha de cita
  if (!data.appointmentDate) {
    errors.push('Debe seleccionar una fecha para la cita');
  } else {
    const appointmentDate = new Date(data.appointmentDate);
    
    if (!isValid(appointmentDate)) {
      errors.push('La fecha de la cita no es válida');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // No permitir citas en el pasado
      if (isBefore(appointmentDate, today)) {
        errors.push('No se pueden agendar citas en fechas pasadas');
      }

      // No permitir citas con más de 6 meses de anticipación
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      
      if (isAfter(appointmentDate, sixMonthsLater)) {
        errors.push('No se pueden agendar citas con más de 6 meses de anticipación');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================
// VALIDACIONES DE PACIENTES
// ============================================

export function validatePatient(data: {
  name?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Nombre
  if (!data.name || data.name.trim() === '') {
    errors.push('El nombre es obligatorio');
  } else {
    if (data.name.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.name)) {
      errors.push('El nombre solo puede contener letras y espacios');
    }
  }

  // Teléfono
  if (!data.phone || data.phone.trim() === '') {
    errors.push('El teléfono es obligatorio');
  } else {
    const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
      errors.push('Formato de teléfono inválido');
    }
  }

  // Email (opcional pero si existe debe ser válido)
  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('El email no tiene un formato válido');
    }
  }

  // Fecha de nacimiento (opcional pero si existe debe ser válida)
  if (data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth);
    
    if (!isValid(birthDate)) {
      errors.push('La fecha de nacimiento no es válida');
    } else {
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (isAfter(birthDate, today)) {
        errors.push('La fecha de nacimiento no puede ser en el futuro');
      }

      if (age > 120) {
        errors.push('La fecha de nacimiento no es realista');
      }

      if (age < 0) {
        errors.push('La fecha de nacimiento debe ser anterior a hoy');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================
// VALIDACIONES DE DOCTOR
// ============================================

export function validateDoctor(data: {
  name?: string;
  specialty?: string;
  phone?: string;
  email?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Nombre
  if (!data.name || data.name.trim() === '') {
    errors.push('El nombre del médico es obligatorio');
  } else {
    if (data.name.trim().length < 5) {
      errors.push('El nombre debe incluir título (Dr./Dra.) y nombre completo');
    }
    if (!/^(Dr\.|Dra\.|Doctor|Doctora)\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/i.test(data.name)) {
      errors.push('El nombre debe comenzar con Dr./Dra. seguido del nombre completo');
    }
  }

  // Especialidad
  if (!data.specialty || data.specialty.trim() === '') {
    errors.push('La especialidad es obligatoria');
  } else {
    if (data.specialty.trim().length < 3) {
      errors.push('La especialidad debe tener al menos 3 caracteres');
    }
  }

  // Teléfono (opcional)
  if (data.phone && data.phone.trim() !== '') {
    const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
      errors.push('Formato de teléfono inválido');
    }
  }

  // Email (opcional)
  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('El email no tiene un formato válido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================
// VALIDACIONES DE MODIFICACIÓN DE HORARIOS
// ============================================

export function validateScheduleModification(
  existingSchedule: any,
  newData: any,
  existingAppointments: number
): ValidationResult {
  const errors: string[] = [];

  // Si hay citas existentes, aplicar restricciones
  if (existingAppointments > 0) {
    // No permitir cambiar el doctor
    if (newData.doctorId && newData.doctorId !== existingSchedule.doctor_id) {
      errors.push('No se puede cambiar el médico cuando existen citas programadas');
    }

    // No permitir cambiar el día de la semana
    if (newData.dayOfWeek !== undefined && newData.dayOfWeek !== existingSchedule.day_of_week) {
      errors.push('No se puede cambiar el día de la semana cuando existen citas programadas');
    }

    // No permitir reducir el rango horario si afecta citas existentes
    if (newData.startTime || newData.endTime) {
      const newStart = newData.startTime || existingSchedule.start_time;
      const newEnd = newData.endTime || existingSchedule.end_time;
      const oldStart = existingSchedule.start_time;
      const oldEnd = existingSchedule.end_time;

      if (newStart > oldStart || newEnd < oldEnd) {
        errors.push(
          'No se puede reducir el rango horario cuando existen citas programadas. ' +
          'Primero cancele o reubique las citas afectadas.'
        );
      }
    }

    // Advertir sobre cambio de duración
    if (newData.slotDuration && newData.slotDuration !== existingSchedule.slot_duration) {
      errors.push(
        `Hay ${existingAppointments} cita(s) programada(s). ` +
        'Cambiar la duración de los slots puede afectar la disponibilidad. ' +
        'Se recomienda crear un nuevo horario en lugar de modificar este.'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================
// VALIDACIONES DE CANCELACIÓN DE CITAS
// ============================================

export function validateAppointmentCancellation(
  appointment: any,
  cancellationReason?: string
): ValidationResult {
  const errors: string[] = [];

  // Validar que la cita no esté ya cancelada
  if (appointment.status === 'cancelled') {
    errors.push('Esta cita ya fue cancelada anteriormente');
  }

  // Validar que la cita no esté completada
  if (appointment.status === 'completed') {
    errors.push('No se puede cancelar una cita que ya fue completada');
  }

  // Validar que la cita no sea del pasado (con tolerancia de 2 horas)
  const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  if (isBefore(appointmentDateTime, twoHoursAgo)) {
    errors.push('No se pueden cancelar citas que ya pasaron hace más de 2 horas');
  }

  // Validar razón de cancelación
  if (cancellationReason && cancellationReason.trim() !== '') {
    if (cancellationReason.length < 10) {
      errors.push('La razón de cancelación debe tener al menos 10 caracteres');
    }
    if (cancellationReason.length > 500) {
      errors.push('La razón de cancelación no puede exceder 500 caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================
// UTILIDADES
// ============================================

function isValidTimeFormat(time: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return '• ' + errors.join('\n• ');
}

// Validar conflictos de horarios
export async function checkScheduleConflicts(
  doctorId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): Promise<{ hasConflict: boolean; conflictingSchedule?: any }> {
  // Esta función será llamada desde las APIs con acceso a Supabase
  return { hasConflict: false };
}
