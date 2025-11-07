-- ============================================
-- PRUEBA COMPLETA: Simular flujo del chatbot
-- ============================================

-- 1. Limpiar datos antiguos
DELETE FROM chat_sessions WHERE is_active = true;
DELETE FROM time_slots WHERE slot_date < CURRENT_DATE;

-- 2. Crear schedule para hoy
INSERT INTO schedules (doctor_id, specific_date, start_time, end_time, slot_duration, is_active)
SELECT d.id, CURRENT_DATE, '09:00'::time, '18:00'::time, 30, true
FROM doctors d
WHERE d.name = 'Dr. Carlos Rodríguez'
ON CONFLICT DO NOTHING;

-- 3. Generar slots para hoy
SELECT generate_time_slots_for_date(
    (SELECT id FROM schedules WHERE specific_date = CURRENT_DATE AND is_active = true LIMIT 1),
    CURRENT_DATE
);

-- 4. Ver slots disponibles para hoy
SELECT
    ts.id,
    ts.slot_date,
    ts.start_time,
    ts.end_time,
    d.name as doctor_name
FROM time_slots ts
JOIN doctors d ON ts.doctor_id = d.id
WHERE ts.slot_date = CURRENT_DATE
  AND ts.is_available = true
ORDER BY ts.start_time
LIMIT 5;

-- ============================================
-- FIN DE LA PRUEBA
-- ============================================
