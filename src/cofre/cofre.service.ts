import {
  BadGatewayException, BadRequestException, ConflictException, ForbiddenException,
  Injectable, InternalServerErrorException, NotFoundException, ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { validarComprobante, type ArchivoComprobante } from './comprobante.validation.js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CofreIdentity, RolCofre } from './cofre.types.js';
import { compareCents } from './cofre.types.js';

function requiredEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Falta variable de entorno ${key}`);
  return val;
}
function safeEqual(a: string, b: string): boolean {
  const aa = createHash('sha256').update(a).digest();
  const bb = createHash('sha256').update(b).digest();
  return timingSafeEqual(aa, bb);
}
function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
function cents(value: number) { return Math.round(value * 100); }
function safeMessage(err: { message?: string } | null, msg: string): never {
  if (err) throw new InternalServerErrorException(msg);
  throw new InternalServerErrorException(msg);
}
interface PackageRow { id: number; comprador_id: number; comerciante_id: number; estado: string; codigo_interno?: string; numero_seguimiento?: string; descripcion?: string }
interface Charge { id: number; paquete_id: number; pagador_rol: RolCofre; monto_centavos: number; estado: string }
interface Attempt { id: string; cargo_id: number; reference: string | null; qr_id: string | null; imagen_base64: string | null; estado: string; fecha_expira: string }

@Injectable()
export class CofreService {
  private readonly admin: SupabaseClient;
  private readonly publicAuth: SupabaseClient;
  private readonly wizPayBase = 'https://api.wizpay.app';
  constructor() {
    const url = requiredEnv('SUPABASE_URL');
    this.admin = createClient(url, requiredEnv('SUPABASE_SECRET_KEY'), {auth:{persistSession:false,autoRefreshToken:false}});
    this.publicAuth = createClient(url, requiredEnv('SUPABASE_PUBLISHABLE_KEY'), {auth:{persistSession:false,autoRefreshToken:false}});
  }
  async identify(jwt: string): Promise<CofreIdentity> {
    const {data:{user},error:authError} = await this.publicAuth.auth.getUser(jwt);
    if (authError || !user || !user.email) throw new UnauthorizedException('Token invalido o vencido');
    // El enlace a usuarios es EXPLICITO: no se asignan roles por correo ni por IDs enviados desde la app.
    const {data:usuario,error:userError} = await this.admin.from('usuarios').select('id,nombre').eq('auth_user_id',user.id).maybeSingle();
    if (userError) throw new InternalServerErrorException('No se pudo comprobar la identidad');
    if (!usuario) throw new ForbiddenException('Cuenta no vinculada al perfil de Cofre Express');
    const [{data:comprador,error:bc},{data:comerciante,error:cc},{data:staff,error:sc},{data:revisor,error:rc}] = await Promise.all([
      this.admin.from('compradores').select('id').eq('usuario_id',usuario.id).maybeSingle(),
      this.admin.from('comerciantes').select('id').eq('usuario_id',usuario.id).maybeSingle(),
      this.admin.from('cofre_staff').select('usuario_id').eq('usuario_id',usuario.id).maybeSingle(),
      this.admin.from('cofre_payment_reviewers').select('usuario_id').eq('usuario_id',usuario.id).maybeSingle(),
    ]);
    if (bc || cc || sc || rc) throw new InternalServerErrorException('No se pudieron comprobar los roles');
    if (!comprador && !comerciante && !staff && !revisor) throw new ForbiddenException('Usuario sin un perfil habilitado');
    return {authId:user.id,userId:usuario.id,email:user.email,nombre:String(usuario.nombre||''),compradorId:comprador?.id??null,comercianteId:comerciante?.id??null,staff:!!staff,revisor:!!revisor};
  }
  private profile(identity:CofreIdentity, rol?:RolCofre) {
    const selected = rol ?? (identity.compradorId ? 'comprador' : 'comerciante');
    const id=selected==='comprador' ? identity.compradorId : identity.comercianteId;
    if (!id) throw new ForbiddenException(`No tienes un perfil ${selected}`);
    return {rol:selected,id};
  }
  async packages(identity:CofreIdentity, rol?:RolCofre, estado?:string) {
    const profile=this.profile(identity,rol);
    let q=this.admin.from('paquetes').select('*').eq(profile.rol==='comprador'?'comprador_id':'comerciante_id',profile.id);
    if (estado?.trim()) q=q.eq('estado',estado.trim());
    const {data,error}=await q.order('id',{ascending:false});
    if (error) return safeMessage(error,'No se pudieron consultar los paquetes');
    return {total:data?.length??0,paquetes:data??[]};
  }
  async avisos(identity:CofreIdentity,rol?:RolCofre) {
    const {paquetes}=await this.packages(identity,rol);
    const notices=paquetes.map((p:PackageRow)=>({
      id:`estado-${p.id}-${p.estado}`,paquete_id:p.id,
      titulo:p.estado==='OBSERVADO'?'Paquete observado':p.estado==='PENDIENTE_RETIRO'?'Paquete listo para recoger':`Actualizacion de ${p.codigo_interno||'paquete'}`,
      mensaje:`Tu paquete ${p.codigo_interno||p.id} esta en estado ${p.estado}.`,estado:p.estado,
      fecha: new Date().toISOString(),
    }));
    return {total:notices.length,avisos:notices,origen:'estado_actual',notificaciones_persistidas:false};
  }
  private async ownedPackage(identity:CofreIdentity, paqueteId:number):Promise<PackageRow> {
    const {data,error}=await this.admin.from('paquetes').select('*').eq('id',paqueteId).maybeSingle();
    if(error) return safeMessage(error,'Error al consultar paquete');
    if(!data) throw new NotFoundException('Paquete inexistente');
    if (data.comprador_id!==identity.compradorId && data.comerciante_id!==identity.comercianteId) throw new ForbiddenException('El paquete no pertenece a tu perfil');
    return data as PackageRow;
  }
  private async chargeForOwner(identity:CofreIdentity,cargoId:number) {
    const {data,error}=await this.admin.from('cofre_charges').select('*').eq('id',cargoId).maybeSingle();
    if(error) return safeMessage(error,'Error consultando el cargo');
    if(!data) throw new NotFoundException('Cargo no encontrado');
    const charge=data as Charge;
    const paquete=await this.ownedPackage(identity,charge.paquete_id);
    if((charge.pagador_rol==='comprador' && paquete.comprador_id!==identity.compradorId) ||
       (charge.pagador_rol==='comerciante' && paquete.comerciante_id!==identity.comercianteId))
      throw new ForbiddenException('El cobro no corresponde a tu rol de pago');
    return charge;
  }
  async pagos(identity:CofreIdentity,rol?:RolCofre) {
    const {paquetes}=await this.packages(identity,rol);
    const ids=(paquetes as PackageRow[]).map(p=>p.id);
    if(!ids.length) return [];
    const {data,error}=await this.admin.from('cofre_charges').select('*').in('paquete_id',ids).order('id',{ascending:false});
    if(error) return safeMessage(error,'No se pudieron consultar los pagos');
    return (data||[]).map((r:Charge)=>({
      id:r.id,paqueteId:r.paquete_id,titulo:`Pago locker · Paquete #${r.paquete_id}`,
      monto:r.monto_centavos/100,estado:r.estado,pagador:r.pagador_rol,fecha:'',
    }));
  }
  private async wizGet(reference:string) {
    const response=await fetch(`${this.wizPayBase}/status/${encodeURIComponent(reference)}`,{signal:AbortSignal.timeout(12000)});
    if(!response.ok) throw new BadGatewayException('No se pudo confirmar el estado en la pasarela');
    return await response.json() as {status?:string;reference?:string;amount?:number;order_id?:string;payment_method?:string};
  }
  async generarQR(identity:CofreIdentity,cargoId:number) {
    const charge=await this.chargeForOwner(identity,cargoId);
    if (charge.estado==='PAGADO') throw new ConflictException('Este cargo ya esta pagado');
    const {data:existing,error:existingErr}=await this.admin.from('cofre_payment_attempts').select('*').eq('cargo_id',cargoId).eq('estado','PENDIENTE').gt('fecha_expira',new Date().toISOString()).order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(existingErr) return safeMessage(existingErr,'Error revisando el cobro');
    if(existing?.imagen_base64 && existing.reference) return {cargoId,referencia:existing.reference,qr_imagen:existing.imagen_base64,expira:existing.fecha_expira,estado:'PENDIENTE'};
    const key=process.env.WIZPAY_API_KEY;
    if(!key) throw new ServiceUnavailableException('Pagos QR deshabilitados: falta la cuenta y API key de la pasarela');
    const {data:attempt,error:createErr}=await this.admin.from('cofre_payment_attempts').insert({cargo_id:cargoId,monto_centavos:charge.monto_centavos,estado:'PENDIENTE'}).select('id').single();
    if(createErr || !attempt) return safeMessage(createErr,'Error al registrar intento de pago');
    // El importe lo define el backend a partir del cargo en DB; nunca la app.
    let response:Response;
    try {
      response=await fetch(`${this.wizPayBase}/qr/generate`,{
        method:'POST',headers:{'x-wpay-key':key,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),
        body:JSON.stringify({amount:charge.monto_centavos/100,id_currency:1,moneda:'BOB',order_id:attempt.id,name:`Cofre Express #${charge.paquete_id}`,description:`Servicio locker paquete ${charge.paquete_id}`}),
      });
    } catch {throw new BadGatewayException('No hay conexion con el proveedor QR');}
    if(!response.ok) throw new BadGatewayException('El proveedor no pudo generar el QR');
    const raw=await response.json() as {reference?:string;qr?:{imagen?:string;numero_referencia?:string|number;monto?:number;moneda?:string}};
    if(!raw.reference || !raw.qr?.imagen || !raw.qr?.numero_referencia || !compareCents(raw.qr.monto,charge.monto_centavos) || raw.qr.moneda!=='BOB')
      throw new BadGatewayException('Respuesta QR incompleta o monto diferente');
    const expiration=new Date(Date.now()+10*60_000).toISOString();
    const {error:saveErr}=await this.admin.from('cofre_payment_attempts').update({reference:raw.reference,qr_id:String(raw.qr.numero_referencia),imagen_base64:raw.qr.imagen,fecha_expira:expiration}).eq('id',attempt.id);
    if(saveErr) return safeMessage(saveErr,'No se pudo persistir la referencia del QR');
    return {cargoId,referencia:raw.reference,qr_imagen:raw.qr.imagen,expira:expiration,estado:'PENDIENTE'};
  }
  async estadoPago(identity:CofreIdentity,cargoId:number) {
    const charge=await this.chargeForOwner(identity,cargoId);
    return {cargoId,estado:charge.estado,monto:charge.monto_centavos/100};
  }
  /** El cliente solo reporta la referencia; NO confirma el cobro. */
  async reportarPagoManual(identity: CofreIdentity, cargoId: number, referenciaRaw: string) {
    const charge = await this.chargeForOwner(identity, cargoId);
    if (charge.estado !== 'PENDIENTE') throw new ConflictException('El cargo ya no está pendiente');
    const referencia = referenciaRaw.trim();
    if (!/^[a-zA-Z0-9][a-zA-Z0-9 ._\/-]{3,99}$/.test(referencia))
      throw new BadRequestException('La referencia bancaria no tiene un formato válido');
    const {data:old,error:oldError} = await this.admin.from('cofre_manual_payment_reports')
      .select('id').eq('cargo_id',cargoId).eq('estado','REPORTADO').maybeSingle();
    if (oldError) return safeMessage(oldError,'No se pudo comprobar el reporte anterior');
    if (old) return {reporteId:old.id,cargoId,estado:'EN_REVISION'};
    const {data,error} = await this.admin.from('cofre_manual_payment_reports')
      .insert({cargo_id:cargoId,usuario_id:identity.userId,referencia,estado:'REPORTADO'})
      .select('id').single();
    if (error || !data) return safeMessage(error,'No se pudo registrar la referencia bancaria');
    return {reporteId:data.id,cargoId,estado:'EN_REVISION'};
  }
  /** El cliente adjunta evidencia; el cargo permanece PENDIENTE hasta revision bancaria. */
  async subirComprobante(identity: CofreIdentity, cargoId: number, archivo: ArchivoComprobante | undefined, referenciaRaw: string) {
    const charge = await this.chargeForOwner(identity, cargoId);
    if (charge.estado !== 'PENDIENTE') throw new ConflictException('Este cargo no admite reportes de pago');
    let documento: ReturnType<typeof validarComprobante>;
    try { documento = validarComprobante(archivo); }
    catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'Comprobante invalido'); }
    if (typeof referenciaRaw !== 'string') throw new BadRequestException('Referencia invalida');
    const referencia = referenciaRaw.trim();
    if (referencia && !/^[a-zA-Z0-9][a-zA-Z0-9 ._\/-]{3,99}$/.test(referencia))
      throw new BadRequestException('La referencia bancaria tiene un formato invalido');

    const {data:old,error:oldError} = await this.admin.from('cofre_manual_payment_reports')
      .select('id,usuario_id,referencia,comprobante_path').eq('cargo_id', cargoId).eq('estado', 'REPORTADO').maybeSingle();
    if (oldError) return safeMessage(oldError, 'No se pudo consultar el reporte pendiente');
    if (old && old.usuario_id !== identity.userId) throw new ForbiddenException('Este reporte pertenece a otro usuario');
    if (old?.comprobante_path) throw new ConflictException('Ya existe un comprobante en revision para este cargo');

    const reporteId: string = old?.id || randomUUID();
    const ruta = `cargos/${cargoId}/${randomUUID()}.${documento.extension}`;
    const storage = this.admin.storage.from('cofre-comprobantes');
    const {error:uploadError} = await storage.upload(ruta, archivo!.buffer, {
      contentType: documento.mime, upsert: false, cacheControl: '0',
    });
    if (uploadError) throw new ServiceUnavailableException('No se pudo guardar el comprobante privado');
    const datos = {
      referencia: referencia || old?.referencia || null,
      comprobante_path: ruta,
      comprobante_mime: documento.mime,
      comprobante_nombre: documento.nombre,
      comprobante_bytes: archivo!.buffer.length,
      comprobante_sha256: createHash('sha256').update(archivo!.buffer).digest('hex'),
    };
    try {
      if (old) {
        // Adjunta al reporte anterior sin permitir sobrescribir documentos simultaneos.
        const {data,error} = await this.admin.from('cofre_manual_payment_reports')
          .update(datos).eq('id', reporteId).eq('estado', 'REPORTADO')
          .is('comprobante_path', null).select('id').maybeSingle();
        if (error || !data) throw new ConflictException('El reporte ya fue actualizado por otra solicitud');
      } else {
        const {error} = await this.admin.from('cofre_manual_payment_reports')
          .insert({id:reporteId, cargo_id:cargoId, usuario_id:identity.userId, estado:'REPORTADO', ...datos});
        if (error) throw new ConflictException('Ya hay un reporte pendiente o no se pudo registrar el comprobante');
      }
    } catch (error) {
      await storage.remove([ruta]); // Mejor esfuerzo para retirar objetos huerfanos.
      throw error;
    }
    return {reporteId, cargoId, estado:'EN_REVISION', comprobanteRecibido:true};
  }

  /** Enlace de 60 segundos, solo para revisores autorizados. Nunca URL publica permanente. */
  async enlaceComprobante(identity: CofreIdentity, reporteId: string) {
    await this.exigirRevisor(identity);
    if (!/^[0-9a-fA-F-]{36}$/.test(reporteId)) throw new BadRequestException('ID de reporte invalido');
    const {data, error} = await this.admin.from('cofre_manual_payment_reports')
      .select('comprobante_path,comprobante_mime,comprobante_nombre,comprobante_bytes')
      .eq('id', reporteId).maybeSingle();
    if (error) return safeMessage(error,'No se pudo consultar el comprobante');
    if (!data?.comprobante_path) throw new NotFoundException('El reporte no contiene comprobante');
    const {data:url, error:linkError} = await this.admin.storage.from('cofre-comprobantes')
      .createSignedUrl(data.comprobante_path, 60, {download:true});
    if (linkError || !url?.signedUrl) throw new ServiceUnavailableException('No se pudo crear el enlace temporal');
    return {url:url.signedUrl, expiraEnSegundos:60, nombre:data.comprobante_nombre, mime:data.comprobante_mime, bytes:data.comprobante_bytes};
  }

  private async exigirRevisor(identity: CofreIdentity) {
    const {data,error} = await this.admin.from('cofre_payment_reviewers').select('usuario_id')
      .eq('usuario_id',identity.userId).maybeSingle();
    if (error) return safeMessage(error,'No fue posible comprobar el rol de revisor');
    if (!data) throw new ForbiddenException('No tienes autorización para verificar pagos bancarios');
  }
  /** Revisión manual: mostrar referencias sin conceder estado PAGADO. */
  async reportesPendientes(identity: CofreIdentity) {
    await this.exigirRevisor(identity);
    const {data:reports,error:err} = await this.admin.from('cofre_manual_payment_reports')
      .select('id,cargo_id,usuario_id,referencia,reportado_en,comprobante_path,comprobante_mime').eq('estado','REPORTADO')
      .order('reportado_en',{ascending:true}).limit(100);
    if (err) return safeMessage(err,'No se pudieron cargar los reportes');
    if (!reports?.length) return [];
    const ids = [...new Set(reports.map(r => r.cargo_id))];
    const {data:charges,error:cerr} = await this.admin.from('cofre_charges')
      .select('id,paquete_id,monto_centavos,estado').in('id',ids);
    if (cerr) return safeMessage(cerr,'No se pudieron recuperar los importes');
    const byId = new Map((charges || []).map(c => [c.id,c]));
    return reports.map(r => ({
      reporteId:r.id,cargoId:r.cargo_id,paqueteId:byId.get(r.cargo_id)?.paquete_id,
      montoBolivianos:((byId.get(r.cargo_id)?.monto_centavos||0) / 100),
      cargoEstado:byId.get(r.cargo_id)?.estado,referencia:r.referencia,
      usuarioId:r.usuario_id,fecha:r.reportado_en,estado:'REPORTADO',
      tieneComprobante:!!r.comprobante_path,tipoComprobante:r.comprobante_mime,
    }));
  }
  /** Autorizar SOLO después de verificar en el portal bancario beneficiario, importe y referencia. */
  async aprobarPagoManual(identity: CofreIdentity, reporteId: string, montoVerificado: number) {
    await this.exigirRevisor(identity);
    if (!/^[0-9a-fA-F-]{36}$/.test(reporteId) || !Number.isSafeInteger(montoVerificado) || montoVerificado < 1)
      throw new BadRequestException('Reporte o importe inválidos');
    const {data,error}=await this.admin.rpc('cofre_confirmar_pago_manual',{
      p_reporte_id:reporteId,p_revisor_usuario_id:identity.userId,
      p_monto_verificado_centavos:montoVerificado,
    });
    if(error) return safeMessage(error,'No se pudo registrar la confirmación');
    if(!data) throw new ConflictException('El reporte ya no está pendiente o el importe no coincide');
    return {ok:true,estado:'PAGADO',reporteId};
  }
  async rechazarPagoManual(identity: CofreIdentity, reporteId: string, motivo: string) {
    await this.exigirRevisor(identity);
    if (!/^[0-9a-fA-F-]{36}$/.test(reporteId) || motivo.trim().length < 5)
      throw new BadRequestException('Indica el reporte y motivo del rechazo');
    const {data,error}=await this.admin.rpc('cofre_rechazar_pago_manual',{
      p_reporte_id:reporteId,p_revisor_usuario_id:identity.userId,p_motivo:motivo.trim(),
    });
    if(error) return safeMessage(error,'No se pudo rechazar el reporte');
    if(!data) throw new ConflictException('El reporte ya no está pendiente');
    return {ok:true,estado:'RECHAZADO',reporteId};
  }
  async webhook(authorization:string|undefined,payload:unknown) {
    const expected=process.env.WIZPAY_WEBHOOK_KEY;
    const match=/^Bearer\s+(.+)$/i.exec(authorization||'');
    if(!expected || !match || !safeEqual(match[1],expected)) throw new UnauthorizedException('Webhook no autorizado');
    const event=payload && typeof payload==='object'?payload as Record<string,unknown>:{};
    if(event.event!=='payment.qr.success') return {ok:true,ignored:true};
    const reference=String(event.reference||'');
    const qrId=String(event.qr_id||'');
    if(!reference || !qrId) throw new BadRequestException('Referencia QR ausente');
    const {data,error}=await this.admin.from('cofre_payment_attempts').select('*').eq('reference',reference).eq('qr_id',qrId).maybeSingle();
    if(error) return safeMessage(error,'Error buscando el intento');
    if(!data) throw new NotFoundException('Cobro no registrado');
    const attempt=data as Attempt;
    if(attempt.estado==='PAGADO') return {ok:true,duplicado:true};
    const verified=await this.wizGet(reference); // EL WEBHOOK NO SE TOMA COMO PRUEBA DE PAGO POR SI SOLO.
    if(verified.status!=='APROBADO' || verified.reference!==reference || verified.order_id!==attempt.id ||
       !compareCents(verified.amount,Number((await this.admin.from('cofre_charges').select('monto_centavos').eq('id',attempt.cargo_id).single()).data?.monto_centavos))) {
      throw new ConflictException('La pasarela aun no confirma el monto y la referencia');
    }
    const {data:confirmed,error:rpcError}=await this.admin.rpc('cofre_confirmar_pago',{
      p_attempt_id:attempt.id,p_reference:reference,p_amount_centavos:Math.round(Number(verified.amount)*100),
    });
    if(rpcError || !confirmed) return safeMessage(rpcError,'Fallo la confirmacion atomica del pago');
    return {ok:true};
  }
  async emitirRecojo(identity:CofreIdentity,paqueteId:number) {
    const paquete=await this.ownedPackage(identity,paqueteId);
    if(paquete.comprador_id!==identity.compradorId) throw new ForbiddenException('Solo el comprador puede solicitar el recojo');
    if(paquete.estado!=='PENDIENTE_RETIRO') throw new ConflictException('El paquete aun no esta listo para retirar');
    const {data:charge,error}=await this.admin.from('cofre_charges').select('estado').eq('paquete_id',paqueteId).maybeSingle();
    if(error) return safeMessage(error,'No se pudo validar el pago de locker');
    if(!charge || charge.estado!=='PAGADO') throw new ForbiddenException('No se puede retirar sin cargo configurado y pago confirmado');
    const token=randomBytes(32).toString('base64url');
    const {error:saveErr}=await this.admin.from('cofre_pickup_tokens').insert({paquete_id:paqueteId,issued_to_auth:identity.authId,token_hash:hashToken(token),expires_at:new Date(Date.now()+15*60_000).toISOString()});
    if(saveErr) return safeMessage(saveErr,'No se pudo emitir el token de recojo');
    return {paqueteId,codigo:token,qr_texto:`COFRE:V1:${token}`,expira:new Date(Date.now()+15*60_000).toISOString()};
  }
  async validarRecojo(identity:CofreIdentity, token:string) {
    if(!identity.staff) throw new ForbiddenException('El retiro requiere personal autorizado');
    if(!/^[A-Za-z0-9_-]{35,70}$/.test(token)) throw new BadRequestException('Codigo de retiro invalido');
    const {data,error}=await this.admin.rpc('cofre_consumir_recojo',{p_token_hash:hashToken(token),p_staff_usuario_id:identity.userId});
    if(error) throw new ConflictException('El codigo no es valido, ya fue usado o vencio');
    return data;
  }
  async historial(identity:CofreIdentity, rol?:RolCofre) {
    const {paquetes}=await this.packages(identity,rol);
    const ids=(paquetes as PackageRow[]).map(p=>p.id);
    if(!ids.length) return [];
    const {data,error}=await this.admin.from('cofre_pickup_events').select('*').in('paquete_id',ids).order('entregado_en',{ascending:false});
    if(error) return safeMessage(error,'No se pudo consultar historial');
    return (data||[]).map((e:{id:string;paquete_id:number;entregado_en:string;entregado_por:number})=>({id:e.id,paqueteId:e.paquete_id,fecha:e.entregado_en,destino:'Sucursal de retiro',receptor:`Personal #${e.entregado_por}`,costo:0}));
  }
}
