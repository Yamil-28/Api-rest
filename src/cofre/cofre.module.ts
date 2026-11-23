import { Module } from '@nestjs/common';
import { CofreController, CofreWebhookController } from './cofre.controller.js';
import { CofreGuard } from './cofre.guard.js';
import { CofreService } from './cofre.service.js';
import { CofreRegistroController } from './cofre-registro.controller.js';
import { CofreRegistroService } from './cofre-registro.service.js';

@Module({
  providers: [CofreService, CofreGuard, CofreRegistroService],
  controllers: [CofreController, CofreWebhookController, CofreRegistroController],
})
export class CofreModule {}
