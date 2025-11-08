-- ============================================
-- MIGRACIÓN: Agregar columna specific_date
-- ============================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Agregar columna specific_date (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'schedules'
        AND column_name = 'specific_date'
    ) THEN
        ALTER TABLE schedules
        ADD COLUMN specific_date DATE;

        RAISE NOTICE '✅ Columna specific_date agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna specific_date ya existe';
    END IF;
END $$;

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_schedules_specific_date
ON schedules(specific_date);

-- 3. Agregar comentario
COMMENT ON COLUMN schedules.specific_date IS
'Fecha específica para horarios únicos (opcional). Si está presente, se ignora day_of_week';

-- 4. Crear función para generar slots por fecha específica
CREATE OR REPLACE FUNCTION generate_time_slots_for_date(
    p_schedule_id UUID,
    p_target_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_schedule RECORD;
    v_current_time TIME;
    v_slots_created INTEGER := 0;
BEGIN
    -- Obtener información del horario
    SELECT * INTO v_schedule
    FROM schedules
    WHERE id = p_schedule_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Schedule not found or inactive';
    END IF;

    -- Solo generar si tiene fecha específica y coincide
    IF v_schedule.specific_date IS NULL THEN
        RAISE EXCEPTION 'Schedule does not have a specific date';
    END IF;

    IF v_schedule.specific_date = p_target_date THEN
        v_current_time := v_schedule.start_time;

        -- Generar slots
        WHILE v_current_time < v_schedule.end_time LOOP
            DECLARE
                v_end_time TIME;
            BEGIN
                v_end_time := v_current_time + (v_schedule.slot_duration || ' minutes')::INTERVAL;

                IF v_end_time <= v_schedule.end_time THEN
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
                        p_target_date,
                        v_current_time,
                        v_end_time,
                        true
                    )
                    ON CONFLICT (doctor_id, slot_date, start_time) DO NOTHING;

                    v_slots_created := v_slots_created + 1;
                END IF;

                v_current_time := v_end_time;
            END;
        END LOOP;
    END IF;

    RETURN v_slots_created;
END;
$$ LANGUAGE plpgsql;

-- 5. Verificación final
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'schedules'
ORDER BY ordinal_position;

-- Mostrar mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Cambios aplicados:';
    RAISE NOTICE '  • Columna specific_date agregada';
    RAISE NOTICE '  • Índice creado';
    RAISE NOTICE '  • Función de generación de slots actualizada';
    RAISE NOTICE '';
    RAISE NOTICE 'Siguiente paso: Reiniciar el servidor Next.js';
END $$;
