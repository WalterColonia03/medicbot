-- ============================================
-- DIAGNÓSTICO: Verificar zona horaria del servidor
-- ============================================

-- Ver zona horaria actual del servidor
SHOW timezone;

-- Ver hora actual en diferentes zonas horarias
SELECT
    NOW() as server_now,
    NOW() AT TIME ZONE 'UTC' as utc_now,
    NOW() AT TIME ZONE 'America/Lima' as lima_now,
    CURRENT_DATE as current_date,
    CURRENT_TIME as current_time;

-- Ver configuración de zona horaria
SELECT
    name,
    setting,
    short_desc
FROM pg_settings
WHERE name LIKE '%timezone%';

-- ============================================
-- FIN DEL DIAGNÓSTICO
-- ============================================
