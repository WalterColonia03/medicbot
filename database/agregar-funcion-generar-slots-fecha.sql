-- Función: Generar slots de tiempo para una fecha específica
CREATE OR REPLACE FUNCTION generate_time_slots_for_date(
    p_schedule_id UUID,
    p_target_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_schedule RECORD;
    v_current_time TIME;
    v_end_time TIME;
    v_slots_created INTEGER := 0;
BEGIN
    -- Obtener información del horario
    SELECT * INTO v_schedule FROM schedules WHERE id = p_schedule_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Schedule not found or inactive';
    END IF;

    -- Verificar que el schedule tenga una fecha específica
    IF v_schedule.specific_date IS NULL THEN
        RAISE EXCEPTION 'Schedule does not have a specific date';
    END IF;

    -- Solo generar slots si la fecha del schedule coincide con la fecha objetivo
    IF v_schedule.specific_date = p_target_date THEN
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
                    p_target_date,
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

    RETURN v_slots_created;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIN DE LA FUNCIÓN
-- ============================================
