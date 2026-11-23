-- COFRE EXPRESS: SOLO BASE DE PRUEBAS. NO EJECUTAR EN PRODUCCION SIN REVISAR ESQUEMA.
-- Registro idempotente: solo el backend service_role puede llamar esta funcion.
-- El backend comprueba el JWT y el correo confirmado antes de suministrar el auth UUID.
-- Si public.usuarios/compradores exige otras columnas NOT NULL, se aborta sin crear registros parciales.
BEGIN;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS auth_user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cofre_usuarios_auth_id
  ON public.usuarios (auth_user_id) WHERE auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.cofre_auto_registrar_comprador(
  p_auth_id uuid, p_nombre text, p_correo text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id bigint;
  v_comprador_id bigint;
  v_new boolean := false;
  v_cols text := 'auth_user_id';
  v_vals text := '$1';
BEGIN
  IF p_auth_id IS NULL OR length(trim(coalesce(p_nombre, ''))) < 3
    OR length(trim(coalesce(p_correo, ''))) < 5 THEN
    RAISE EXCEPTION 'DATOS_REGISTRO_INVALIDOS';
  END IF;

  -- Serializa altas del mismo UUID para que sean idempotentes.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auth_id::text, 0));
  SELECT id INTO v_usuario_id FROM public.usuarios
    WHERE auth_user_id = p_auth_id FOR UPDATE;
  IF v_usuario_id IS NULL THEN
    -- Solo completa columnas reconocidas. Si otras son obligatorias, falla y revierte.
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='usuarios' AND column_name='nombre') THEN
      v_cols := v_cols || ', nombre'; v_vals := v_vals || ', $2';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='usuarios' AND column_name='nombre_completo') THEN
      v_cols := v_cols || ', nombre_completo'; v_vals := v_vals || ', $2';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='usuarios' AND column_name='nombres') THEN
      v_cols := v_cols || ', nombres'; v_vals := v_vals || ', $2';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='usuarios' AND column_name='email') THEN
      v_cols := v_cols || ', email'; v_vals := v_vals || ', $3';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='usuarios' AND column_name='correo') THEN
      v_cols := v_cols || ', correo'; v_vals := v_vals || ', $3';
    END IF;
    EXECUTE format('INSERT INTO public.usuarios (%s) VALUES (%s) RETURNING id', v_cols, v_vals)
      INTO v_usuario_id USING p_auth_id, left(trim(p_nombre), 100), lower(trim(p_correo));
    v_new := true;
  END IF;

  SELECT id INTO v_comprador_id FROM public.compradores
    WHERE usuario_id = v_usuario_id;
  IF v_comprador_id IS NULL THEN
    -- Nunca autoagregar comprador a una cuenta preexistente de comerciante/empleado/revisor.
    IF NOT v_new THEN RAISE EXCEPTION 'PERFIL_EXISTENTE_REQUIERE_REVISION'; END IF;
    INSERT INTO public.compradores (usuario_id)
      VALUES (v_usuario_id) RETURNING id INTO v_comprador_id;
  END IF;
  RETURN jsonb_build_object('usuarioId',v_usuario_id,'compradorId',v_comprador_id);
END;
$$;

REVOKE ALL ON FUNCTION public.cofre_auto_registrar_comprador(uuid,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cofre_auto_registrar_comprador(uuid,text,text)
  TO service_role;
COMMIT;

-- VERIFICACION (SOLO LECTURA):
-- SELECT p.proname,has_function_privilege('anon',p.oid,'EXECUTE') AS anon,
--   has_function_privilege('service_role',p.oid,'EXECUTE') AS servicio
-- FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
-- WHERE n.nspname='public' AND p.proname='cofre_auto_registrar_comprador';
