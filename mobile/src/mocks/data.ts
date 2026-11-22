import type { Paquete, Aviso, Pago, Entrega, UserProfile } from '../domain/models';
// Datos de demostracion inspirados en las capturas. No corresponden a usuarios reales.
export const demoPackages: Paquete[] = [
  { id:204, comprador_id:1, comerciante_id:1, codigo_interno:'PK-204', numero_seguimiento:'TRK123456', descripcion:'Audífonos inalámbricos', fecha_recepcion:'2026-11-16T12:40:57Z', estado:'PENDIENTE_RETIRO', monto:4, pagador:'comprador', sucursal:'Sucursal Central', codigo_recojo:'PK-204' },
  { id:184, comprador_id:1, comerciante_id:1, codigo_interno:'PK-184', numero_seguimiento:'SEG-184', descripcion:'Cámara deportiva', fecha_recepcion:'2026-11-15T21:21:26Z', estado:'OBSERVADO', monto:6, pagador:'comerciante', sucursal:'Sucursal Central', codigo_recojo:'PK-184' },
  { id:221, comprador_id:1, comerciante_id:1, codigo_interno:'PK-221', numero_seguimiento:'SEG-221', descripcion:'Libro técnico', fecha_recepcion:'2026-11-13T12:20:00Z', estado:'ENTREGADO', monto:0, pagador:'comerciante', sucursal:'Sucursal Central', codigo_recojo:'PK-221' },
  { id:219, comprador_id:1, comerciante_id:1, codigo_interno:'PK-219', numero_seguimiento:'SEG-219', descripcion:'Paquete de accesorios', fecha_recepcion:'2026-11-17T10:30:00Z', estado:'ALMACENADO', monto:4, pagador:'comprador', sucursal:'Sucursal Central', codigo_recojo:'PK-219' },
  { id:173, comprador_id:1, comerciante_id:1, codigo_interno:'PK-173', numero_seguimiento:'SEG-173', descripcion:'Equipo de informática', fecha_recepcion:'2026-11-10T10:10:00Z', estado:'ENTREGADO', monto:2, pagador:'comprador', sucursal:'Sucursal Centro', codigo_recojo:'PK-173' },
];
export const demoAvisos: Aviso[] = [
  { id:'a1', paqueteId:204, titulo:'Tu paquete ya llegó', descripcion:'Tu paquete PK-204 está disponible para recoger en la Sucursal Central.', fecha:'2026-11-17T09:00:00Z', estado:'POSITIVO' },
  { id:'a2', paqueteId:184, titulo:'Paquete no recogido a tiempo', descripcion:'Tu paquete PK-184 tiene una observación pendiente. Revisa su seguimiento.', fecha:'2026-11-16T15:00:00Z', estado:'ALERTA' },
  { id:'a3', paqueteId:219, titulo:'Ubicación asignada', descripcion:'Tu paquete PK-219 ya tiene una ubicación asignada en el locker.', fecha:'2026-11-16T13:00:00Z', estado:'INFORMATIVO' },
];
export const demoPagos: Pago[] = [
  { id:1, paqueteId:204, titulo:'PK-204 · Audífonos inalámbricos', monto:4, estado:'PENDIENTE', pagador:'comprador', fecha:'2026-11-17' },
  { id:2, paqueteId:184, titulo:'PK-184 · Cámara deportiva', monto:6, estado:'PENDIENTE', pagador:'comerciante', fecha:'2026-11-16' },
  { id:3, paqueteId:221, titulo:'PK-221 · Libro técnico', monto:0, estado:'PAGADO', pagador:'comerciante', fecha:'2026-11-15' },
];
export const demoEntregas: Entrega[] = [
  { id:'ENT-001', paqueteId:173, fecha:'2026-11-17T14:00:00Z', destino:'Sucursal Central', receptor:'Comprador', costo:2 },
];
export const demoProfile: UserProfile = { nombre:'Usuario de demostración', telefono:'+591 70000003', correo:'comprador@demo.com', roles:['comprador','comerciante'] };
