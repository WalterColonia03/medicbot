-- ============================================================
-- SCRIPT DE CORRECCIÓN: Horarios y Time Slots
-- ============================================================
-- Este script corrige los horarios y genera time slots
-- para que el chatbot funcione correctamente
-- ============================================================

-- PASO 1: Ver estado actual
-- ============================================================
SELECT 'PASO 1: Estado actual de schedules' as step;

SELECT 
  s.id,
  d.name as doctor,
  CASE s.day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as dia,
  s.start_time,
  s.end_time,
  s.slot_duration,
  s.is_active
FROM schedules s
JOIN doctors d ON s.doctor_id = d.id
ORDER BY s.day_of_week, s.start_time;

-- Ver cuántos time_slots existen
SELECT 'Time slots actuales' as info, COUNT(*) as cantidad FROM time_slots;

-- ============================================================
-- PASO 2: LIMPIAR datos incorrectos
-- ============================================================
SELECT 'PASO 2: Limpiando datos incorrectos' as step;

-- Desactivar horarios de Domingo (no borrarlos por seguridad)
UPDATE schedules 
SET is_active = false
WHERE day_of_week = 0;

SELECT 'Horarios de Domingo desactivados' as result;

-- ============================================================
-- PASO 3: CREAR horarios de Lunes a Viernes
-- ============================================================
SELECT 'PASO 3: Creando nuevos horarios (Lunes-Viernes)' as step;

-- Obtener el primer doctor activo
DO $$
DECLARE
  v_doctor_id UUID;
  v_schedule_id UUID;
  v_day INT;
BEGIN
  -- Obtener primer doctor activo
  SELECT id INTO v_doctor_id FROM doctors WHERE is_active = true LIMIT 1;
  
  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No hay médicos activos. Primero crea un médico.';
  END IF;
  
  -- Crear horarios para Lunes (1) a Viernes (5)
  FOR v_day IN 1..5 LOOP
    -- Verificar si ya existe horario para este día
    IF NOT EXISTS (
      SELECT 1 FROM schedules 
      WHERE doctor_id = v_doctor_id 
      AND day_of_week = v_day 
      AND is_active = true
    ) THEN
      -- Crear horario
      INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
      VALUES (v_doctor_id, v_day, '09:00', '17:00', 30, true)
      RETURNING id INTO v_schedule_id;
      
      RAISE NOTICE 'Creado horario para día % con ID %', v_day, v_schedule_id;
    ELSE
      RAISE NOTICE 'Ya existe horario para día %', v_day;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- PASO 4: GENERAR Time Slots para los próximos 30 días
-- ============================================================
SELECT 'PASO 4: Generando time slots' as step;

DO $$
DECLARE
  v_schedule RECORD;
  v_start_date DATE := CURRENT_DATE;
  v_end_date DATE := CURRENT_DATE + INTERVAL '30 days';
BEGIN
  -- Para cada horario activo
  FOR v_schedule IN 
    SELECT id, doctor_id, day_of_week, start_time, end_time, slot_duration
    FROM schedules 
    WHERE is_active = true
  LOOP
    -- Generar slots para este horario
    PERFORM generate_time_slots(
      v_schedule.id,
      v_start_date,
      v_end_date
    );
    
    RAISE NOTICE 'Slots generados para schedule ID: %', v_schedule.id;
  END LOOP;
END $$;

-- ============================================================
-- PASO 5: VERIFICAR resultados
-- ============================================================
SELECT 'PASO 5: Verificación final' as step;

-- Contar schedules activos por día
SELECT 
  CASE day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as dia,
  COUNT(*) as cantidad_horarios
FROM schedules
WHERE is_active = true
GROUP BY day_of_week
ORDER BY day_of_week;

-- Contar time_slots disponibles por fecha (próximos 7 días)
SELECT 
  slot_date,
  COUNT(*) as slots_disponibles
FROM time_slots
WHERE is_available = true
  AND slot_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
GROUP BY slot_date
ORDER BY slot_date;

-- Ver algunos slots de ejemplo
SELECT 
  ts.slot_date,
  ts.start_time,
  ts.end_time,
  d.name as doctor,
  ts.is_available
FROM time_slots ts
JOIN doctors d ON ts.doctor_id = d.id
WHERE ts.slot_date >= CURRENT_DATE
ORDER BY ts.slot_date, ts.start_time
LIMIT 10;

-- ============================================================
-- RESUMEN FINAL
-- ============================================================
SELECT '✅ SCRIPT COMPLETADO' as status;
SELECT 'Schedules activos: ' || COUNT(*) FROM schedules WHERE is_active = true;
SELECT 'Time slots disponibles: ' || COUNT(*) FROM time_slots WHERE is_available = true;
