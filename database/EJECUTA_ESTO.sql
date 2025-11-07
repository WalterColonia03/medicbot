-- ============================================================
-- 🚀 SCRIPT RÁPIDO: Arregla horarios y genera time slots
-- ============================================================
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Copia TODO este archivo
-- 3. Pega y ejecuta
-- 4. ¡Listo! El chatbot funcionará
-- ============================================================

-- 1️⃣ Desactivar horarios de Domingo
UPDATE schedules SET is_active = false WHERE day_of_week = 0;

-- 2️⃣ Insertar horarios de Lunes a Viernes
-- (Solo si NO existen ya)
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
SELECT 
  d.id,
  dia,
  '09:00'::TIME,
  '17:00'::TIME,
  30,
  true
FROM doctors d
CROSS JOIN generate_series(1, 5) as dia
WHERE d.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM schedules s 
    WHERE s.doctor_id = d.id 
    AND s.day_of_week = dia 
    AND s.is_active = true
  )
LIMIT 5;

-- 3️⃣ Generar time slots para cada horario
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM schedules WHERE is_active = true LOOP
    PERFORM generate_time_slots(rec.id, CURRENT_DATE, CURRENT_DATE + 30);
  END LOOP;
END $$;

-- 4️⃣ Verificar que funcionó
SELECT 
  '✅ Horarios activos' as tipo,
  COUNT(*) as cantidad
FROM schedules 
WHERE is_active = true

UNION ALL

SELECT 
  '✅ Time slots disponibles' as tipo,
  COUNT(*) as cantidad
FROM time_slots 
WHERE is_available = true 
  AND slot_date >= CURRENT_DATE;
