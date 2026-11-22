# Cofre Express · Frontend móvil modular

Implementación **Expo + React Native + TypeScript** de las pantallas de Cofre Express a partir de las capturas de Figma enviadas. Componentes reutilizables, navegación, dos roles, datos demo y un adaptador para la API NestJS de la rama `LO`.

> Es un **proyecto móvil independiente del backend** `Yamil-28/Api-rest`. No debes pegar este `src/` dentro del `src/` de NestJS. Para tenerlos en el mismo repositorio coloca toda esta carpeta como `mobile/`.

## Iniciar en Windows / Visual Studio Code

1. Extraer ZIP y abrir la carpeta `cofre-mobile` en VS Code.
2. Abrir terminal PowerShell:

```powershell
npm install
Copy-Item .env.example .env
npx expo start
```

3. Ejecutar con **Expo Go** en el teléfono o presionar `w` para Expo Web, o usar:

```powershell
npm run web
```

4. Acceso inicial: pulsar **Entrar en modo demostración** (sin cuenta real). Verás Inicio, Paquetes, Pagos, Avisos, Perfil, Detalle, Observados, QR e Historial. Cambia entre comprador y comerciante.

## Conectar los endpoints de Render

Configura `.env` (no se sube a GitHub):

```dotenv
EXPO_PUBLIC_DATA_SOURCE=api
EXPO_PUBLIC_API_URL=https://api-rest-6an3.onrender.com
EXPO_PUBLIC_COMPRADOR_ID=1
EXPO_PUBLIC_COMERCIANTE_ID=1
```

Reinicia Expo después de modificar `.env` (`npx expo start --clear`). Los IDs son perfiles de prueba y **no sustituyen la autorización**. Actualmente Render bloquea los endpoints LO en producción con **403**, y el modo API no puede simular un login válido. Deben integrar el módulo común de Supabase Auth/JWT y la autorización de propietario para mostrar datos reales.

**Seguridad:** jamás introducir `SUPABASE_SECRET_KEY` o `sb_secret_*` en `.env` de Expo, en el paquete móvil o en el cliente web. Esa clave pertenece exclusivamente al backend Render.

## Funcionalidad implementada

- Login y registro visual de demostración (no crea cuentas reales).
- Inicio principal con banner naranja, resumen y cambio de rol.
- Mis paquetes con búsqueda y filtros por estados para comprador/comerciante (`LO`).
- Detalle normal del paquete, detalles de observado y seguimiento.
- Pagos del locker con filtros y totales (demo, falta integrar API).
- Avisos de estado por comprador/comerciante (`LO`, adaptados al JSON del backend).
- Código QR de recojo (demo, no valida ni abre un locker).
- Historial de entregas (demo, falta integrar API).
- Perfil con roles y cierre de sesión de demostración.
- Pantallas de carga, vacío, errores 401/403/500, navegación inferior.

## Estructura

```text
cofre-mobile/
  App.tsx                       # Enrutador central
  src/
    api/                        # BaseRepository + herencia HTTP/Mock + mappers
    components/                 # Tarjetas, textos, chips, botones, encabezados
    config/                     # Colores y entorno
    context/                    # Navegación, rol y estado de sesión
    domain/                     # Modelos y formatos
    hooks/                      # Solicitudes y estado de carga
    mocks/                      # Datos de demostración
    navigation/                 # Barra inferior
    modules/
      AUTH/                     # Login / registro demo
      AD/                       # Inicio
      AL/                       # Tarjeta de paquetes reutilizable
      LO/                       # MIS PAQUETES Y AVISOS (tu parte)
      FC/                       # Detalles y observados
      PG/                       # Pagos
      QR/                       # Código QR
      FG/                       # Historial
      PR/                       # Perfil
  docs/
    ARQUITECTURA.md
    GITHUB_PASO_A_PASO.md
```

## Cómo contribuir entre 6 integrantes

Lee `docs/GITHUB_PASO_A_PASO.md`. Usa carpetas por módulo y Pull Requests. Los identificadores son etiquetas de responsabilidad de módulos, **no adjudican de forma definitiva nombres ambiguos** de las capturas.

## Origen visual y límites

Figma: https://www.figma.com/design/PwSR3GfsTDJJHL8UiY4MET/Trabajo-en-clases?node-id=2464-897

El enlace no permitió extraer las capas y medidas exactas en esta sesión. El código recrea las pantallas reconocibles de las **imágenes adjuntas**; no es un export pixel-perfect del archivo Figma. Se ha priorizado una base editable, navegable e integrable. Para diferencias finas de tipografía, assets y espaciado se pueden cotejar posteriormente contra Dev Mode de Figma.
