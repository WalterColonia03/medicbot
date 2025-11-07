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
  doctorName: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  slotDuration: number; // en minutos
  isActive: boolean;
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
