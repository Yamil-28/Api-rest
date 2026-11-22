import { BaseRepository } from './repository';
import { settings } from '../config/env';
import type { AvisosResponse, PaquetesResponse, Rol, Pago, Entrega } from '../domain/models';
import { mapPaquetes, mapAvisos } from './mapper';
import { getToken } from '../auth/supabase';
import type { DocumentPickerAsset } from 'expo-document-picker';

export class ApiHttpError extends Error {constructor(public status:number,message:string){super(message);this.name='ApiHttpError';}}
export async function cofreRequest(route:string,method:'GET'|'POST'='GET',payload?:unknown):Promise<unknown>{
 const token=await getToken();
 if(!token)throw new ApiHttpError(401,'La sesión venció. Vuelve a iniciar sesión.');
 let response:Response;
 try{response=await fetch(`${settings.apiBaseUrl}${route}`,{method,headers:{Accept:'application/json',Authorization:`Bearer ${token}`,...(payload!==undefined?{'Content-Type':'application/json'}:{})},body:payload===undefined?undefined:JSON.stringify(payload)});}
 catch{throw new Error('No se pudo conectar al backend de Render.');}
 const raw=await response.text();let data:unknown;
 try{data=raw?JSON.parse(raw):null;}catch{throw new Error('La API no devolvió JSON. Revisa los logs de Render.');}
 if(!response.ok){const e=data&&typeof data==='object'?data as Record<string,unknown>:{};throw new ApiHttpError(response.status,typeof e.message==='string'?e.message:`HTTP ${response.status}`);}
 return data;
}
export async function generarQRPago(cargoId:number){return await cofreRequest(`/cofre/pagos/${cargoId}/qr`,'POST') as {cargoId:number;referencia:string;qr_imagen:string;expira:string;estado:string};}
export async function reportarPagoManual(cargoId:number,referencia:string){
 return await cofreRequest(`/cofre/pagos/${cargoId}/manual`,'POST',{referencia}) as {reporteId:string;cargoId:number;estado:'EN_REVISION'};
}

export interface ReportePago {
  reporteId: string;
  cargoId: number;
  paqueteId: number;
  montoBolivianos: number;
  cargoEstado: string;
  referencia: string | null;
  usuarioId: number;
  fecha: string;
  estado: 'REPORTADO';
  tieneComprobante: boolean;
  tipoComprobante: string | null;
}

/** Subida multipart: nunca configurar Content-Type manualmente; fetch genera el boundary. */
export async function enviarComprobante(cargoId:number, referencia:string, archivo:DocumentPickerAsset) {
  const token = await getToken();
  if (!token) throw new ApiHttpError(401,'Inicia sesion para enviar el comprobante');
  const form = new FormData();
  form.append('referencia', referencia);
  const extension = archivo.name.split('.').pop()?.toLowerCase() || '';
  const mime = archivo.mimeType && archivo.mimeType !== 'application/octet-stream'
    ? archivo.mimeType
    : extension==='pdf' ? 'application/pdf' : extension==='png' ? 'image/png'
    : extension==='webp' ? 'image/webp' : 'image/jpeg';
  if (archivo.file) {
    form.append('comprobante',archivo.file,archivo.name);
  } else {
    // FormData de React Native acepta {uri, name, type} en Android/iOS.
    form.append('comprobante',{uri:archivo.uri,name:archivo.name,type:mime} as unknown as Blob);
  }
  let response:Response;
  try { response=await fetch(`${settings.apiBaseUrl}/cofre/pagos/${cargoId}/comprobante`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},body:form,
  }); }
  catch { throw new Error('No se pudo enviar el archivo. Revisa Internet y Render.'); }
  let data:unknown;
  try { data=await response.json(); } catch { throw new Error('Respuesta no valida del servidor de pagos'); }
  if (!response.ok) {
    const message=data && typeof data==='object' && 'message' in data ? (data as {message:unknown}).message : null;
    throw new ApiHttpError(response.status,typeof message==='string'?message:`Error HTTP ${response.status}`);
  }
  return data as {reporteId:string;cargoId:number;estado:'EN_REVISION';comprobanteRecibido:true};
}
export async function obtenerReportesPendientes():Promise<ReportePago[]> {
  return await cofreRequest('/cofre/pagos/manual/pendientes') as ReportePago[];
}
export async function enlaceComprobante(reporteId:string) {
  return await cofreRequest(`/cofre/pagos/manual/${encodeURIComponent(reporteId)}/comprobante`) as
    {url:string;expiraEnSegundos:number;nombre:string;mime:string;bytes:number};
}
export async function aprobarReporteBancario(reporteId:string,montoVerificadoCentavos:number) {
  return await cofreRequest(`/cofre/pagos/manual/${encodeURIComponent(reporteId)}/aprobar`,'POST',{montoVerificadoCentavos});
}
export async function rechazarReporteBancario(reporteId:string,motivo:string) {
  return await cofreRequest(`/cofre/pagos/manual/${encodeURIComponent(reporteId)}/rechazar`,'POST',{motivo});
}

export async function emitirQRRecojo(paqueteId:number){return await cofreRequest(`/cofre/recojo/${paqueteId}`,'POST') as {paqueteId:number;codigo:string;qr_texto:string;expira:string};}
export class HttpRepository extends BaseRepository {
 async listarPaquetes(rol:Rol,_perfilId:number,estado?:string):Promise<PaquetesResponse>{return mapPaquetes(await cofreRequest(`/cofre/paquetes?rol=${rol}${estado?`&estado=${encodeURIComponent(estado)}`:''}`));}
 async listarAvisos(rol:Rol,_perfilId:number):Promise<AvisosResponse>{return mapAvisos(await cofreRequest(`/cofre/avisos?rol=${rol}`));}
 async listarPagos(_perfilId:number):Promise<Pago[]>{const rows=await cofreRequest('/cofre/pagos');return Array.isArray(rows)?rows as Pago[]:[];}
 async listarEntregas(_perfilId:number):Promise<Entrega[]>{const rows=await cofreRequest('/cofre/historial');return Array.isArray(rows)?rows as Entrega[]:[];}
}
