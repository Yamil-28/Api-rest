import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { PaquetesService } from './paquetes.service.js';

@Controller('paquetes')
export class PaquetesController {
  constructor(
    private readonly paquetesService: PaquetesService,
  ) {}

  @Post()
  async crearPaquete(@Body() body: any) {
    return this.paquetesService.crearPaquete(body);
  }

  @Get('estadisticas/resumen')
  async resEstadistica() {
    return this.paquetesService.resEstadistica();
  }

  @Get('filtro/estado/:estado')
  async filtrar(@Param('estado') estado: string) {
    return this.paquetesService.filtrar(estado);
  }

  @Get('comerciante/:comercianteId')
  async paqPorComerciante(
    @Param('comercianteId', ParseIntPipe) comercianteId: number,
  ) {
    return this.paquetesService.paqPorComerciante(comercianteId);
  }

  @Get('lockers/sucursal/:sucursalId')
  async lockerSucursal(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
  ) {
    return this.paquetesService.lockerSucursal(sucursalId);
  }

  @Get('usuarios/:id/perfil')
  async perfil(@Param('id', ParseIntPipe) id: number) {
    return this.paquetesService.perfil(id);
  }

  @Get(':id/detalle')
  async obtenerDetalle(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paquetesService.obtenerDetalle(id);
  }

  @Get(':id/historial')
  async obtenerHistorial(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paquetesService.ObtHistorial(id);
  }

  @Get(':id/etiqueta')
  async etiqueta(@Param('id', ParseIntPipe) id: number) {
    return this.paquetesService.etiqueta(id);
  }

  @Patch(':id/estado')
  async actEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ) {
    return this.paquetesService.actEstado(id, estado);
  }

  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.paquetesService.eliminar(id);
  }
}