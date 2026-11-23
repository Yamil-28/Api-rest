import { Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { CofreRegistroService } from './cofre-registro.service.js';

/** Ruta sin CofreGuard: todavía no existe perfil de negocio.
 *  CofreRegistroService valida el Bearer con Supabase Auth. */
@Controller('cofre')
export class CofreRegistroController {
  constructor(private readonly registro: CofreRegistroService) {}

  @Post('registro')
  @HttpCode(200)
  registrar(@Headers('authorization') authorization: string | undefined) {
    return this.registro.registrar(authorization);
  }
}
