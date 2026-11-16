import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MisPaquetesService } from './mis-paquetes.service.js';

@Controller('mis-paquetes')
export class MisPaquetesController {
  constructor(private readonly misPaquetes: MisPaquetesService) {}

  @Get('comprador/:perfilId')
  listarComprador(
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Query('estado') estado?: string,
  ) {
    return this.misPaquetes.listar('comprador', perfilId, estado);
  }

  @Get('comerciante/:perfilId')
  listarComerciante(
    @Param('perfilId', ParseIntPipe) perfilId: number,
    @Query('estado') estado?: string,
  ) {
    return this.misPaquetes.listar('comerciante', perfilId, estado);
  }
}
