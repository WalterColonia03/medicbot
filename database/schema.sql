-- ============================================
-- MEDICBOT - ESQUEMA DE BASE DE DATOS SUPABASE
-- Sistema de Gestión de Citas Médicas
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: doctors (Médicos)
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por nombre
CREATE INDEX idx_doctors_name ON doctors(name);
CREATE INDEX idx_doctors_active ON doctors(is_active);

-- ============================================
-- TABLA: schedules (Horarios de Atención)
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER NOT NULL DEFAULT 30, -- en minutos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para validar que end_time > start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    -- Constraint para validar duración de slot
    CONSTRAINT valid_slot_duration CHECK (slot_duration > 0 AND slot_duration <= 240)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_schedules_doctor ON schedules(doctor_id);
CREATE INDEX idx_schedules_day ON schedules(day_of_week);
CREATE INDEX idx_schedules_active ON schedules(is_active);

-- ============================================
-- TABLA: time_slots (Espacios de Tiempo Disponibles)
-- ============================================
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicados de slots para el mismo doctor en la misma fecha/hora
    UNIQUE(doctor_id, slot_date, start_time)
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_timeslots_doctor ON time_slots(doctor_id);
CREATE INDEX idx_timeslots_date ON time_slots(slot_date);
CREATE INDEX idx_timeslots_available ON time_slots(is_available);
CREATE INDEX idx_timeslots_doctor_date ON time_slots(doctor_id, slot_date);

-- ============================================
-- TABLA: patients (Pacientes)
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    date_of_birth DATE,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name ON patients(name);

-- ============================================
-- TABLA: appointments (Citas Médicas)
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    reason TEXT,
    notes TEXT,
    notification_sent BOOLEAN DEFAULT false,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

-- Índices para consultas frecuentes
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_timeslot ON appointments(time_slot_id);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);

-- ============================================
-- TABLA: chat_sessions (Sesiones de Chat WhatsApp)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    current_step VARCHAR(50) NOT NULL DEFAULT 'greeting',
    selected_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    selected_date DATE,
    selected_time_slot_id UUID REFERENCES time_slots(id) ON DELETE SET NULL,
    session_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_chat_sessions_phone ON chat_sessions(phone_number);
CREATE INDEX idx_chat_sessions_active ON chat_sessions(is_active);
CREATE INDEX idx_chat_sessions_patient ON chat_sessions(patient_id);

-- ============================================
-- TABLA: notifications (Notificaciones Enviadas)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL 
        CHECK (notification_type IN ('confirmation', 'reminder', 'cancellation', 'update')),
    channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'pending')),
    error_message TEXT
);

