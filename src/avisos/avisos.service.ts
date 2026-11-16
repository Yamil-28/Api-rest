import { Injectable } from '@nestjs/common';
import { MisPaquetesService, type TipoPerfilLo } from '../mis-paquetes/mis-paquetes.service.js';

type PaqueteAviso = {
  id: number;
  codigo_interno?: string | null;
  estado?: string | null;
};

const mensajes: Record<string, string> = {
  RECIBIDO: 'Tu paquete fue recibido en el sistema.',
  ALMACENADO: 'Tu paquete ya esta almacenado en un locker.',
  PENDIENTE_RETIRO: 'Tu paquete esta listo para retirar.',
  ENTREGADO: 'Tu paquete fue entregado.',
  OBSERVADO: 'Tu paquete requiere una revision.',
  CANCELADO: 'El tramite de tu paquete fue cancelado.',
};

@Injectable()
export class AvisosService {
  constructor(private readonly misPaquetes: MisPaquetesService) {}

  async listar(perfil: TipoPerfilLo, perfilId: number) {
    // Los avisos de DEMOSTRACION se derivan del estado ACTUAL de cada paquete.
    // No hay tabla public.notificaciones: NO son notificaciones historicas.
    const resultado = await this.misPaquetes.listar(perfil, perfilId);
    const paquetes = resultado.paquetes as PaqueteAviso[];

    const avisos = paquetes.map((paquete) => {
      const estado = paquete.estado ?? 'SIN_ESTADO';
      const codigo = paquete.codigo_interno ?? String(paquete.id);
      const mensajeBase = mensajes[estado] ?? `Estado actual: ${estado}`;
      return {
        id: `paquete-${paquete.id}`,
        paquete_id: paquete.id,
        codigo_interno: codigo,
        titulo: `Actualizacion del paquete ${codigo}`,
        mensaje: mensajeBase,
        estado,
        origen: 'estado_actual_paquete',
      };
    });

    return {
      total: avisos.length,
      aviso: 'Listado calculado desde paquetes; sin historial ni marca de leido.',
      avisos,
    };
  }
}
