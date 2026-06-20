# PRD — Motor de Publicidad AR Geoanclada

**Versión:** 2.0 (auditada y reestructurada)
**Destino:** Claude Code — construcción completa desde cero.
**Cambio principal vs v1.0:** estrategia de construcción "de-riesgar primero". La primera pasada valida lo difícil (WebAR geoanclado) con un visor link-only y una animación por defecto; la persistencia (Supabase) y los avisos cercanos llegan después, una vez probado el AR en terreno.

---

## 0. Objetivo (la idea, en una frase)

Permitir anclar una **campaña publicitaria a un punto del mundo real** y que **cualquiera, sin instalar nada**, abra un link en el navegador del teléfono, apunte la cámara al lugar y vea la campaña flotando en realidad aumentada.

Tres capacidades:
1. **Crear** un aviso AR anclado a una coordenada (lat, lng, altura) con contenido (imagen, video o modelo 3D) y una tarjeta de info.
2. **Visualizar** ese aviso en el navegador del teléfono, anclado en el espacio real, sin app.
3. **Detectar** automáticamente los avisos cercanos al usuario (requiere backend).

**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + AR.js/A-Frame + Vercel. Supabase se incorpora en la fase de persistencia (no en la primera pasada).

---

## 1. Estrategia de construcción (lo que cambió respecto a v1.0)

El PRD v1.0 mezclaba dos arquitecturas: el HTML adjunto genera un link con coords en la URL (sin backend); el texto describía persistencia en Supabase con `/visor?id=`. **Ambas son válidas, pero en distinto momento.**

- **Pasada 1 (link-only):** el visor lee `lat`/`lng` del URL y ancla un modelo 3D animado incluido en el repo. Sin Supabase, sin uploads, sin API keys. Objetivo: **probar que el WebAR geoanclado funciona en el teléfono real** y tener un preview en Vercel cuanto antes.
- **Pasada 2 (persistencia):** se añade Supabase (tabla `pois`, Storage, API), uploads reales, y el panel pasa a `POST → /visor?id=`.
- **Pasada 3 (cercanía):** el visor sin `id` consulta avisos cercanos por GPS y renderiza varios.

Esta separación responde a la prioridad real: **el riesgo #1 del proyecto es la fiabilidad de la brújula/heading en WebAR, no la persistencia.** Se valida primero, barato.

---

## 2. Restricciones técnicas que el constructor DEBE respetar

- **HTTPS obligatorio.** Cámara, GPS y orientación solo en contexto seguro. Vercel lo da automático; en local usar `https` o túnel (ngrok/cloudflared).
- **iOS:** `DeviceOrientationEvent.requestPermission()` debe llamarse tras un gesto del usuario. El visor abre con una pantalla "Activar cámara" que dispara el permiso.
- **Webviews:** no funciona dentro de WhatsApp/Instagram en iOS. Detectar y mostrar aviso para abrir en Safari/Chrome.
- **Precisión real (documentar, no ocultar):**
  - GPS horizontal ~5–15 m → el aviso puede "flotar"/saltar. Es inherente al WebAR puro.
  - **Heading/brújula:** en Android Chrome la orientación absoluta es inestable; en iOS se usa `webkitCompassHeading`. Es el factor que más afecta a que el aviso aparezca "donde debe". Incluir una nota/UX de calibración.
  - **Altura:** no se ancla con fidelidad en WebAR puro. El campo se guarda como referencia pero el render lo coloca a la altura aproximada de la cámara. Precisión vertical real → fase futura con ARCore Geospatial.
- **Sin `localStorage` como fuente de verdad.** En pasada 1 la "fuente" es el URL; desde pasada 2, Supabase. `localStorage` solo para estado efímero de UI.
- **Sin auth en v1:** cuando exista el `POST /api/pois`, queda abierto. Mitigar con un secreto compartido o rate-limit mínimo para evitar spam en el preview.

---

## 3. Estructura de carpetas objetivo

```
/ar-engine
├── app/
│   ├── page.tsx                 # Landing
│   ├── crear/page.tsx           # Panel de creación de avisos
│   ├── visor/page.tsx           # Visor AR (client-only)
│   ├── api/
│   │   ├── pois/route.ts        # GET (cercanos) / POST (crear)   [pasada 2+]
│   │   └── pois/[id]/route.ts   # GET / DELETE de un aviso         [pasada 2+]
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ARViewer.tsx             # Wrapper del motor AR.js (sin SSR)
│   ├── PoiForm.tsx              # Formulario de creación
│   ├── CoordinateInput.tsx      # Pegar coords / link Google Maps (parser)
│   ├── MediaUpload.tsx          # Subida a Supabase Storage         [pasada 2+]
│   └── ui/                      # Botones, inputs, etc.
├── lib/
│   ├── geo.ts                   # Haversine, filtrado por radio, bearing, parser coords
│   ├── supabase.ts             # Cliente Supabase                  [pasada 2+]
│   └── types.ts                 # Tipos compartidos (Poi, MediaType…)
├── public/
│   ├── ar/                      # AR.js/A-Frame locales (no CDN)
│   └── models/                  # Modelo GLB animado por defecto (pasada 1)
├── .env.local.example
├── next.config.js
└── README.md
```

---

## 4. Modelo de datos (Supabase) — desde pasada 2

