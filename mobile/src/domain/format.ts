import type { EstadoPaquete, Paquete } from './models';
export function precioBs(value: number | undefined) { return `Bs ${Number(value || 0).toFixed(0)}`; }
export function fechaCorta(value: string | undefined) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function etiquetaEstado(estado: EstadoPaquete | string) {
  const etiquetas: Record<string,string> = {
    RECIBIDO: 'Recibido', ALMACENADO: 'Almacenado', PENDIENTE_RETIRO: 'Listo para recoger',
    ENTREGADO: 'Entregado', OBSERVADO: 'Observado', CANCELADO: 'Cancelado',
  };
  return etiquetas[estado] || estado.replace(/_/g, ' ');
}
export function pendiente(paquete: Paquete) { return !['ENTREGADO','CANCELADO'].includes(paquete.estado); }
export function codigoPaquete(paquete: Paquete) { return paquete.codigo_interno || `PK-${paquete.id}`; }
