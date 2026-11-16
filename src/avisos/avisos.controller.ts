import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AvisosService } from './avisos.service.js';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisos: AvisosService) {}

  @Get('comprador/:perfilId')
  listarComprador(@Param('perfilId', ParseIntPipe) perfilId: number) {
    return this.avisos.listar('comprador', perfilId);
  }

  @Get('comerciante/:perfilId')
  listarComerciante(@Param('perfilId', ParseIntPipe) perfilId: number) {
    return this.avisos.listar('comerciante', perfilId);
  }
}
