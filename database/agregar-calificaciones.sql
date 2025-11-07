-- ================================================
-- AGREGAR SISTEMA DE CALIFICACIÓN POST-CITA
-- ================================================

-- Crear tabla para calificaciones
CREATE TABLE IF NOT EXISTS appointment_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_appointment_ratings_appointment_id
ON appointment_ratings(appointment_id);

-- Agregar columna para controlar si se envió la solicitud de calificación
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS rating_requested BOOLEAN DEFAULT FALSE;

-- Agregar columna para controlar si ya se calificó
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS rated BOOLEAN DEFAULT FALSE;

-- Actualizar registros existentes
UPDATE appointments
SET rating_requested = FALSE, rated = FALSE
WHERE rating_requested IS NULL OR rated IS NULL;

-- Verificar la estructura
SELECT
  'Tabla appointment_ratings creada' as status,
  COUNT(*) as registros_existentes
FROM appointment_ratings;

SELECT
  'Columna rating_requested agregada' as columna,
  COUNT(*) as registros_actualizados
FROM appointments
WHERE rating_requested IS NOT NULL;
