import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Movil')
    .setDescription('Documentacion de la API REST')
    .setVersion('1.0')
    .build();
  const swaggerDocument = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    jsonDocumentUrl: 'swagger.json',
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
