# Plan de construcción por fases — Motor de Publicidad AR Geoanclada

**Objetivo del plan:** llegar a un **preview funcional en Vercel** con la mínima intervención tuya, validando primero lo difícil (WebAR geoanclado). Cada fase tiene checkpoints **auto-verificables** y, donde es inevitable, un checkpoint que requiere tu acción, claramente marcado.

## Leyenda
- **[AUTO]** — lo verifica Claude Code solo (build, typecheck, lint, tests, deploy). No necesitas hacer nada.
- **[TÚ]** — requiere una acción tuya, irreductible. Hay solo **3 en todo el proyecto**.
- 🟢 **Entregable** — punto donde tienes algo que ver/usar.

## Tus 3 únicas intervenciones (todo lo demás es automático)
1. **Conectar Vercel una vez** (Fase 0) — autorizar el deploy del repo.
2. **Prueba de campo del AR** (Fase 3) — caminar a la coordenada con el teléfono y confirmar que ves la animación. *Es la prueba que decide si el enfoque sirve.*
3. **Dar credenciales de Supabase** (Fase 4) — solo cuando pasemos a persistencia.

## Automatización transversal (se monta en Fase 0, corre en todas)
- **CI (GitHub Actions):** en cada push → `typecheck` + `lint` + `build` + smoke tests (Playwright). Si algo falla, la fase no se da por buena.
- **Vercel:** deploy de **preview automático** en cada push; URL nueva por commit.
- **Documentación automática:** al cerrar cada fase, Claude Code escribe un `docs/fase-N.md` (qué se hizo, cómo verificarlo, versiones, decisiones) y actualiza el `README.md` y un `CHANGELOG.md`.

---

## FASE 0 — Andamiaje + preview vacío en Vercel
**Meta:** repo en pie, landing con la estética del HTML, CI verde, preview vivo en Vercel.

- `create-next-app` (App Router, TS, Tailwind), estructura de carpetas del PRD §3.
- Landing `/` portando la estética del HTML (paleta, tipografías Fraunces/Inter/JetBrains Mono).
- Tokens de diseño del HTML a Tailwind (`--paper`, `--ink`, `--clay`, etc.).
- `git init` + repo + GitHub Actions (typecheck/lint/build/Playwright).
- `.env.local.example`, `next.config.js`, README inicial.

**Checkpoints**
- [AUTO] `npm run build` y `typecheck` pasan; lint limpio.
- [AUTO] Playwright: la landing carga y muestra el título.
- [TÚ] **(intervención 1/3)** Conectar el repo a Vercel → primer preview.
- [AUTO] El preview responde 200 y renderiza la landing.

🟢 **Entregable:** URL de preview en Vercel con la landing.

---

## FASE 1 — Panel `/crear` (link-only)
**Meta:** portar el HTML a un componente React funcional, sin backend.

- `CoordinateInput.tsx` con el parser de coords/link de Google Maps (reutilizar la lógica del HTML) → `lib/geo.ts`.
- `PoiForm.tsx`: ubicación + (campaña = animación por defecto en esta pasada) + botón "Generar aviso".
- Generar `/visor?lat=&lng=`, mostrar el link, **QR** (lib `qrcode`) y botón **Compartir** (`navigator.share` + fallback clipboard).
- Validación: botón deshabilitado hasta tener coords válidas; mensajes de error en la voz de la interfaz.

**Checkpoints**
- [AUTO] Playwright: pegar `"-34.6037,-58.3816"` y un link de Maps → el botón se habilita y el link generado es correcto.
- [AUTO] Parser cubierto por tests unitarios (`@`, `q=`, `!3d!4d`, par suelto, fuera de rango).
- [AUTO] build/typecheck/lint verdes; preview actualizado.

🟢 **Entregable:** panel en el preview que genera links + QR.

---

## FASE 2 — Visor AR con animación básica (el núcleo)
**Meta:** `/visor?lat=&lng=` ancla un modelo GLB animado en esa coordenada. **Aquí se prueba la magia.**

- `app/visor/page.tsx` client-only (dynamic import sin SSR).
- Cargar A-Frame + AR.js **locales** desde `/public/ar`; documentar versiones exactas validadas.
- Pantalla "Activar cámara" → dispara permisos iOS (`DeviceOrientationEvent.requestPermission`) tras gesto.
- `ARViewer.tsx`: `gps-camera` + una entidad `gltf-model` animada anclada a `lat`/`lng` del URL; modelo en `/public/models`.
- **HUD:** GPS actual, distancia al punto, estado de brújula.
- **Errores accionables:** sin GPS, permiso denegado, webview IG/WhatsApp (detectar UA → "abre en Safari/Chrome").

**Checkpoints**
- [AUTO] Playwright: `/visor?lat=..&lng=..` carga sin error de JS; aparece la pantalla "Activar cámara"; los estados de error se muestran al simular permisos denegados.
- [AUTO] build/typecheck/lint verdes; preview actualizado.

🟢 **Entregable:** preview completo de la **primera pasada** (panel → link → visor con AR).

---

## FASE 3 — Visor robusto (reescrita tras la prueba de campo)

**Por qué cambió:** la primera prueba de campo (Fase 2) mostró que el **anclaje geo puro es frágil** — depende del GPS de corta distancia y, sobre todo, de la **brújula**, que varía por equipo y no se puede "calibrar" de forma universal. El objetivo se redefine: **que cualquier usuario, sin importar la calibración de su teléfono, vea el aviso con alta probabilidad.**

