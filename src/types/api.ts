// src/types/api.ts
/**
Tipos para respuestas de API */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
Tipos para entidades del dominio */
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
}

export interface TimeSlot {
  id: string;
  doctor_id: string;
  schedule_id: string | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  time_slot_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  notification_sent: boolean;
  reminder_sent: boolean;
  rating_requested: boolean;
  rated: boolean;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

/**
Tipos para requests de API */
export interface CreateAppointmentRequest {
  patientName: string;
  patientPhone: string;
  doctorId: string;
  timeSlotId: string;
  reason?: string;
}

export interface CreateScheduleRequest {
  doctor_id: string;
  specific_date: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

export interface UpdateAppointmentRequest {
  status?: AppointmentStatus;
  cancellation_reason?: string;
  notes?: string;
}

/**
Tipos para WhatsApp */
export interface ChatSession {
  id: string;
  phone_number: string;
  patient_id: string | null;
  current_step: ChatStep;
  selected_doctor_id: string | null;
  selected_date: string | null;
  selected_time_slot_id: string | null;
  session_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type ChatStep =
  | 'greeting'
  | 'selecting_doctor'
  | 'selecting_date'
  | 'selecting_time'
  | 'confirming'
  | 'completed';

/**
Tipos para notificaciones */
export interface Notification {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  notification_type: NotificationType;
  channel: string;
  phone_number: string;
  message: string;
  sent_at: string;
  status: NotificationStatus;
  error_message: string | null;
}

export type NotificationType =
  | 'confirmation'
  | 'reminder'
  | 'cancellation'
  | 'update'
  | 'rating_request';

export type NotificationStatus =
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'pending';

/**
Tipos para estadísticas del dashboard */
export interface DashboardStats {
  totalAppointments: number;
  confirmedToday: number;
  availableSlots: number;
  doctorsCount: number;
  cancelledThisWeek: number;
  notificationsSent: number;
}
