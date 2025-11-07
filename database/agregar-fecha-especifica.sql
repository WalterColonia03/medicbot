-- ============================================
-- MIGRACIÓN: Agregar soporte para fechas específicas en schedules
-- ============================================

-- Agregar columna specific_date opcional a la tabla schedules
ALTER TABLE schedules ADD COLUMN specific_date DATE;

-- Crear índice para búsquedas por fecha específica
CREATE INDEX idx_schedules_specific_date ON schedules(specific_date);

-- Actualizar comentario de la tabla
COMMENT ON COLUMN schedules.specific_date IS 'Fecha específica para horarios únicos (opcional). Si está presente, se ignora day_of_week';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
