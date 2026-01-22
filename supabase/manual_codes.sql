-- SCRIPT PARA GENERAR CODIGOS MANUALMENTE (Ejecutar en Supabase SQL Editor)

-- 1. Inserta la empresa y obtiene los codigos generados automaticamente
-- Cambia los datos entre comillas simples por los reales de tu cliente
select register_company_and_get_codes(
  'Cliente Demo Reunião',  -- Nombre de la empresa
  'cliente@demo.com',      -- Email de contacto
  'Juan Perez'             -- Nombre de contacto
);

-- El resultado será un JSON parecido a esto:
-- {
--   "company_id": "uuid-...", 
--   "commercial_code": "X7K9P2", 
--   "technical_code": "M3N5Q8"
-- }

-- Copia esos códigos (commercial_code y technical_code) y dáselos a tu cliente.
