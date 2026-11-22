import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CofreGuard } from './cofre.guard.js';
import { CofreService } from './cofre.service.js';
import type { CofreIdentity, RolCofre } from './cofre.types.js';
import type { ArchivoComprobante } from './comprobante.validation.js';
function validRole(value: string | undefined): RolCofre | undefined {
  if (!value) return undefined;
  if (value !== 'comprador' && value !== 'comerciante') throw new BadRequestException('Rol invalido');
  return value;
}
function id(value: string) { if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new BadRequestException('ID invalido'); return Number(value); }
interface AuthedRequest { cofreIdentity: CofreIdentity }
@Controller('cofre')
@UseGuards(CofreGuard)
export class CofreController {
  constructor(private readonly cofre: CofreService) {}
  @Get('me') me(@Req() r: AuthedRequest) { return r.cofreIdentity; }
  @Get('paquetes') paquetes(@Req() r: AuthedRequest, @Query('rol') role?: string, @Query('estado') estado?: string) { return this.cofre.packages(r.cofreIdentity, validRole(role), estado); }
  @Get('avisos') avisos(@Req() r: AuthedRequest, @Query('rol') role?: string) { return this.cofre.avisos(r.cofreIdentity, validRole(role)); }
  @Get('pagos') pagos(@Req() r: AuthedRequest, @Query('rol') role?: string) { return this.cofre.pagos(r.cofreIdentity, validRole(role)); }
  @Post('pagos/:cargoId/qr') generarQR(@Req() r: AuthedRequest, @Param('cargoId') charge: string) { return this.cofre.generarQR(r.cofreIdentity, id(charge)); }
  @Post('pagos/:cargoId/manual') reportarManual(@Req() r: AuthedRequest, @Param('cargoId') cargoId: string, @Body() body: {referencia?: string}) {
    return this.cofre.reportarPagoManual(r.cofreIdentity,id(cargoId),String(body?.referencia ?? ''));
  }
  @Post('pagos/:cargoId/comprobante')
  @UseInterceptors(FileInterceptor('comprobante', { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 2 } }))
  subirComprobante(@Req() r: AuthedRequest, @Param('cargoId') cargoId: string,
    @UploadedFile() archivo: ArchivoComprobante | undefined, @Body() body: {referencia?: string}) {
    return this.cofre.subirComprobante(r.cofreIdentity, id(cargoId), archivo, body?.referencia ?? '');
  }
  @Get('pagos/manual/:reporteId/comprobante') comprobante(@Req() r: AuthedRequest, @Param('reporteId') reporteId: string) {
    return this.cofre.enlaceComprobante(r.cofreIdentity, reporteId);
  }
  @Get('pagos/manual/pendientes') reportes(@Req() r: AuthedRequest) {
    return this.cofre.reportesPendientes(r.cofreIdentity);
  }
  @Post('pagos/manual/:reporteId/aprobar') aprobar(@Req() r: AuthedRequest, @Param('reporteId') reporteId: string, @Body() body: {montoVerificadoCentavos?: number}) {
    return this.cofre.aprobarPagoManual(r.cofreIdentity,reporteId,Number(body?.montoVerificadoCentavos));
  }
  @Post('pagos/manual/:reporteId/rechazar') rechazar(@Req() r: AuthedRequest, @Param('reporteId') reporteId: string, @Body() body: {motivo?: string}) {
    return this.cofre.rechazarPagoManual(r.cofreIdentity,reporteId,String(body?.motivo ?? ''));
  }
  @Get('pagos/:cargoId/estado') estadoPago(@Req() r: AuthedRequest, @Param('cargoId') charge: string) { return this.cofre.estadoPago(r.cofreIdentity, id(charge)); }
  @Post('recojo/validar') validar(@Req() r: AuthedRequest, @Body() body: { token?: string }) { return this.cofre.validarRecojo(r.cofreIdentity, String(body?.token ?? '')); }
  @Post('recojo/:paqueteId') recojo(@Req() r: AuthedRequest, @Param('paqueteId') paquete: string) { return this.cofre.emitirRecojo(r.cofreIdentity, id(paquete)); }
  @Get('historial') historial(@Req() r: AuthedRequest, @Query('rol') role?: string) { return this.cofre.historial(r.cofreIdentity, validRole(role)); }
}
/** Webhook publico SOLO para el proveedor; exige secreto Bearer y verifica el pago servidor a servidor. */
@Controller('cofre/webhooks')
export class CofreWebhookController {
  constructor(private readonly cofre: CofreService) {}
  @Post('wizpay') webhook(@Headers('authorization') authorization: string | undefined, @Body() body: unknown) { return this.cofre.webhook(authorization, body); }
}