Tabla `pois`:

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (pk) | default `gen_random_uuid()` |
| created_at | timestamptz | default `now()` |
| title | text | título de la tarjeta |
| body | text | descripción |
| link_url | text | CTA "Ver más" (nullable) |
| lat | double precision | obligatorio |
| lng | double precision | obligatorio |
| altitude | double precision | default 0 |
| media_type | text | `'image' \| 'video' \| 'model'` |
| media_url | text | URL en Supabase Storage |
| scale | double precision | default 12 |
| active | boolean | default true |
| owner_id | uuid | nullable en v1 (sin login) |

- **Storage bucket** `media` (público para lectura). Subida vía API server-side con service role.
- **Índice geográfico:** en v1 basta `lat`/`lng` con filtro Haversine en el servidor. Si crece, migrar a PostGIS (`geography` + `ST_DWithin`).

---

## 5. Páginas y comportamiento

### 5.1 Landing (`/`)
Estética del HTML adjunto (cálida, editorial). Explica la idea en una frase y lleva a `/crear`.

### 5.2 Panel de creación (`/crear`)
Evoluciona el HTML adjunto manteniendo su estética. Campos:

- **Ubicación:** pegar coordenadas o link de Google Maps (parser ya existente en el HTML). *(Mapa interactivo = mejora opcional posterior.)*
- **Campaña / media:** en pasada 1, animación por defecto (sin upload). En pasada 2, subida real a Storage (JPG/PNG/MP4/GLB/GLTF).
- **Tarjeta:** título, texto, link "Ver más" *(pasada 2)*.
- **Tamaño aparente (scale)** *(pasada 2)*.

Comportamiento:
- **Pasada 1:** "Generar aviso" → produce `/visor?lat=&lng=` + QR + compartir.
- **Pasada 2:** "Generar aviso" → `POST /api/pois` → persiste → devuelve `/visor?id=...` + QR.
- Validación: lat/lng obligatorios; (media obligatoria desde pasada 2); feedback de error claro en la voz de la interfaz.

### 5.3 Visor AR (`/visor`)
- **Client-only** (dynamic import sin SSR — A-Frame toca `window`).
- Pantalla de inicio con botón "Activar cámara" (dispara permisos iOS).
- Modos:
  - `?lat=&lng=` *(pasada 1)*: ancla la animación por defecto en esa coordenada.
  - `?id=<uuid>` *(pasada 2)*: muestra un aviso específico (link/QR).
  - sin parámetros *(pasada 3)*: consulta `/api/pois?lat=&lng=&radius=` y renderiza todos los avisos activos cercanos.
- **HUD:** posición GPS, distancia al aviso más cercano, estado de brújula.
- **Tarjeta de info** al tocar un aviso, con CTA "Ver más" *(pasada 2+)*.
- **Manejo de errores accionable:** sin GPS, permiso denegado, sin avisos cerca, webview IG/WhatsApp.

---

## 6. API (desde pasada 2)

- `GET /api/pois?lat&lng&radius` → avisos activos dentro del radio (default 500 m), ordenados por distancia.
- `POST /api/pois` → crea aviso (valida payload, sube media, inserta fila). Protegido con secreto/rate-limit mínimo.
- `GET /api/pois/[id]` → un aviso.
- `DELETE /api/pois/[id]` → baja lógica (`active=false`).

---

## 7. Motor AR (componente `ARViewer`)

- A-Frame + AR.js (componentes `gps-camera` y `gps-entity-place`). **Fijar versiones compatibles y servirlas desde `/public/ar` (no CDN).** *(Validar combinación A-Frame/AR.js durante el scaffolding; documentar las versiones exactas usadas.)*
- **Pasada 1:** una entidad `gltf-model` con animación de rotación anclada a `lat`/`lng` del URL.
- **Pasada 2+:** una entidad por POI según `media_type`:
  - `image` → `a-image` con `look-at`.
  - `video` → `a-video` (textura de video, `muted`+`autoplay`+`playsinline`).
  - `model` → `a-entity gltf-model` con animación.
- Escala por `scale`. Click en la entidad → callback que abre la tarjeta.
- Escuchar `gps-camera-update-position` para distancia/HUD.

---

## 8. Variables de entorno (`.env.local.example`)

```
# Pasada 2+
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
# Protección mínima del POST
POIS_WRITE_SECRET=
```

---

## 9. Fuera de alcance v1 (fases siguientes)

- Login / multi-tenant / owner real.
- Precisión con ARCore Geospatial (altura real).
- Métricas (impresiones, taps, conversión).
- Moderación, exclusividades, lógica de campañas pagadas.
- Panel de cliente/agencia autoservicio con facturación.
- Mapa interactivo de selección de coordenada (mejora del panel).

---

## 10. Criterios de aceptación

**Pasada 1 (primer entregable, preview en Vercel):**
- Genero un link desde el panel y obtengo `/visor?lat=&lng=` + QR.
- Abro el link en el teléfono, voy al lugar, apunto y veo la animación anclada, sobre HTTPS, sin instalar nada, en iOS (Safari) y Android (Chrome).
- Las limitaciones de precisión están documentadas en el README, no ocultas.

**Pasada 2:**
- Creo un aviso con media real y se persiste; el link `/visor?id=` lo muestra.

**Pasada 3:**
- El visor sin parámetros muestra automáticamente los avisos cercanos.

> **Regla de oro:** el motor AR **solo se valida en la calle**, no en el navegador de escritorio. No se da por buena una pasada de AR sin verificación en dispositivo real en terreno.
