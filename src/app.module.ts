import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SupabaseService } from './supabase/supabase.service.js';
import { SucursalesController } from './sucursales/sucursales.controller.js';

import { MisPaquetesController } from './mis-paquetes/mis-paquetes.controller.js';
import { MisPaquetesService } from './mis-paquetes/mis-paquetes.service.js';
import { AvisosController } from './avisos/avisos.controller.js';
import { AvisosService } from './avisos/avisos.service.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'api-movil',
    }),
  ],
  
  controllers: [
    AppController,
    SucursalesController,
    MisPaquetesController,
    AvisosController,
  ],
  providers: [
    AppService,
    SupabaseService,
    MisPaquetesService,
    AvisosService,
  ],

})
export class AppModule {}