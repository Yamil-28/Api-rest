# Incorporar al repositorio de los 6 integrantes SIN romper NestJS

> Ejemplo: tu rama `LO` de `Yamil-28/Api-rest`. Las carpetas `src/` del backend y de la app Expo NO deben mezclarse.

1. En VS Code abre PowerShell:

```powershell
cd "$HOME\Proyectos\Api-rest"
git fetch origin
git switch LO
git pull --ff-only origin LO
```

2. Extrae el ZIP proporcionado. Copia la carpeta `cofre-mobile` completa dentro del proyecto, renombrándola a `mobile`. Deberá verse:

```text
Api-rest/
  src/                 # Backend NestJS existente
  package.json         # Backend NestJS existente
  mobile/
    package.json       # Frontend Expo (OTRO package.json)
    App.tsx
    src/modules/LO/
    src/modules/AD/
    ...
```

3. Para levantar solo la app móvil:

```powershell
cd mobile
npm install
npx expo start
```

4. Para levantar el backend, regresa a la raíz:

```powershell
cd ..
npm run start:dev
```

5. Tras confirmar, guardar ÚNICAMENTE el frontend:

```powershell
git status
git add mobile
git commit -m "feat(LO): agregar frontend movil Cofre Express modular"
git push origin LO
```

6. El responsable crea `integracion` y cada integrante envía PR hacia ella. Se revisan conflictos en `App.tsx`, `src/api/` y componentes globales con un único responsable antes de fusionar `main`.

7. El servicio Render `api-rest-lo-ivan` desplegará **solo NestJS**; su raíz no cambia. La aplicación Expo se ejecuta aparte. No se deben cargar las claves `SUPABASE_SECRET_KEY` ni `LO_DEMO_MODE` al frontend.

## Modo de datos

- `EXPO_PUBLIC_DATA_SOURCE=mock`: todas las pantallas navegables con datos ficticios.
- `EXPO_PUBLIC_DATA_SOURCE=api`: solo los endpoints LO pueden consultar Render. Sin Auth real y verificación en NestJS mostrarán `403` de manera segura. Pagos e historial requieren completar los endpoints de sus integrantes.
