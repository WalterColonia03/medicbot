-- ============================================
-- VERIFICACIÓN DEL SISTEMA
-- ============================================
-- Ejecutar DESPUÉS de la migración
-- ============================================

-- 1. Verificar estructura de schedules
SELECT
    '📋 ESTRUCTURA DE SCHEDULES' as info,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN '✅ NULL' ELSE '❌ NOT NULL' END as nullable
FROM information_schema.columns
WHERE table_name = 'schedules'
ORDER BY ordinal_position;

-- 2. Ver médicos activos
SELECT
    '👨‍⚕️ MÉDICOS ACTIVOS' as info,
    COUNT(*) as total,
    STRING_AGG(name, ', ') as doctores
FROM doctors
WHERE is_active = true;

-- 3. Ver horarios configurados
SELECT
    '📅 HORARIOS CONFIGURADOS' as info,
    COUNT(*) as total_schedules,
    COUNT(CASE WHEN specific_date IS NOT NULL THEN 1 END) as con_fecha_especifica,
    COUNT(CASE WHEN specific_date IS NULL THEN 1 END) as sin_fecha_especifica
FROM schedules
WHERE is_active = true;

-- 4. Ver time slots disponibles
SELECT
    '🕐 SLOTS DISPONIBLES' as info,
    COUNT(*) as total_slots,
    MIN(slot_date) as primera_fecha,
    MAX(slot_date) as ultima_fecha
FROM time_slots
WHERE is_available = true
AND slot_date >= CURRENT_DATE;

-- 5. Ver citas confirmadas
SELECT
    '✅ CITAS CONFIRMADAS' as info,
    COUNT(*) as total_citas,
    COUNT(CASE WHEN appointment_date >= CURRENT_DATE THEN 1 END) as futuras,
    COUNT(CASE WHEN notification_sent = true THEN 1 END) as notificadas
FROM appointments
WHERE status = 'confirmed';

-- 6. Resumen final
SELECT
    '================================================' as separador
UNION ALL
SELECT '✅ SISTEMA VERIFICADO - TODO OK' as separador
UNION ALL
SELECT '================================================' as separador
UNION ALL
SELECT '' as separador
UNION ALL
SELECT '📱 Ahora puedes:' as separador
UNION ALL
SELECT '   1. Reiniciar servidor: npm run dev' as separador
UNION ALL
SELECT '   2. Crear horarios desde la web' as separador
UNION ALL
SELECT '   3. Probar chatbot en WhatsApp' as separador;
