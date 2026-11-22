import type { Aviso, Paquete, PaquetesResponse, AvisosResponse, Pago, } from '../domain/models';
/** Adaptador anti-corruption: traduce JSON de NestJS sin llevar datos mock a produccion. */
export function mapPaquetes(payload: unknown): PaquetesResponse {
  const data = (payload && typeof payload === 'object') ? payload as Record<string,unknown> : {};
  const rows = Array.isArray(payload) ? payload : Array.isArray(data.paquetes) ? data.paquetes : [];
  const paquetes = rows.filter((p):p is Record<string,unknown>=>!!p && typeof p==='object').map((p):Paquete=>({
    id:Number(p.id), comprador_id:Number(p.comprador_id), comerciante_id:Number(p.comerciante_id),
    codigo_interno:String(p.codigo_interno||`PK-${p.id}`), numero_seguimiento:String(p.numero_seguimiento||''),
    descripcion:String(p.descripcion||'Paquete sin descripción'), fecha_recepcion:String(p.fecha_recepcion||''), estado:String(p.estado||'RECIBIDO'),
    ...(typeof p.monto==='number'?{monto:p.monto}:{}),
    ...(typeof p.sucursal==='string'?{sucursal:p.sucursal}:{}),
    ...(typeof p.codigo_recojo==='string'?{codigo_recojo:p.codigo_recojo}:{}),
  }));
  return { total:Number(data.total??paquetes.length), paquetes };
}
export function mapAvisos(payload: unknown): AvisosResponse {
  const data=(payload && typeof payload==='object') ? payload as Record<string,unknown> : {};
  const rows=Array.isArray(payload)?payload:Array.isArray(data.avisos)?data.avisos:[];
  const avisos = rows.filter((a):a is Record<string,unknown>=>!!a && typeof a==='object').map((a):Aviso=>{
    const rawEstado=String(a.estado||'INFORMATIVO');
    const estado:Aviso['estado']=rawEstado==='OBSERVADO'||rawEstado==='CANCELADO'||rawEstado==='ALERTA'?'ALERTA':rawEstado==='PENDIENTE_RETIRO'||rawEstado==='ENTREGADO'||rawEstado==='POSITIVO'?'POSITIVO':'INFORMATIVO';
    return {
      id:String(a.id),
      paqueteId:a.paquete_id!=null?Number(a.paquete_id):a.paqueteId!=null?Number(a.paqueteId):undefined,
      titulo:String(a.titulo||'Actualización de paquete'),
      descripcion:String(a.mensaje||a.descripcion||''),
      fecha:String(a.fecha||''), estado,
    };
  });
  return {total:Number(data.total??avisos.length), avisos};
}
export function mapPagos(payload: unknown): Pago[] {
  if (!Array.isArray(payload)) {
    throw new Error('La API de pagos no devolvió una lista.');
  }

  return payload.map((valor): Pago => {
    if (!valor || typeof valor !== 'object') {
      throw new Error('La API devolvió un pago inválido.');
    }

    const pago = valor as Record<string, unknown>;
    const id = Number(pago.id);
    const paqueteId = Number(pago.paquete_id);

    const monto =
      typeof pago.monto === 'number'
        ? pago.monto
        : typeof pago.monto === 'string' &&
            pago.monto.trim() !== ''
          ? Number(pago.monto)
          : NaN;

    if (
      !Number.isSafeInteger(id) ||
      !Number.isSafeInteger(paqueteId) ||
      !Number.isFinite(monto)
    ) {
      throw new Error(
        'Un pago contiene identificadores o monto inválidos.',
      );
    }

    if (
      pago.estado !== 'PENDIENTE' &&
      pago.estado !== 'COMPLETADO'
    ) {
      throw new Error(
        `Estado de pago no reconocido: ${String(pago.estado)}`,
      );
    }

    const paquete =
      pago.paquetes &&
      typeof pago.paquetes === 'object' &&
      !Array.isArray(pago.paquetes)
        ? (pago.paquetes as Record<string, unknown>)
        : undefined;

    const codigo =
      typeof paquete?.codigo_interno === 'string'
        ? paquete.codigo_interno.trim()
        : '';

    const descripcion =
      typeof paquete?.descripcion === 'string'
        ? paquete.descripcion.trim()
        : '';

    const titulo = [
      codigo || `Paquete ${paqueteId}`,
      descripcion,
    ]
      .filter(Boolean)
      .join(' · ');

    return {
      id,
      paqueteId,
      titulo,
      monto,
      estado:
        pago.estado === 'COMPLETADO'
          ? 'PAGADO'
          : 'PENDIENTE',
      fecha: String(pago.fecha ?? ''),
    };
  });
}