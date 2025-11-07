// Tipos TypeScript generados para la base de datos Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      doctors: {
        Row: {
          id: string
          name: string
          specialty: string
          phone: string | null
          email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          specialty: string
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          specialty?: string
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          slot_duration?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      time_slots: {
        Row: {
          id: string
          doctor_id: string
          schedule_id: string | null
          slot_date: string
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          schedule_id?: string | null
          slot_date: string
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          schedule_id?: string | null
          slot_date?: string
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          date_of_birth: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          date_of_birth?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          date_of_birth?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          time_slot_id: string | null
          appointment_date: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          reason: string | null
          notes: string | null
          notification_sent: boolean
          reminder_sent: boolean
          created_at: string
          updated_at: string
          cancelled_at: string | null
          cancellation_reason: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          time_slot_id?: string | null
          appointment_date: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          reason?: string | null
          notes?: string | null
          notification_sent?: boolean
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
          cancellation_reason?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          time_slot_id?: string | null
          appointment_date?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          reason?: string | null
          notes?: string | null
          notification_sent?: boolean
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
          cancelled_at?: string | null
          cancellation_reason?: string | null
        }
      }
      chat_sessions: {
        Row: {
          id: string
          phone_number: string
          patient_id: string | null
          current_step: string
          selected_doctor_id: string | null
          selected_date: string | null
          selected_time_slot_id: string | null
          session_data: Json
          is_active: boolean
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          phone_number: string
          patient_id?: string | null
          current_step?: string
          selected_doctor_id?: string | null
          selected_date?: string | null
          selected_time_slot_id?: string | null
          session_data?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          phone_number?: string
          patient_id?: string | null
          current_step?: string
          selected_doctor_id?: string | null
          selected_date?: string | null
          selected_time_slot_id?: string | null
          session_data?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          appointment_id: string | null
          patient_id: string
          notification_type: 'confirmation' | 'reminder' | 'cancellation' | 'update'
          channel: string
          phone_number: string
          message: string
          sent_at: string
          status: 'sent' | 'delivered' | 'failed' | 'pending'
          error_message: string | null
        }
        Insert: {
          id?: string
          appointment_id?: string | null
          patient_id: string
          notification_type: 'confirmation' | 'reminder' | 'cancellation' | 'update'
          channel?: string
          phone_number: string
          message: string
          sent_at?: string
          status?: 'sent' | 'delivered' | 'failed' | 'pending'
          error_message?: string | null
        }
        Update: {
          id?: string
          appointment_id?: string | null
          patient_id?: string
          notification_type?: 'confirmation' | 'reminder' | 'cancellation' | 'update'
          channel?: string
          phone_number?: string
          message?: string
          sent_at?: string
          status?: 'sent' | 'delivered' | 'failed' | 'pending'
          error_message?: string | null
        }
      }
    }
    Views: {
      v_appointments_full: {
        Row: {
          id: string
          appointment_date: string
          start_time: string
          end_time: string
          status: string
          reason: string | null
          notes: string | null
          notification_sent: boolean
          reminder_sent: boolean
          created_at: string
          patient_id: string
          patient_name: string
          patient_phone: string
          patient_email: string | null
          doctor_id: string
          doctor_name: string
          doctor_specialty: string
          doctor_phone: string | null
        }
      }
      v_available_slots: {
        Row: {
          id: string
          slot_date: string
          start_time: string
          end_time: string
          is_available: boolean
          doctor_id: string
          doctor_name: string
          doctor_specialty: string
        }
      }
    }
    Functions: {
      generate_time_slots: {
        Args: {
          p_schedule_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: number
      }
    }
  }
}
