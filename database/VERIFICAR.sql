-- ============================================================
-- 🔍 VERIFICACIÓN: ¿Todo está correcto?
-- ============================================================
-- Ejecuta este script DESPUÉS de EJECUTA_ESTO.sql
-- para confirmar que todo funciona
-- ============================================================

-- 1. Ver horarios activos por día
SELECT 
  '📅 Horarios por día de semana' as info,
  CASE day_of_week
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
    WHEN 0 THEN 'Domingo'
  END as dia,
  start_time || ' - ' || end_time as horario,
  slot_duration || ' min' as duracion,
  d.name as doctor
FROM schedules s
JOIN doctors d ON s.doctor_id = d.id
WHERE s.is_active = true
ORDER BY s.day_of_week;

-- 2. Ver time slots de los próximos 7 días
SELECT 
  '🕐 Time slots próximos 7 días' as info,
  slot_date as fecha,
  TO_CHAR(slot_date, 'Day') as dia_semana,
  COUNT(*) as slots_disponibles
FROM time_slots
WHERE slot_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
  AND is_available = true
GROUP BY slot_date
ORDER BY slot_date;

-- 3. Ver slots de HOY (si hay)
SELECT 
  '📍 Slots disponibles HOY' as info,
  start_time,
  end_time,
  d.name as doctor
FROM time_slots ts
JOIN doctors d ON ts.doctor_id = d.id
WHERE slot_date = CURRENT_DATE
  AND is_available = true
ORDER BY start_time
LIMIT 10;

-- 4. Ver slots de MAÑANA
SELECT 
  '📍 Slots disponibles MAÑANA' as info,
  start_time,
  end_time,
  d.name as doctor
FROM time_slots ts
JOIN doctors d ON ts.doctor_id = d.id
WHERE slot_date = CURRENT_DATE + 1
  AND is_available = true
ORDER BY start_time
LIMIT 10;

-- 5. Resumen general
SELECT '📊 RESUMEN' as titulo;

SELECT 
  '✅ Doctores activos' as metrica,
  COUNT(*)::TEXT as valor
FROM doctors WHERE is_active = true
UNION ALL
SELECT 
  '✅ Horarios activos',
  COUNT(*)::TEXT
FROM schedules WHERE is_active = true
UNION ALL
SELECT 
  '✅ Time slots totales',
  COUNT(*)::TEXT
FROM time_slots
UNION ALL
SELECT 
  '✅ Slots disponibles (próximos 30 días)',
  COUNT(*)::TEXT
FROM time_slots 
WHERE is_available = true 
  AND slot_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30;

-- 6. ¿Qué fechas tienen slots?
SELECT 
  '📅 Fechas con slots disponibles' as info,
  slot_date,
  COUNT(*) as cantidad
FROM time_slots
WHERE is_available = true
GROUP BY slot_date
ORDER BY slot_date
LIMIT 15;
