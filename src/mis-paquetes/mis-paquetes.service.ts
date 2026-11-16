import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

export type TipoPerfilLo = 'comprador' | 'comerciante';

@Injectable()
export class MisPaquetesService {
  private readonly logger = new Logger(MisPaquetesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async listar(perfil: TipoPerfilLo, perfilId: number, estado?: string) {
    // AVISO DE SEGURIDAD: la conexion compartida utiliza clave secreta.
    // En esta etapa solo se autorizan pruebas locales, nunca produccion.
    if (
      process.env.LO_DEMO_MODE !== 'true' ||
      process.env.NODE_ENV === 'production'
    ) {
      throw new ForbiddenException(
        'Endpoint de demostracion deshabilitado; falta autenticacion.',
      );
    }

    if (!Number.isSafeInteger(perfilId) || perfilId < 1) {
      throw new BadRequestException('El identificador de perfil debe ser positivo.');
    }

    // Confirmado en el esquema mostrado: paquetes.comprador_id y comerciante_id.
    const columna = perfil === 'comprador' ? 'comprador_id' : 'comerciante_id';
    let consulta = this.supabase.cliente
      .from('paquetes')
      .select('*')
      .eq(columna, perfilId);

    if (estado?.trim()) {
      consulta = consulta.eq('estado', estado.trim());
    }

    const { data, error } = await consulta.order('id', { ascending: false });
    if (error) {
      this.logger.error(`Supabase (LO): ${error.message}`);
      throw new InternalServerErrorException('No se pudieron consultar los paquetes');
    }

    return {
      total: data?.length ?? 0,
      paquetes: data ?? [],
    };
  }
}
