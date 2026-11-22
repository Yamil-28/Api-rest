import { Module } from '@nestjs/common';
import { CofreController, CofreWebhookController } from './cofre.controller.js';
import { CofreGuard } from './cofre.guard.js';
import { CofreService } from './cofre.service.js';
@Module({
  providers: [CofreService, CofreGuard],
  controllers: [CofreController, CofreWebhookController],
})
export class CofreModule {}
