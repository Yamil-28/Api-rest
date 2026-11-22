import { BaseRepository } from './repository';
import type { AvisosResponse, Entrega, Pago, PaquetesResponse, Rol } from '../domain/models';
import { demoAvisos, demoEntregas, demoPackages, demoPagos } from '../mocks/data';
export class MockRepository extends BaseRepository {
  async listarPaquetes(rol: Rol, perfilId: number, estado?: string): Promise<PaquetesResponse> {
    const filtered = demoPackages.filter(p => p[rol === 'comprador' ? 'comprador_id' : 'comerciante_id'] === perfilId && (!estado || p.estado === estado));
    return { total: filtered.length, paquetes: filtered };
  }
  async listarAvisos(_rol: Rol, _perfilId: number): Promise<AvisosResponse> {
    return { total: demoAvisos.length, avisos: demoAvisos };
  }
  async listarPagos(_perfilId: number): Promise<Pago[]> { return demoPagos; }
  async listarEntregas(_perfilId: number): Promise<Entrega[]> { return demoEntregas; }
}
