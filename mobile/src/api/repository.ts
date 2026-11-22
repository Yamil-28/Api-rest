import type { AvisosResponse, Entrega, Pago, PaquetesResponse, Rol } from '../domain/models';
export interface CofreRepository {
  listarPaquetes(rol: Rol, perfilId: number, estado?: string): Promise<PaquetesResponse>;
  listarAvisos(rol: Rol, perfilId: number): Promise<AvisosResponse>;
  listarPagos(perfilId: number): Promise<Pago[]>;
  listarEntregas(perfilId: number): Promise<Entrega[]>;
}
export class ApiIntegrationPendingError extends Error {
  constructor(modulo: string) {
    super(`El módulo ${modulo} todavía no tiene un endpoint integrado. Usa el modo mock para revisar la interfaz.`);
    this.name = 'ApiIntegrationPendingError';
  }
}
// Herencia real para que Mock y HTTP compartan contratos y comportamiento.
export abstract class BaseRepository implements CofreRepository {
  abstract listarPaquetes(rol: Rol, perfilId: number, estado?: string): Promise<PaquetesResponse>;
  abstract listarAvisos(rol: Rol, perfilId: number): Promise<AvisosResponse>;
  async listarPagos(_perfilId: number): Promise<Pago[]> { throw new ApiIntegrationPendingError('Pagos'); }
  async listarEntregas(_perfilId: number): Promise<Entrega[]> { throw new ApiIntegrationPendingError('Historial'); }
}
