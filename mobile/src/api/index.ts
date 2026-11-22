import { settings } from '../config/env';
import { MockRepository } from './MockRepository';
import { HttpRepository } from './HttpRepository';
import type { CofreRepository } from './repository';
let token: string | undefined;
export function setUserAccessToken(value?: string) { token = value; }
export const repository: CofreRepository = settings.dataSource === 'api'
  ? new HttpRepository(() => token)
  : new MockRepository();
export { ApiHttpError } from './HttpRepository';
