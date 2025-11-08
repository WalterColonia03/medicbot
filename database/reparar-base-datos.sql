-- ============================================
-- SCRIPT DE VERIFICACIÓN Y REPARACIÓN COMPLETA
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. VERIFICAR ESTRUCTURA DE TABLAS
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICANDO ESTRUCTURA DE BASE DE DATOS ===';
END $$;

-- Verificar columnas críticas
SELECT
  'Verificando tabla schedules...' as paso,
  COUNT(*) as total_schedules,
  COUNT(CASE WHEN specific_date IS NOT NULL THEN 1 END) as con_fecha_especifica
FROM schedules;

SELECT
  'Verificando tabla time_slots...' as paso,
  COUNT(*) as total_slots,
  COUNT(CASE WHEN is_available = true THEN 1 END) as slots_disponibles
FROM time_slots;

SELECT
  'Verificando tabla appointments...' as paso,
  COUNT(*) as total_citas,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmadas
FROM appointments;

-- 2. LIMPIAR DATOS INCONSISTENTES
DO $$
BEGIN
  RAISE NOTICE '=== LIMPIANDO DATOS INCONSISTENTES ===';

  -- Limpiar schedules sin fecha específica antiguos
  UPDATE schedules
  SET is_active = false
  WHERE specific_date IS NULL
    AND is_active = true;

  RAISE NOTICE 'Schedules sin fecha específica desactivados';

  -- Limpiar time_slots huérfanos (sin schedule)
  DELETE FROM time_slots
  WHERE schedule_id NOT IN (SELECT id FROM schedules);

  RAISE NOTICE 'Time slots huérfanos eliminados';
END $$;

-- 3. VERIFICAR FUNCIÓN DE GENERACIÓN DE SLOTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'generate_time_slots_for_date'
  ) THEN
    RAISE EXCEPTION 'FALTA LA FUNCIÓN generate_time_slots_for_date. Ejecuta el script de creación.';
  ELSE
    RAISE NOTICE '✓ Función generate_time_slots_for_date existe';
  END IF;
END $$;

-- 4. CREAR/ACTUALIZAR FUNCIÓN MEJORADA
CREATE OR REPLACE FUNCTION generate_time_slots_for_date(
  p_schedule_id UUID,
  p_target_date DATE
) RETURNS INTEGER AS $$
DECLARE
  v_schedule RECORD;
  v_current_time TIME;
  v_end_time TIME;
  v_slots_created INTEGER := 0;
  v_slot_start TIME;
  v_slot_end TIME;
BEGIN
  -- Obtener información del horario
  SELECT * INTO v_schedule
  FROM schedules
  WHERE id = p_schedule_id AND is_active = true;

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
      v_slot_end := v_current_time + (v_schedule.slot_duration || ' minutes')::INTERVAL;

      -- Verificar que el slot no exceda el horario de fin
      IF v_slot_end <= v_schedule.end_time THEN
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
          v_slot_end,
          true
        )
        ON CONFLICT (doctor_id, slot_date, start_time) DO NOTHING;

        v_slots_created := v_slots_created + 1;
      END IF;

      v_current_time := v_slot_end;
    END LOOP;
  END IF;

  RETURN v_slots_created;
END;
$$ LANGUAGE plpgsql;

-- 5. VERIFICAR TRIGGERS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'mark_slot_unavailable_on_appointment'
  ) THEN
    RAISE NOTICE '⚠ Creando trigger para marcar slots...';

    CREATE OR REPLACE FUNCTION mark_slot_unavailable() RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.time_slot_id IS NOT NULL THEN
        UPDATE time_slots
        SET is_available = false
        WHERE id = NEW.time_slot_id;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER mark_slot_unavailable_on_appointment
      AFTER INSERT ON appointments
      FOR EACH ROW
      EXECUTE FUNCTION mark_slot_unavailable();

    RAISE NOTICE '✓ Trigger creado';
  ELSE
    RAISE NOTICE '✓ Trigger mark_slot_unavailable_on_appointment existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'release_slot_on_appointment_cancel'
  ) THEN
    RAISE NOTICE '⚠ Creando trigger para liberar slots...';

    CREATE OR REPLACE FUNCTION release_slot_on_cancel() RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        IF NEW.time_slot_id IS NOT NULL THEN
          UPDATE time_slots
          SET is_available = true
          WHERE id = NEW.time_slot_id;
        END IF;
        NEW.cancelled_at = NOW();
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER release_slot_on_appointment_cancel
      BEFORE UPDATE ON appointments
      FOR EACH ROW
      EXECUTE FUNCTION release_slot_on_cancel();

    RAISE NOTICE '✓ Trigger creado';
  ELSE
    RAISE NOTICE '✓ Trigger release_slot_on_appointment_cancel existe';
  END IF;
END $$;

-- 6. REPORTE FINAL
SELECT
  '===========================================' as separador
UNION ALL
SELECT '=== REPORTE FINAL ===' as separador
UNION ALL
SELECT '===========================================' as separador;

SELECT
  'Doctores activos' as metrica,
  COUNT(*)::TEXT as valor
FROM doctors WHERE is_active = true
UNION ALL
SELECT
  'Schedules activos con fecha',
  COUNT(*)::TEXT
FROM schedules
WHERE is_active = true AND specific_date IS NOT NULL
UNION ALL
SELECT
  'Time slots disponibles (futuro)',
  COUNT(*)::TEXT
FROM time_slots
WHERE is_available = true
  AND slot_date >= CURRENT_DATE
UNION ALL
SELECT
  'Citas confirmadas (futuro)',
  COUNT(*)::TEXT
FROM appointments
WHERE status = 'confirmed'
  AND appointment_date >= CURRENT_DATE
UNION ALL
SELECT
  'Pacientes registrados',
  COUNT(*)::TEXT
FROM patients;

-- 7. VERIFICAR PRÓXIMAS FECHAS CON SLOTS
SELECT
  '===========================================' as separador
UNION ALL
SELECT 'Próximas fechas con slots disponibles:' as separador
UNION ALL
SELECT '===========================================' as separador;

SELECT
  slot_date::TEXT as fecha,
  COUNT(*)::TEXT as slots_disponibles,
  STRING_AGG(DISTINCT d.name, ', ') as doctores
FROM time_slots ts
JOIN doctors d ON ts.doctor_id = d.id
WHERE ts.is_available = true
  AND ts.slot_date >= CURRENT_DATE
GROUP BY slot_date
ORDER BY slot_date
LIMIT 10;

-- 8. MENSAJE FINAL
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✓ VERIFICACIÓN Y REPARACIÓN COMPLETADA';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Si no hay errores arriba, la base de datos está lista';
  RAISE NOTICE 'Ahora puedes crear schedules desde la interfaz web';
END $$;
