import { BaseRepository } from './repository';
import { settings } from '../config/env';
import type { AvisosResponse, PaquetesResponse, Rol } from '../domain/models';
import { mapPaquetes, mapAvisos } from './mapper';

export class ApiHttpError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiHttpError'; }
}

export class HttpRepository extends BaseRepository {
  // SOLO JWT de usuario autenticado. Nunca claves secretas de Supabase en una app Expo.
  constructor(private getAccessToken: () => string | undefined = () => undefined) { super(); }
  private async request(route: string): Promise<unknown> {
    const headers: Record<string,string> = { Accept:'application/json' };
    const token = this.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let response: Response;
    try {
      response = await fetch(`${settings.apiBaseUrl}${route}`, { method:'GET', headers });
    } catch {
      throw new Error('No se pudo contactar la API. Revisa la conexión o la URL del servicio Render.');
    }
    const raw = await response.text();
    let data: unknown;
    try { data = raw ? JSON.parse(raw) : null; }
    catch { throw new Error('La API no devolvió JSON válido. Revisa los logs de Render.'); }
    if (!response.ok) {
      const err = data && typeof data === 'object' ? data as Record<string,unknown> : {};
      const msg=typeof err.message==='string'?err.message:`HTTP ${response.status}`;
      if (response.status===403) throw new ApiHttpError(403, `Acceso denegado: ${msg}. Necesitas autenticación y autorización NestJS para este perfil.`);
      if (response.status===401) throw new ApiHttpError(401, `Inicia sesión con tu cuenta. ${msg}`);
      throw new ApiHttpError(response.status,msg);
    }
    return data;
  }
  async listarPaquetes(rol: Rol, perfilId: number, estado?: string): Promise<PaquetesResponse> {
    const query=estado?`?estado=${encodeURIComponent(estado)}`:'';
    return mapPaquetes(await this.request(`/mis-paquetes/${rol}/${perfilId}${query}`));
  }
  async listarAvisos(rol: Rol, perfilId: number): Promise<AvisosResponse> {
    return mapAvisos(await this.request(`/avisos/${rol}/${perfilId}`));
  }
}
