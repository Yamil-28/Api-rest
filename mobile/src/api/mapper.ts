import type { Aviso, Paquete, PaquetesResponse, AvisosResponse } from '../domain/models';
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
