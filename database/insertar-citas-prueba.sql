-- ============================================================
-- SCRIPT: Insertar Citas de Prueba
-- ============================================================
-- Este script crea citas de ejemplo para probar la aplicación
-- ============================================================

-- PASO 1: Crear pacientes de prueba (si no existen)
-- ============================================================
INSERT INTO patients (name, phone, email)
VALUES 
  ('María López', '+51987654321', 'maria@example.com'),
  ('Juan García', '+51987654322', 'juan@example.com'),
  ('Ana Martínez', '+51987654323', 'ana@example.com')
ON CONFLICT (phone) DO NOTHING;


-- PASO 2: Obtener IDs necesarios
-- ============================================================
-- Verás los IDs que necesitamos
SELECT 
  'DOCTORES' as tabla,
  id,
  name as nombre
FROM doctors 
WHERE is_active = true
LIMIT 5;

SELECT 
  'PACIENTES' as tabla,
  id,
  name as nombre,
  phone
FROM patients
LIMIT 5;

SELECT 
  'TIME SLOTS DISPONIBLES HOY' as tabla,
  ts.id,
  ts.slot_date,
  ts.start_time,
  ts.end_time,
  d.name as doctor
FROM time_slots ts
JOIN doctors d ON ts.doctor_id = d.id
WHERE ts.slot_date >= CURRENT_DATE
  AND ts.is_available = true
ORDER BY ts.slot_date, ts.start_time
LIMIT 10;


-- PASO 3: Crear citas de prueba
-- ============================================================
-- Este script creará 3 citas automáticamente

DO $$
DECLARE
  v_patient1_id UUID;
  v_patient2_id UUID;
  v_patient3_id UUID;
  v_doctor_id UUID;
  v_slot1_id UUID;
  v_slot2_id UUID;
  v_slot3_id UUID;
  v_slot1_date DATE;
  v_slot1_start TIME;
  v_slot1_end TIME;
  v_slot2_date DATE;
  v_slot2_start TIME;
  v_slot2_end TIME;
  v_slot3_date DATE;
  v_slot3_start TIME;
  v_slot3_end TIME;
BEGIN
  -- Obtener pacientes
  SELECT id INTO v_patient1_id FROM patients WHERE phone = '+51987654321' LIMIT 1;
  SELECT id INTO v_patient2_id FROM patients WHERE phone = '+51987654322' LIMIT 1;
  SELECT id INTO v_patient3_id FROM patients WHERE phone = '+51987654323' LIMIT 1;
  
  -- Obtener un doctor activo
  SELECT id INTO v_doctor_id FROM doctors WHERE is_active = true LIMIT 1;
  
  -- Obtener 3 time slots disponibles
  SELECT id, slot_date, start_time, end_time 
  INTO v_slot1_id, v_slot1_date, v_slot1_start, v_slot1_end
  FROM time_slots 
  WHERE slot_date >= CURRENT_DATE 
    AND is_available = true 
    AND doctor_id = v_doctor_id
  ORDER BY slot_date, start_time 
  LIMIT 1 OFFSET 0;
  
  SELECT id, slot_date, start_time, end_time 
  INTO v_slot2_id, v_slot2_date, v_slot2_start, v_slot2_end
  FROM time_slots 
  WHERE slot_date >= CURRENT_DATE 
    AND is_available = true 
    AND doctor_id = v_doctor_id
  ORDER BY slot_date, start_time 
  LIMIT 1 OFFSET 1;
  
  SELECT id, slot_date, start_time, end_time 
  INTO v_slot3_id, v_slot3_date, v_slot3_start, v_slot3_end
  FROM time_slots 
  WHERE slot_date >= CURRENT_DATE 
    AND is_available = true 
    AND doctor_id = v_doctor_id
  ORDER BY slot_date, start_time 
  LIMIT 1 OFFSET 2;
  
  -- Crear cita 1 (Confirmada)
  IF v_slot1_id IS NOT NULL AND v_patient1_id IS NOT NULL THEN
    INSERT INTO appointments (
      patient_id,
      doctor_id,
      time_slot_id,
      appointment_date,
      start_time,
      end_time,
      status,
      reason,
      notification_sent
    ) VALUES (
      v_patient1_id,
      v_doctor_id,
      v_slot1_id,
      v_slot1_date,
      v_slot1_start,
      v_slot1_end,
      'confirmed',
      'Consulta general',
      true
    );
    
    -- Marcar slot como ocupado
    UPDATE time_slots SET is_available = false WHERE id = v_slot1_id;
    
    RAISE NOTICE '✅ Cita 1 creada: María López - %', v_slot1_date;
  END IF;
  
  -- Crear cita 2 (Confirmada)
  IF v_slot2_id IS NOT NULL AND v_patient2_id IS NOT NULL THEN
    INSERT INTO appointments (
      patient_id,
      doctor_id,
      time_slot_id,
      appointment_date,
      start_time,
      end_time,
      status,
      reason,
      notification_sent
    ) VALUES (
      v_patient2_id,
      v_doctor_id,
      v_slot2_id,
      v_slot2_date,
      v_slot2_start,
      v_slot2_end,
      'confirmed',
      'Control de rutina',
      true
    );
    
    -- Marcar slot como ocupado
    UPDATE time_slots SET is_available = false WHERE id = v_slot2_id;
    
    RAISE NOTICE '✅ Cita 2 creada: Juan García - %', v_slot2_date;
  END IF;
  
  -- Crear cita 3 (Pendiente)
  IF v_slot3_id IS NOT NULL AND v_patient3_id IS NOT NULL THEN
    INSERT INTO appointments (
      patient_id,
      doctor_id,
      time_slot_id,
      appointment_date,
      start_time,
      end_time,
      status,
      reason,
      notification_sent
    ) VALUES (
      v_patient3_id,
      v_doctor_id,
      v_slot3_id,
      v_slot3_date,
      v_slot3_start,
      v_slot3_end,
      'pending',
      'Primera consulta',
      false
    );
    
    -- Marcar slot como ocupado
    UPDATE time_slots SET is_available = false WHERE id = v_slot3_id;
    
    RAISE NOTICE '✅ Cita 3 creada: Ana Martínez - %', v_slot3_date;
  END IF;
  
  RAISE NOTICE '🎉 Proceso completado';
END $$;


-- PASO 4: Verificar las citas creadas
-- ============================================================
SELECT 
  a.id,
  p.name as paciente,
  p.phone,
  d.name as doctor,
  a.appointment_date as fecha,
  a.start_time as hora_inicio,
  a.end_time as hora_fin,
  a.status,
  a.reason as motivo
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.appointment_date, a.start_time;


-- RESUMEN
SELECT 
  '✅ Total de citas' as resumen,
  COUNT(*) as cantidad
FROM appointments;
