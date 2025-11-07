// Tipos de datos para la aplicación de citas médicas

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  date: string; // ISO format
  timeSlot: string; // e.g., "09:00-09:30"
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  notificationSent: boolean;
}

export interface TimeSlot {
  id: string;
  doctorName: string;
  date: string; // ISO format (YYYY-MM-DD)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  appointmentId?: string;
}

export interface Schedule {
  id: string;
  doctor_id: string;
  specific_date: string | null; // ISO format (YYYY-MM-DD) or null
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  slot_duration: number; // en minutos
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  doctor?: {
    id: string;
    name: string;
    specialty: string;
  };
}

export interface ChatMessage {
  id: string;
  from: string; // phone number
  body: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
}

export interface ChatSession {
  id: string;
  phoneNumber: string;
  currentStep: 'greeting' | 'selecting_doctor' | 'selecting_date' | 'selecting_time' | 'confirming' | 'completed';
  selectedDoctor?: string;
  selectedDate?: string;
  selectedTimeSlot?: string;
  createdAt: string;
  updatedAt: string;
}
