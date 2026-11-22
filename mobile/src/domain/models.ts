export type Rol = 'comprador' | 'comerciante';
export type Screen = 'login' | 'inicio' | 'paquetes' | 'detalle' | 'observado' | 'pagos' | 'avisos' | 'codigo' | 'historial' | 'perfil';
export type EstadoPaquete = 'RECIBIDO' | 'ALMACENADO' | 'PENDIENTE_RETIRO' | 'ENTREGADO' | 'OBSERVADO' | 'CANCELADO';
export type EstadoPago = 'PENDIENTE' | 'PAGADO';
export interface Paquete {
  id: number;
  comerciante_id: number;
  comprador_id: number;
  codigo_interno: string;
  numero_seguimiento: string;
  descripcion: string;
  fecha_recepcion: string;
  estado: EstadoPaquete | string;
  monto?: number;
  pagador?: Rol;
  sucursal?: string;
  codigo_recojo?: string;
}
export interface Aviso {
  id: string;
  paqueteId?: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  estado: 'POSITIVO' | 'ALERTA' | 'INFORMATIVO';
}
export interface Pago {
  id: number;
  paqueteId: number;
  titulo: string;
  monto: number;
  estado: EstadoPago;
  pagador: Rol;
  fecha: string;
}
export interface Entrega {
  id: string; paqueteId: number; fecha: string; destino: string; receptor: string; costo: number;
}
export interface UserProfile { nombre: string; telefono: string; correo: string; roles: Rol[]; }
export interface PaquetesResponse { total: number; paquetes: Paquete[] }
export interface AvisosResponse { total: number; avisos: Aviso[] }