-- Índices
CREATE INDEX idx_notifications_appointment ON notifications(appointment_id);
CREATE INDEX idx_notifications_patient ON notifications(patient_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_sent ON notifications(sent_at);

-- ============================================
-- TABLA: audit_log (Registro de Auditoría)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_log(changed_at);

-- ============================================
-- VISTAS (Views)
-- ============================================

-- Vista: Citas con información completa
CREATE OR REPLACE VIEW v_appointments_full AS
SELECT 
    a.id,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.status,
    a.reason,
    a.notes,
    a.notification_sent,
    a.reminder_sent,
    a.created_at,
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    p.email as patient_email,
    d.id as doctor_id,
    d.name as doctor_name,
    d.specialty as doctor_specialty,
    d.phone as doctor_phone
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id;

-- Vista: Slots disponibles con información del doctor
CREATE OR REPLACE VIEW v_available_slots AS
SELECT 
    ts.id,
    ts.slot_date,
    ts.start_time,
    ts.end_time,
    ts.is_available,
    d.id as doctor_id,
    d.name as doctor_name,
    d.specialty as doctor_specialty
FROM time_slots ts
JOIN doctors d ON ts.doctor_id = d.id
WHERE ts.is_available = true
  AND ts.slot_date >= CURRENT_DATE
ORDER BY ts.slot_date, ts.start_time;

-- ============================================
-- FUNCIONES (Functions)
-- ============================================

-- Función: Actualizar timestamp de updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Generar slots de tiempo para un horario
CREATE OR REPLACE FUNCTION generate_time_slots(
    p_schedule_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_schedule RECORD;
    v_current_date DATE;
    v_current_time TIME;
    v_end_time TIME;
    v_slots_created INTEGER := 0;
BEGIN
    -- Obtener información del horario
    SELECT * INTO v_schedule FROM schedules WHERE id = p_schedule_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Schedule not found or inactive';
    END IF;
    
    -- Iterar sobre las fechas
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
        -- Verificar si el día de la semana coincide
        IF EXTRACT(DOW FROM v_current_date) = v_schedule.day_of_week THEN
            v_current_time := v_schedule.start_time;
            
            -- Generar slots para este día
            WHILE v_current_time < v_schedule.end_time LOOP
                v_end_time := v_current_time + (v_schedule.slot_duration || ' minutes')::INTERVAL;
                
                -- Verificar que el slot no exceda el horario de fin
                IF v_end_time <= v_schedule.end_time THEN
                    -- Insertar slot si no existe
                    INSERT INTO time_slots (
                        doctor_id,
                        schedule_id,
                        slot_date,
                        start_time,
                        end_time,
                        is_available
                    )
                    VALUES (
                        v_schedule.doctor_id,
                        v_schedule.id,
                        v_current_date,
                        v_current_time,
                        v_end_time,
                        true
                    )
                    ON CONFLICT (doctor_id, slot_date, start_time) DO NOTHING;
                    
                    v_slots_created := v_slots_created + 1;
                END IF;
                
                v_current_time := v_end_time;
            END LOOP;
        END IF;
        
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN v_slots_created;
END;
$$ LANGUAGE plpgsql;

-- Función: Marcar slot como no disponible al crear cita
CREATE OR REPLACE FUNCTION mark_slot_unavailable()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.time_slot_id IS NOT NULL THEN
        UPDATE time_slots 
        SET is_available = false 
        WHERE id = NEW.time_slot_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Liberar slot al cancelar cita
CREATE OR REPLACE FUNCTION release_slot_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        IF NEW.time_slot_id IS NOT NULL THEN
            UPDATE time_slots 
            SET is_available = true 
            WHERE id = NEW.time_slot_id;
        END IF;
        NEW.cancelled_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Actualizar updated_at en todas las tablas
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
    BEFORE UPDATE ON time_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Marcar slot como no disponible al crear cita
CREATE TRIGGER mark_slot_unavailable_on_appointment
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION mark_slot_unavailable();

-- Trigger: Liberar slot al cancelar cita
CREATE TRIGGER release_slot_on_appointment_cancel
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION release_slot_on_cancel();

-- ============================================
-- DATOS INICIALES (Seed Data)
-- ============================================

-- Insertar médicos de ejemplo
INSERT INTO doctors (name, specialty, phone, email) VALUES
    ('Dr. Juan Pérez', 'Medicina General', '+1234567890', 'juan.perez@medicbot.com'),
    ('Dra. María González', 'Pediatría', '+1234567891', 'maria.gonzalez@medicbot.com'),
    ('Dr. Carlos Rodríguez', 'Cardiología', '+1234567892', 'carlos.rodriguez@medicbot.com')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (anónimos pueden ver doctores y slots)
CREATE POLICY "Public can view active doctors"
    ON doctors FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view available slots"
    ON time_slots FOR SELECT
    USING (is_available = true);

-- Políticas para operaciones autenticadas
CREATE POLICY "Authenticated users can insert appointments"
    ON appointments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view appointments"
    ON appointments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can update appointments"
    ON appointments FOR UPDATE
    USING (true);

-- ============================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================

COMMENT ON TABLE doctors IS 'Catálogo de médicos disponibles en el sistema';
COMMENT ON TABLE schedules IS 'Horarios de atención semanales de cada médico';
COMMENT ON TABLE time_slots IS 'Espacios de tiempo específicos generados a partir de los horarios';
COMMENT ON TABLE patients IS 'Información de los pacientes registrados';
COMMENT ON TABLE appointments IS 'Citas médicas programadas';
COMMENT ON TABLE chat_sessions IS 'Sesiones activas del chatbot de WhatsApp';
COMMENT ON TABLE notifications IS 'Registro de notificaciones enviadas a pacientes';
COMMENT ON TABLE audit_log IS 'Registro de auditoría de cambios en el sistema';

-- ============================================
-- FIN DEL ESQUEMA
-- ============================================
