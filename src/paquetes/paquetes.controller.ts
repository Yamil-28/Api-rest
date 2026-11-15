import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { PaquetesService } from './paquetes.service.js';

@Controller('paquetes')
export class PaquetesController {
  constructor(private readonly paquetesService: PaquetesService) {}

  @Post()
  async crearPaquete(@Body() body: any) {
    return await this.paquetesService.crearPaquete(body);
  }

  @Get(':id/detalle')
  async obtenerDetalle(@Param('id', ParseIntPipe) id: number) {
    return await this.paquetesService.obtenerDetalle(id);
  }

  @Get(':id/historial')
  async ObtHistorial(@Param('id', ParseIntPipe) id: number) {
    return await this.paquetesService.ObtHistorial(id);
  }

  @Get('filtro/estado/:estado')
  async filtrar(@Param('estado') estado: string) {
    return await this.paquetesService.filtrar(estado);
  }

  @Get('comerciante/:comercianteId')
  async paqPorComerciante(@Param('comercianteId', ParseIntPipe) comercianteId: number) {
    return await this.paquetesService.paqPorComerciante(comercianteId);
  }

  @Get(':id/etiqueta')
  async etiqueta(@Param('id', ParseIntPipe) id: number) {
    return await this.paquetesService.etiqueta(id);
  }

  @Get('estadisticas/resumen')
  async resEstadistica() {
    return await this.paquetesService.resEstadistica();
  }

  @Get('lockers/sucursal/:sucursalId')
  async lockerSucursal(@Param('sucursalId', ParseIntPipe) sucursalId: number) {
    return await this.paquetesService.lockerSucursal(sucursalId);
  }

  @Get('usuarios/:id/perfil')
  async perfil(@Param('id', ParseIntPipe) id: number) {
    return await this.paquetesService.perfil(id);
  }

  @Patch(':id/estado')
  async actEstado(@Param('id', ParseIntPipe) id: number, @Body('estado') estado: string) {
    return await this.paquetesService.actEstado(id, estado);
  }
  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    return await this.paquetesService.eliminar(id);
  }
}