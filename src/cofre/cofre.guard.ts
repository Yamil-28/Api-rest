import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { CofreService } from './cofre.service.js';
@Injectable()
export class CofreGuard implements CanActivate {
  constructor(private readonly cofre: CofreService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = String(request.headers.authorization ?? '');
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) throw new UnauthorizedException('Inicia sesion para continuar');
    request.cofreIdentity = await this.cofre.identify(match[1]);
    return true;
  }
}
