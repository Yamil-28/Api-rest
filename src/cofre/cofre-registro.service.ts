import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable de entorno ${name}`);
  return value;
}

/** Crea SOLO perfiles comprador para cuentas Auth confirmadas.
 *  Nunca acepta un usuario_id, auth_user_id o rol enviado por el cliente. */
@Injectable()
export class CofreRegistroService {
  private readonly auth = createClient(env('SUPABASE_URL'), env('SUPABASE_PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  private readonly admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async registrar(authorization: string | undefined) {
    const match = /^Bearer\s+([^\s]+)$/i.exec(authorization || '');
    if (!match) throw new UnauthorizedException('Inicia sesion para continuar');
    const { data, error } = await this.auth.auth.getUser(match[1]);
    const user = data.user;
    if (error || !user || !user.email) {
      throw new UnauthorizedException('Token invalido o vencido');
    }
    if (!user.email_confirmed_at) {
      throw new ForbiddenException('Confirma tu correo para habilitar tu cuenta');
    }
    const nombre = typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim().slice(0, 100) : '';
    if (nombre.length < 3) {
      throw new BadRequestException('Falta nombre completo en el registro');
    }
    const { data: result, error: dbError } = await this.admin.rpc('cofre_auto_registrar_comprador', {
      p_auth_id: user.id,
      p_nombre: nombre,
      p_correo: user.email,
    });
    if (dbError) {
      console.error('[cofre-registro] fallo SQL:', dbError.code ?? 'sin_codigo');
      throw new InternalServerErrorException('No se pudo crear el perfil de comprador. Revisa la migracion y el esquema de usuarios.');
    }
    return { ok: true, perfil: result };
  }
}
