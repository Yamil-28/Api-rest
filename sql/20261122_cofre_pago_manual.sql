-- Ejecutar DESPUES de 20261122_cofre_integracion.sql y SOLO tras respaldo/revision.
-- No confirma dinero automáticamente. Requiere un revisor del banco autorizado.
BEGIN;
CREATE TABLE IF NOT EXISTS public.cofre_payment_reviewers (
  usuario_id bigint PRIMARY KEY REFERENCES public.usuarios(id),
  habilitado_desde timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.cofre_manual_payment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id bigint NOT NULL REFERENCES public.cofre_charges(id),
  usuario_id bigint NOT NULL REFERENCES public.usuarios(id),
  referencia text NOT NULL CHECK (char_length(referencia) BETWEEN 4 AND 100),
  estado text NOT NULL DEFAULT 'REPORTADO' CHECK (estado IN ('REPORTADO','CONFIRMADO','RECHAZADO')),
  reportado_en timestamptz NOT NULL DEFAULT now(),
  revisor_usuario_id bigint REFERENCES public.usuarios(id),
  revisado_en timestamptz,
  observacion text
);
-- A lo sumo un reporte abierto por cargo y evita reutilizar referencias ya aceptadas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cofre_reporte_abierto
ON public.cofre_manual_payment_reports(cargo_id) WHERE estado='REPORTADO';
CREATE UNIQUE INDEX IF NOT EXISTS idx_cofre_referencia_confirmada
ON public.cofre_manual_payment_reports(lower(referencia)) WHERE estado='CONFIRMADO';
CREATE INDEX IF NOT EXISTS idx_cofre_reportes_estado_fecha ON public.cofre_manual_payment_reports(estado,reportado_en DESC);
ALTER TABLE public.cofre_payment_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cofre_manual_payment_reports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.cofre_confirmar_pago_manual(
  p_reporte_id uuid, p_revisor_usuario_id bigint, p_monto_verificado_centavos integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  r public.cofre_manual_payment_reports%ROWTYPE;
  c public.cofre_charges%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cofre_payment_reviewers WHERE usuario_id=p_revisor_usuario_id) THEN
    RAISE EXCEPTION 'REVISOR_NO_AUTORIZADO';
  END IF;
  SELECT * INTO r FROM public.cofre_manual_payment_reports WHERE id=p_reporte_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT * INTO c FROM public.cofre_charges WHERE id=r.cargo_id FOR UPDATE;
  IF NOT FOUND OR c.monto_centavos IS DISTINCT FROM p_monto_verificado_centavos THEN RETURN false; END IF;
  IF r.estado='CONFIRMADO' AND c.estado='PAGADO' THEN RETURN true; END IF;
  IF r.estado<>'REPORTADO' OR c.estado<>'PENDIENTE' THEN RETURN false; END IF;
  -- El operador tiene que haber contrastado destinatario, referencia e importe
  -- en el portal bancario; esta función NO consulta automáticamente al banco.
  UPDATE public.cofre_charges SET estado='PAGADO',paid_at=now() WHERE id=c.id;
  UPDATE public.cofre_manual_payment_reports SET estado='CONFIRMADO',revisor_usuario_id=p_revisor_usuario_id,
    revisado_en=now() WHERE id=r.id;
  RETURN true;
END;$$;

CREATE OR REPLACE FUNCTION public.cofre_rechazar_pago_manual(
  p_reporte_id uuid, p_revisor_usuario_id bigint, p_motivo text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  r public.cofre_manual_payment_reports%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cofre_payment_reviewers WHERE usuario_id=p_revisor_usuario_id) THEN
    RAISE EXCEPTION 'REVISOR_NO_AUTORIZADO';
  END IF;
  SELECT * INTO r FROM public.cofre_manual_payment_reports WHERE id=p_reporte_id FOR UPDATE;
  IF NOT FOUND OR r.estado<>'REPORTADO' THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cofre_charges WHERE id=r.cargo_id AND estado='PENDIENTE') THEN RETURN false; END IF;
  UPDATE public.cofre_manual_payment_reports SET estado='RECHAZADO',revisor_usuario_id=p_revisor_usuario_id,
    revisado_en=now(),observacion=left(p_motivo,500) WHERE id=r.id;
  RETURN true;
END;$$;
REVOKE ALL ON FUNCTION public.cofre_confirmar_pago_manual(uuid,bigint,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.cofre_rechazar_pago_manual(uuid,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cofre_confirmar_pago_manual(uuid,bigint,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cofre_rechazar_pago_manual(uuid,bigint,text) TO service_role;
CREATE OR REPLACE FUNCTION public.cofre_consumir_recojo(
  p_token_hash text, p_staff_usuario_id bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.cofre_pickup_tokens%ROWTYPE;
  pkg public.paquetes%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cofre_staff WHERE usuario_id=p_staff_usuario_id) THEN
    RAISE EXCEPTION 'PERSONAL_NO_AUTORIZADO';
  END IF;
  SELECT * INTO t FROM public.cofre_pickup_tokens WHERE token_hash=p_token_hash FOR UPDATE;
  IF NOT FOUND OR t.used_at IS NOT NULL OR t.expires_at < now() THEN RAISE EXCEPTION 'CODIGO_INVALIDO'; END IF;
  SELECT * INTO pkg FROM public.paquetes WHERE id=t.paquete_id FOR UPDATE;
  IF NOT FOUND OR pkg.estado <> 'PENDIENTE_RETIRO' THEN RAISE EXCEPTION 'PAQUETE_NO_DISPONIBLE'; END IF;
  IF EXISTS(SELECT 1 FROM public.cofre_charges WHERE paquete_id=t.paquete_id AND estado <> 'PAGADO') THEN
    RAISE EXCEPTION 'PAGO_PENDIENTE';
  END IF;
  UPDATE public.cofre_pickup_tokens SET used_at=now() WHERE id=t.id;
  UPDATE public.paquetes SET estado='ENTREGADO' WHERE id=t.paquete_id;
  INSERT INTO public.cofre_pickup_events(paquete_id,entregado_por) VALUES (t.paquete_id,p_staff_usuario_id);
  RETURN jsonb_build_object('ok',true,'paqueteId',t.paquete_id,'estado','ENTREGADO');
END;$$;
REVOKE ALL ON FUNCTION public.cofre_consumir_recojo(text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cofre_consumir_recojo(text,bigint) TO service_role;
COMMIT;

-- Asignar SOLO A REVISOR REAL de cobros (no basta con ser empleado de retiro):
-- INSERT INTO public.cofre_payment_reviewers(usuario_id) VALUES (<id_usuario_responsable>);