**Principio de diseño:** depender lo menos posible del sensor más caprichoso (la brújula). Robustez por capas que se respaldan, con autoajuste en vivo por equipo (no calibración manual). Cada incremento termina en una prueba de campo (intervención tuya, ligera).

### 3a — Snap por cercanía + precisión real *(EN CURSO / primer incremento)*
- El cartel deja de anclarse por GPS/brújula: es un **billboard hijo de la cámara** que **aparece al entrar en el radio del aviso** (`SNAP_RADIUS`, ~25 m). Independiente de la brújula → apuntas y está ahí.
- HUD muestra **distancia + `accuracy` real (±m)** de *cada* equipo, en vivo (diagnóstico que generaliza, no tuning personal).
- [AUTO] lint/typecheck/build/E2E (intro + error de coords).
- [TÚ] Campo: caminar al punto; al entrar en el radio, ¿aparece el cartel? ¿Qué `±m` real marca el GPS?

### 3b — Flecha de guía tolerante
- Flecha ◀▶ en el HUD que indica hacia dónde girar (rumbo al aviso vs. brújula), diseñada con **tolerancia ancha** (no exige precisión de grados).
- [TÚ] Campo: ¿la flecha ayuda a orientarte aunque la brújula no sea perfecta?

### 3c — Autoajuste en vivo + anclaje fino oportunista
- **Gating por `accuracy`**: el sistema decide en cada equipo cuándo confiar en el anclaje fino.
- **Autocalibración por movimiento**: al caminar, comparar el rumbo real (GPS) con la brújula para corregir el desvío de *ese* teléfono, solo (calibración que generaliza por física).
- Anclaje geo real (A) como **mejora oportunista** cuando las condiciones dan.
- [TÚ] Campo: validación final del visor robusto en iOS (Safari) y Android (Chrome).

🟢 **Entregable:** visor que cualquiera puede usar para llegar al aviso y verlo, con degradación elegante.

> D (marcador/QR físico) y E (WebXR + ARCore Geospatial, precisión real) quedan como evolución futura — E ya estaba en el PRD.

---

## FASE 4 — Persistencia con Supabase
**Meta:** avisos reales con media subida, persistidos. El panel pasa a `POST → /visor?id=`.

- [TÚ] **(intervención 3/3)** Crear proyecto Supabase y darme las 3 keys (`URL`, `ANON`, `SERVICE_ROLE`).
- Tabla `pois` (PRD §4) + bucket `media` (lectura pública).
- `lib/supabase.ts`; `app/api/pois/route.ts` (POST/GET) y `app/api/pois/[id]/route.ts` (GET/DELETE lógica).
- `MediaUpload.tsx`: subida real (JPG/PNG/MP4/GLB/GLTF) a Storage vía API server-side.
- Panel: añadir título, texto, link "Ver más", escala; "Generar" → POST → `/visor?id=...`.
- Protección mínima del POST (`POIS_WRITE_SECRET` / rate-limit).

**Checkpoints**
- [AUTO] Tests de API: POST inserta fila y devuelve id; GET por id; validación de payload rechaza lat/lng faltantes.
- [AUTO] Playwright: crear un aviso end-to-end contra un proyecto Supabase de prueba.
- [AUTO] build/typecheck/lint verdes; preview actualizado.

🟢 **Entregable:** crear avisos reales con media y verlos por `/visor?id=`.

---

## FASE 5 — Avisos cercanos + tarjeta de info
**Meta:** el visor sin parámetros descubre y muestra los avisos cercanos.

- `GET /api/pois?lat&lng&radius` con Haversine (`lib/geo.ts`), ordenado por distancia (default 500 m).
- Visor sin parámetros: pide ubicación → consulta cercanos → renderiza varias entidades por `media_type`.
- Tarjeta de info al tocar un aviso, con CTA "Ver más".
- HUD: distancia al más cercano.

**Checkpoints**
- [AUTO] Tests: Haversine y orden por distancia; el endpoint filtra por radio.
- [AUTO] Playwright: el visor sin parámetros pide ubicación y llama al endpoint.
- [TÚ, opcional en terreno] Dos avisos creados, ambos aparecen al estar cerca.

🟢 **Entregable:** descubrimiento automático de avisos cercanos.

---

## FASE 6 — Endurecimiento + documentación final
**Meta:** dejarlo presentable y honesto.

- README completo: cómo correr, limitaciones de precisión (GPS, heading, altura) **explícitas, no ocultas**, versiones de AR.js/A-Frame.
- `.env.local.example` final; nota sobre webviews; QR/compartir pulidos.
- Repaso de accesibilidad/copys; estados de error revisados.
- `CHANGELOG.md` y `docs/` al día.

**Checkpoints**
- [AUTO] CI completa verde; Lighthouse básico sobre la landing.
- [AUTO] Build de producción del preview estable.

🟢 **Entregable:** preview en Vercel listo para mostrar, documentado.

---

## Resumen del flujo de mínima intervención

| Fase | Qué obtienes | Tu intervención |
|---|---|---|
| 0 | Landing en Vercel | Conectar Vercel (1/3) |
| 1 | Panel genera links + QR | — |
| 2 | Visor AR con animación | — |
| 3 | **Veredicto del AR real** | Prueba de campo (2/3) |
| 4 | Avisos reales persistidos | Keys de Supabase (3/3) |
| 5 | Avisos cercanos automáticos | — (opcional campo) |
| 6 | Preview documentado y pulido | — |

**Hasta la Fase 2 inclusive = "primera pasada con animación básica" + preview en Vercel**, con una sola intervención tuya (conectar Vercel). La prueba de campo (Fase 3) decide si invertimos en el backend.
