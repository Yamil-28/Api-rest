-- PLANTILLA; solo ejecutar tras comprobar identidad, rol y vinculacion autorizados.
-- NO pega en Git correos reales ni ID ajenos. No autoasignar privilegios.
-- 1. Solo lectura: comprobar columnas (ejecutar por separado si hace falta).
SELECT column_name,data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='usuarios'
ORDER BY ordinal_position;
-- 2. Usuario Auth de prueba (verifica el UUID en Authentication > Users).
-- SELECT id, email, email_confirmed_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
-- 3. Vincular SOLO el registro de negocio que corresponda al usuario creado:
-- UPDATE public.usuarios SET auth_user_id = 'UUID_VALIDADO'
-- WHERE id = ID_VALIDADO AND auth_user_id IS NULL;
-- 4. Verifica su perfil autorizado; p.ej. comprador:
-- SELECT id, usuario_id FROM public.compradores WHERE usuario_id=ID_VALIDADO;
-- Si no existe un perfil, registrarlo por el procedimiento normal del sistema.
