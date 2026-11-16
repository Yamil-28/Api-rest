import { Controller, Get, Param } from '@nestjs/common';

@Controller('api/paquetes')
export class DetallePaqueteDemoController {
  @Get(':codigo')
  obtenerDetallePaquete(@Param('codigo') codigo: string) {
    return {
      codigo,
      rol: 'Rol comprador',
      titulo: 'Audífonos inalámbricos',
      estado: 'Ya llegó',
      detallesEnvio: {
        fechaLlegada: '16 sep 2026 - 14:32',
        tiempoGuardado: '10 días',
        quienPagaLocker: 'Comprador',
        costoActual: 'Bs 4',
        puntoRecojo: 'Sucursal Centro',
        horario: '08:00–19:00',
      },
      seguimiento: [
        {
          evento: 'Disponible para recojo',
          fecha: '16 sep - 14:32',
        },
        {
          evento: 'Asignado al locker M-08',
          fecha: '16 sep - 14:29',
        },
        {
          evento: 'Paquete registrado por el comerciante',
          fecha: '16 sep - 14:25',
        },
      ],
    };
  }
}