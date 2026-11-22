import { settings } from '../config/env';
import { MockRepository } from './MockRepository';
import { HttpRepository } from './HttpRepository';
import type { CofreRepository } from './repository';

let token: string | undefined;

export function setUserAccessToken(value?: string) {
  token = value;
}

const httpRepository = new HttpRepository(() => token);
const mockRepository = new MockRepository();

const principal =
  settings.dataSource === 'api'
    ? httpRepository
    : mockRepository;

const pagos =
  settings.pagosSource === 'api' ||
  settings.dataSource === 'api'
    ? httpRepository
    : mockRepository;

export const repository: CofreRepository = {
  listarPaquetes: (rol, perfilId, estado) =>
    principal.listarPaquetes(rol, perfilId, estado),

  listarAvisos: (rol, perfilId) =>
    principal.listarAvisos(rol, perfilId),

  listarPagos: (perfilId) =>
    pagos.listarPagos(perfilId),

  listarEntregas: (perfilId) =>
    principal.listarEntregas(perfilId),
};

export { ApiHttpError } from './HttpRepository';