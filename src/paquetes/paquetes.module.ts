import { Module } from '@nestjs/common';
import { PaquetesController } from './paquetes.controller.js';
import { PaquetesService } from './paquetes.service.js';

@Module({
  controllers: [PaquetesController],
  providers: [PaquetesService],
})
export class PaquetesModule {}