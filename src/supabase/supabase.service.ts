import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  readonly cliente: SupabaseClient;

  constructor(configuracion: ConfigService) {
    console.log(
  'URL de Supabase:',
  configuracion.getOrThrow<string>('SUPABASE_URL'),
  );

  console.log(
  '¿Usa clave secreta?:',
  configuracion
    .getOrThrow<string>('SUPABASE_SECRET_KEY')
    .startsWith('sb_secret_'),
  );
    this.cliente = createClient(
      configuracion.getOrThrow<string>('SUPABASE_URL'),
      configuracion.getOrThrow<string>('SUPABASE_SECRET_KEY'),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }
}