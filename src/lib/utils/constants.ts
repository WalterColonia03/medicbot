// src/lib/utils/constants.ts
/**
Zona horaria de Perú (UTC-5, sin horario de verano) */
export const PERU_UTC_OFFSET = -5;

/**
Días de la semana */
export const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/**
Estados de citas */
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
} as const;

/**
Etiquetas de estados */
export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No asistió',
};

/**
Estilos para badges de estado */
export const APPOINTMENT_STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  no_show: 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
Duraciones disponibles para citas (en minutos) */
export const SLOT_DURATIONS = [
  { value: 15, label: '15 minutos' },
  { value: 20, label: '20 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' },
] as const;

/**
Límites de validación */
export const VALIDATION_LIMITS = {
  MIN_SLOT_DURATION: 15,
  MAX_SLOT_DURATION: 240,
  MIN_START_HOUR: 6,
  MAX_END_HOUR: 22,
  MAX_SCHEDULE_DURATION: 720, // 12 horas
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 100,
  MIN_PHONE_LENGTH: 10,
  MAX_PHONE_LENGTH: 15,
  MIN_CANCELLATION_REASON_LENGTH: 10,
  MAX_CANCELLATION_REASON_LENGTH: 500,
  MAX_SCHEDULE_ADVANCE_MONTHS: 12,
  MAX_APPOINTMENT_ADVANCE_MONTHS: 6,
} as const;

/**
Configuración de notificaciones */
export const NOTIFICATION_CONFIG = {
  REMINDER_HOURS_BEFORE: 24,
  RATING_REQUEST_HOURS_AFTER: 24,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

/**
Tipos de notificación */
export const NOTIFICATION_TYPES = {
  CONFIRMATION: 'confirmation',
  REMINDER: 'reminder',
  CANCELLATION: 'cancellation',
  UPDATE: 'update',
  RATING_REQUEST: 'rating_request',
} as const;

/**
Comandos del chatbot */
export const CHATBOT_COMMANDS = {
  NEW_APPOINTMENT: ['nueva cita', 'agendar', 'reservar'],
  MY_APPOINTMENTS: ['mis citas', 'ver citas', 'citas'],
  CANCEL: 'cancelar',
  HELP: ['ayuda', 'help', 'comandos'],
  RATING: /^[1-5]$/,
} as const;

/**
Pasos del chatbot */
export const CHAT_STEPS = {
  GREETING: 'greeting',
  SELECTING_DOCTOR: 'selecting_doctor',
  SELECTING_DATE: 'selecting_date',
  SELECTING_TIME: 'selecting_time',
  CONFIRMING: 'confirming',
  COMPLETED: 'completed',
} as const;

/**
Mensajes de error comunes */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'No autorizado',
  NOT_FOUND: 'Recurso no encontrado',
  VALIDATION_ERROR: 'Error de validación',
  SERVER_ERROR: 'Error interno del servidor',
  DATABASE_ERROR: 'Error de base de datos',
  EXTERNAL_SERVICE_ERROR: 'Error en servicio externo',
} as const;

/**
Regex patterns */
export const REGEX_PATTERNS = {
  PHONE: /^+?\d{10,15}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TIME: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  LETTERS_ONLY: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
} as const;
