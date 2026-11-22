import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service.js';
import { CrearPagoDto } from './dto/crear-pago.dto.js';
import { CompletarPagoDto } from './dto/completar-pago.dto.js';

@Controller('pagos')
export class PagosController {
  private readonly logger = new Logger(PagosController.name);

  constructor(private readonly supabase: SupabaseService) {}

  // GET /pagos
  // GET /pagos?estado=COMPLETADO
  @Get()
  async listar(@Query('estado') estado?: string) {
    let consulta = this.supabase.cliente
      .from('pagos')
      .select(`
        id,
        paquete_id,
        monto,
        fecha,
        metodo_pago,
        estado,
        referencia,
        paquetes (
          codigo_interno,
          descripcion,
          fecha_recepcion
        )
      `)
      .order('id', { ascending: false });
      
    if (estado) {
      consulta = consulta.eq('estado', estado);
    }
  
    const { data, error } = await consulta;
  
    if (error) {
      this.logger.error(error.message);
    
      throw new InternalServerErrorException(
        'No se pudieron consultar los pagos',
      );
    }
  
    return data;
  }

  // GET /pagos/pendientes
  @Get('pendientes')
  async listarPendientes() {
    const { data, error } = await this.supabase.cliente
      .from('pagos')
      .select(`
        id,
        paquete_id,
        monto,
        fecha,
        estado,
        paquetes (
          codigo_interno,
          descripcion,
          fecha_recepcion
        )
      `)
      .eq('estado', 'PENDIENTE')
      .order('id', { ascending: false });

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(
        'No se pudieron consultar los pagos pendientes',
      );
    }

    return data;
  }

  // GET /pagos/resumen
  @Get('resumen')
  async obtenerResumen() {
    const { data, error } = await this.supabase.cliente
      .from('pagos')
      .select('id, paquete_id, monto')
      .eq('estado', 'PENDIENTE');

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(
        'No se pudo obtener el resumen',
      );
    }

    const pagos = data ?? [];

    const totalPendiente = pagos.reduce(
      (total, pago) => total + Number(pago.monto),
      0,
    );

    const paquetes = new Set(
      pagos.map((pago) => pago.paquete_id),
    );

    return {
      total_pendiente: Number(totalPendiente.toFixed(2)),
      cantidad_pagos_pendientes: pagos.length,
      cantidad_paquetes_pendientes: paquetes.size,
    };
  }

  // GET /pagos/paquete/1
  @Get('paquete/:paqueteId')
  async listarPorPaquete(
    @Param('paqueteId', ParseIntPipe) paqueteId: number,
  ) {
    const { data, error } = await this.supabase.cliente
      .from('pagos')
      .select(
        'id, paquete_id, monto, fecha, metodo_pago, estado, referencia',
      )
      .eq('paquete_id', paqueteId)
      .order('id', { ascending: false });

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(
        'No se pudieron consultar los pagos del paquete',
      );
    }

    return data;
  }

  // GET /pagos/1
  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number) {
    const { data, error } = await this.supabase.cliente
      .from('pagos')
      .select(
        'id, paquete_id, monto, fecha, metodo_pago, estado, referencia',
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(
        'No se pudo consultar el pago',
      );
    }

    if (!data) {
      throw new NotFoundException('El pago no existe');
    }

    return data;
  }

  // POST /pagos
  @Post()
  async crear(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    datos: CrearPagoDto,
  ) {
    const { data, error } = await this.supabase.cliente
      .from('pagos')
      .insert({
        paquete_id: datos.paquete_id,
        monto: datos.monto,
        referencia: datos.referencia,
        estado: 'PENDIENTE',
      })
      .select(
        'id, paquete_id, monto, fecha, metodo_pago, estado, referencia',
      )
      .single();

    if (error) {
      this.logger.error(error.message);

      if (error.code === '23503') {
        throw new BadRequestException(
          'El paquete indicado no existe',
        );
      }

      if (error.code === '23505') {
        throw new ConflictException(
          'El registro entra en conflicto con un dato existente',
        );
      }

      throw new InternalServerErrorException(
        'No se pudo registrar el pago pendiente',
      );
    }

    return data;
  }

  // PATCH /pagos/2/completar
  @Patch(':id/completar')
  async completar(
    @Param('id', ParseIntPipe) id: number,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    datos: CompletarPagoDto,
  ) {
    const { data, error } = await this.supabase.cliente
      .from('pagos')
      .update({
        estado: 'COMPLETADO',
        metodo_pago: datos.metodo_pago,
      })
      .eq('id', id)
      .eq('estado', 'PENDIENTE')
      .select(
        'id, paquete_id, monto, fecha, metodo_pago, estado, referencia',
      )
      .maybeSingle();

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(
        'No se pudo completar el pago',
      );
    }

    if (data) {
      return data;
    }

    const pago = await this.obtener(id);

    throw new ConflictException(
      `El pago está en estado ${pago.estado}; solo se completan pendientes`,
    );
  }
}