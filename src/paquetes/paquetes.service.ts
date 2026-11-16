import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class PaquetesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async crearPaquete(dto: any) {
    const { data, error } = await this.supabaseService.cliente
      .from('paquetes')
      .insert(dto)
      .select();

    if (error) throw error;
    return data;
  }

  async obtenerDetalle(id: number) {
    const { data, error } = await this.supabaseService.cliente
      .from('paquetes')
      .select(`
        id, codigo_interno, numero_seguimiento, descripcion, fecha_recepcion, estado,
        compradores ( id, direccion, usuarios ( nombre, email, telefono ) ),
        almacenamientos ( id, estado, fecha_inicio, lockers ( codigo, sucursales ( nombre ) ) ),
        pagos ( monto, estado, metodo_pago )
      `)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException(`Paquete con ID ${id} no encontrado`);
    return data;
  }

  async ObtHistorial(paqueteId: number) {
    const { data, error } = await this.supabaseService.cliente
      .from('almacenamientos')
      .select(`id, fecha_inicio, fecha_fin, estado, lockers ( codigo, sucursales ( nombre, direccion ) )`)
      .eq('paquete_id', paqueteId)
      .order('fecha_inicio', { ascending: false });

    if (error) throw error;
    return data;
  }

  async filtrar(estado: string) {
    const { data, error } = await this.supabaseService.cliente
      .from('paquetes')
      .select('*')
      .eq('estado', estado);

    if (error) throw error;
    return data;
  }

  async paqPorComerciante(comercianteId: number) {
    const { data, error } = await this.supabaseService.cliente
      .from('paquetes')
      .select(`*, compradores ( usuarios ( nombre ) )`)
      .eq('comerciante_id', comercianteId);

    if (error) throw error;
    return data;
  }

  async etiqueta(id: number) {
    const { data, error } = await this.supabaseService.cliente
      .from('paquetes')
      .select('id, codigo_interno, numero_seguimiento')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException(`Etiqueta para el paquete ${id} no encontrada`);
    return data;
  }

  async resEstadistica() {
    const { count, error } = await this.supabaseService.cliente
      .from('paquetes')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return {
      total_paquetes: count,
      mensaje: 'Estadísticas generales generadas correctamente',
    };
  }

  async lockerSucursal(sucursalId: number) {
    const { data, error } = await this.supabaseService.cliente
      .from('lockers')
      .select('*')
      .eq('sucursal_id', sucursalId);

    if (error) throw error;
    return data;
  }

  async perfil(id: number) {
    const { data, error } = await this.supabaseService.cliente
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Usuario no encontrado');
    return data;
  }

  async actEstado(id: number, estado: string) {
    const { data, error } = await this.supabaseService.cliente
      .from('paquetes')
      .update({ estado })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  }
  async eliminar(id: number) {
    const { data, error } = await this.supabaseService.cliente
      .from('paquetes')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new NotFoundException(`Paquete con ID ${id} no encontrado para eliminar`);
    }

    return {
      mensaje: `Paquete con ID ${id} eliminado correctamente`,
      paquete_eliminado: data[0],
    };
  }
}
