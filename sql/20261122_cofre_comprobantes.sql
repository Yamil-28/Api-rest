-- TERCERA migracion. Ejecutar despues de 20261122_cofre_integracion.sql
-- y 20261122_cofre_pago_manual.sql. Revisar en SUPABASE DE PRUEBAS antes de produccion.
BEGIN;
ALTER TABLE public.cofre_manual_payment_reports
  ALTER COLUMN referencia DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS comprobante_path text,
  ADD COLUMN IF NOT EXISTS comprobante_mime text,
  ADD COLUMN IF NOT EXISTS comprobante_nombre text,
  ADD COLUMN IF NOT EXISTS comprobante_bytes integer,
  ADD COLUMN IF NOT EXISTS comprobante_sha256 text;

-- Solo recibimos JPG, PNG, WebP, PDF por endpoint protegido (firma binaria verificada en NestJS).
-- Nunca crear bucket publico; el backend administra los objetos con service_role.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cofre-comprobantes', 'cofre-comprobantes', false, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Confirmacion atomica, obligando a que exista archivo y monto contrastado con banco.
CREATE OR REPLACE FUNCTION public.cofre_confirmar_pago_manual(
  p_reporte_id uuid, p_revisor_usuario_id bigint, p_monto_verificado_centavos integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  r public.cofre_manual_payment_reports%ROWTYPE;
  c public.cofre_charges%ROWTYPE;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.cofre_payment_reviewers WHERE usuario_id=p_revisor_usuario_id) THEN
    RAISE EXCEPTION 'REVISOR_NO_AUTORIZADO';
  END IF;
  SELECT * INTO r FROM public.cofre_manual_payment_reports WHERE id=p_reporte_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT * INTO c FROM public.cofre_charges WHERE id=r.cargo_id FOR UPDATE;
  IF NOT FOUND OR c.monto_centavos IS DISTINCT FROM p_monto_verificado_centavos THEN RETURN false; END IF;
  IF r.estado='CONFIRMADO' AND c.estado='PAGADO' THEN RETURN true; END IF;
  IF r.estado<>'REPORTADO' OR c.estado<>'PENDIENTE' OR r.comprobante_path IS NULL THEN RETURN false; END IF;
  -- La funcion no comprueba pagos bancarios: el revisor debe verificarlos ANTES.
  UPDATE public.cofre_charges SET estado='PAGADO',paid_at=now() WHERE id=c.id;
  UPDATE public.cofre_manual_payment_reports SET estado='CONFIRMADO',
    revisor_usuario_id=p_revisor_usuario_id,revisado_en=now() WHERE id=r.id;
  RETURN true;
END;$$;
REVOKE ALL ON FUNCTION public.cofre_confirmar_pago_manual(uuid,bigint,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cofre_confirmar_pago_manual(uuid,bigint,integer) TO service_role;

-- Correccion importante: prohibir la entrega si NO EXISTE cargo pagado.
-- Evita la version previa que solo comprobaba cargos pendientes pero no cargos ausentes.
CREATE OR REPLACE FUNCTION public.cofre_consumir_recojo(
  p_token_hash text, p_staff_usuario_id bigint
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  t public.cofre_pickup_tokens%ROWTYPE;
  pkg public.paquetes%ROWTYPE;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.cofre_staff WHERE usuario_id=p_staff_usuario_id) THEN
    RAISE EXCEPTION 'PERSONAL_NO_AUTORIZADO';
  END IF;
  SELECT * INTO t FROM public.cofre_pickup_tokens WHERE token_hash=p_token_hash FOR UPDATE;
  IF NOT FOUND OR t.used_at IS NOT NULL OR t.expires_at <= now() THEN RAISE EXCEPTION 'CODIGO_INVALIDO'; END IF;
  SELECT * INTO pkg FROM public.paquetes WHERE id=t.paquete_id FOR UPDATE;
  IF NOT FOUND OR pkg.estado <> 'PENDIENTE_RETIRO' THEN RAISE EXCEPTION 'PAQUETE_NO_DISPONIBLE'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.cofre_charges WHERE paquete_id=t.paquete_id AND estado='PAGADO') THEN
    RAISE EXCEPTION 'PAGO_PENDIENTE';
  END IF;
  UPDATE public.cofre_pickup_tokens SET used_at=now() WHERE id=t.id;
  UPDATE public.paquetes SET estado='ENTREGADO' WHERE id=t.paquete_id;
  INSERT INTO public.cofre_pickup_events(paquete_id,entregado_por)
    VALUES(t.paquete_id,p_staff_usuario_id);
  RETURN jsonb_build_object('ok',true,'paqueteId',t.paquete_id,'estado','ENTREGADO');
END;$$;
REVOKE ALL ON FUNCTION public.cofre_consumir_recojo(text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cofre_consumir_recojo(text,bigint) TO service_role;
COMMIT;

-- El backend firma enlaces temporales para revisores. No crear politicas publicas
-- para el bucket ni entregar la secret key a Expo.
