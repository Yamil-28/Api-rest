# Arquitectura modular · Cofre Express

## Proyecto

- **Frontend móvil:** esta carpeta (`mobile/` en el monorepositorio). Expo SDK 54 + React Native + TypeScript.
- **Backend:** repositorio `Yamil-28/Api-rest`, NestJS existente; NO reemplazar `src/` ni `package.json` del backend.
- **Datos:** Supabase PostgreSQL. Render publica el backend en `https://api-rest-6an3.onrender.com`.
- **Diseño:** reconstrucción por código a partir de las capturas proporcionadas y del enlace Figma, sin extracción automatizada de sus capas.

## Carpetas e iniciales

Las iniciales/identificadores siguen la organización solicitada; es posible reasignar un responsable sin mover servicios compartidos.

| Carpeta | Responsabilidad | Observación |
|---|---|---|
| `modules/AUTH` | Acceso / registro visual | Mock claramente separado de autenticación real |
| `modules/AD` | Inicio / panel principal | Banner naranja, dos roles, métricas y resumen |
| `modules/AL` | Componentes reutilizables para tarjeta de paquetes | Consumidos por LO |
| `modules/LO` | **Mis paquetes y Avisos** | Tu parte; rutas de NestJS existentes |
| `modules/FC` | Detalle normal y observado | Dos variantes del paquete |
| `modules/PG` | Pagos del locker | Datos demo, pendiente API de pagos |
| `modules/QR` | Código de recojo | QR demostrativo, requiere validación backend |
| `modules/FG` | Historial de entrega | Datos demo, pendiente API historial |
| `modules/PR` | Perfil y cambio de rol | Falta vincular usuario Auth a perfiles reales |

## Reutilización e herencia

- `components/Primitives.tsx`: componentes reutilizables mediante **composición** (patrón de React Native), sin copiar UI en cada pantalla.
- `api/repository.ts`: interfaz `CofreRepository` y clase abstracta `BaseRepository`.
- `api/MockRepository.ts`: **hereda** `BaseRepository`, permite toda la navegación sin backend.
- `api/HttpRepository.ts`: **hereda** `BaseRepository`, conecta únicamente rutas reales de LO con Render.
- `api/mapper.ts`: adapta campos del backend (p. ej. `aviso.mensaje` → `descripcion` y `paquete_id` → `paqueteId`).
- `context/AppContext.tsx`: contexto único de navegación y rol.
- `config/env.ts`: selector `mock`/`api`, sin secretos.

## Contrato LO (actual)

| Método | Endpoint | JSON esperado |
|---|---|---|
| GET | `/mis-paquetes/comprador/:perfilId` | `{ total, paquetes: [] }` |
| GET | `/mis-paquetes/comerciante/:perfilId` | `{ total, paquetes: [] }` |
| GET | `/mis-paquetes/comprador/:perfilId?estado=RECIBIDO` | `{ total, paquetes: [] }` |
| GET | `/avisos/comprador/:perfilId` | `{ total, avisos: [] }` |
| GET | `/avisos/comerciante/:perfilId` | `{ total, avisos: [] }` |

**Importante:** el backend LO actual responde `403` en `NODE_ENV=production`. La app no omite ni desactiva ese control. Hasta que el equipo incorpore validación de identidad JWT y autorización de propiedad de cada perfil, el modo API no podrá mostrar datos privados en Render.

## Contratos por integrar

- Inicio de sesión real: Supabase Auth o módulo común del equipo. No incluir `sb_secret_*` en Expo.
- Roles/perfiles: identificar el `usuario_id` relacionado con la identidad autenticada, y obtener los `comprador_id`/`comerciante_id` del servidor, no confiar en un ID elegido por el teléfono.
- Pagos: GET de pagos por usuario con autorización, total, responsable y estado; no efectuar pagos ficticios.
- Historial: GET de entregas confirmadas según usuario.
- QR: el código no autoriza automáticamente el retiro; requiere cotejo del backend con vencimiento y consumo único.
- Avisos persistentes: crear tabla de notificaciones + timestamp + leído, solo después de coordinar migración con el equipo. Ahora se derivan de estados de paquetes.
- CORS: si se utiliza Expo Web, el backend debe permitir solo el origen Web configurado mediante `app.enableCors` para el frontend.

## Reglas de integración del equipo

1. Cada participante hace commits en su rama, sin editar `main` directamente.
2. Mantener los componentes y adaptadores comunes bajo responsable de integración; los demás contribuyen vía PR.
3. Especificar contratos de API antes de unir pantallas. Es preferible usar repositorios por módulo y mappers de respuesta.
4. PR a `integracion` para pruebas; luego PR único a `main` tras revisar y probar.
5. Render backend se despliega con el `package.json` raíz. Expo móvil se ejecuta desde `mobile/` y se distribuye aparte.
