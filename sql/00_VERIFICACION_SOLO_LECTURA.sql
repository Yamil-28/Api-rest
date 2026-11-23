-- Ejecutar en Supabase de PRUEBAS antes de insertar usuarios o importar datos.
SELECT current_database() AS database_name,
       to_regclass('public.usuarios') AS usuarios,
       to_regclass('public.compradores') AS compradores,
       to_regclass('public.comerciantes') AS comerciantes,
       to_regclass('public.paquetes') AS paquetes;

SELECT table_name,column_name,data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('usuarios','compradores','comerciantes','paquetes')
ORDER BY table_name,ordinal_position;

SELECT tablename,rowsecurity FROM pg_tables
WHERE schemaname='public' AND tablename LIKE 'cofre_%'
ORDER BY tablename;

SELECT id,public,file_size_limit,allowed_mime_types
FROM storage.buckets WHERE id='cofre-comprobantes';
