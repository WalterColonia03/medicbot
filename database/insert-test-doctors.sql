-- Script para insertar médicos de prueba
-- Ejecutar en Supabase SQL Editor

-- Insertar médicos de prueba
INSERT INTO doctors (name, specialty, phone, email, is_active)
VALUES 
  ('Dr. Juan Pérez', 'Medicina General', '+1234567890', 'juan.perez@example.com', true),
  ('Dra. María González', 'Pediatría', '+1234567891', 'maria.gonzalez@example.com', true),
  ('Dr. Carlos Rodríguez', 'Cardiología', '+1234567892', 'carlos.rodriguez@example.com', true)
ON CONFLICT (email) DO NOTHING;

-- Verificar que se insertaron
SELECT * FROM doctors;
