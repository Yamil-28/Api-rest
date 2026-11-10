import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Controller('sucursales')
export class SucursalesController {
  private readonly logger = new Logger(SucursalesController.name);

  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async listar() {
    const { data, error } = await this.supabase.cliente
      .from('sucursales')
      .select('id, nombre, direccion')
      .order('id');

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(
        'No se pudieron consultar las sucursales',
      );
    }

    return data;
  }
}