-- ============================================
-- DIAGNÓSTICO: Verificar fechas y horas en slots generados
-- ============================================

-- Ver slots generados recientemente
SELECT
    ts.id,
    ts.slot_date,
    ts.start_time,
    ts.end_time,
    ts.is_available,
    d.name as doctor_name,
    s.specific_date,
    s.start_time as schedule_start,
    s.end_time as schedule_end
FROM time_slots ts
JOIN schedules s ON ts.schedule_id = s.id
JOIN doctors d ON ts.doctor_id = d.id
WHERE ts.created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY ts.slot_date DESC, ts.start_time;

-- Ver schedules con fechas específicas
SELECT
    s.id,
    s.specific_date,
    s.start_time,
    s.end_time,
    s.slot_duration,
    s.is_active,
    d.name as doctor_name
FROM schedules s
JOIN doctors d ON s.doctor_id = d.id
WHERE s.specific_date IS NOT NULL
ORDER BY s.specific_date DESC;

-- ============================================
-- FIN DEL DIAGNÓSTICO
-- ============================================
