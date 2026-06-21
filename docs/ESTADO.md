# Estado del proyecto — bitácora

_Última actualización: 2026-06-21 (tarde). Commit de referencia: `1a91ccf`._

Documento vivo para retomar el trabajo. Resume **dónde estamos**, **qué aprendimos**, **en qué nos desviamos del plan** y **cómo seguir**.

---

## 0. Avance del 21-jun (tarde)

- **A1 + A2 hechos y validados en campo (Android, de día):** motor **multi-aviso** + **4 tipos de contenido** (texto/cartel, imagen, modelo 3D `.glb` pato, video) en `lib/ar/{types,scene,demo}` (inicio de la extracción del núcleo). **Modo demo** `/visor?demo=1` planta 4 avisos N/S/E/O alrededor del usuario.
- **Pulido aplicado:** alturas unificadas (+2 m, en metros reales separados del escalado), tamaños normalizados, debug detrás de `?debug=1`.
- **Fixes de campo:** `gpsMinDistance` 5→0 (el aviso se corría al caminar); distancia del demo 30→**10 m** (para espacios chicos); el demo se planta con **fix de GPS de alta precisión** (a 10 m el fix de red daba avisos a ~5 m).
- **Spike WebXR (Android) en `/spike` — VEREDICTO:** WebXR (immersive-ar/ARCore) es **más firme que el GPS** al caminar/atravesar. **Decisión: WebXR = capa de precisión para Android; GPS = base universal (y único camino en iPhone, que no soporta WebXR).** Para precisión en iOS sin app nativa: motor SLAM pago (8th Wall/Niantic). WebXR **no reemplaza** al GPS, lo complementa (GPS coloca, WebXR clava).
- **Límite GPS confirmado:** a corta distancia (pasar a 0-5 m) el GPS no clava el paso exacto; es inherente. Para "verlo desde lejos anclado" funciona sólido.
- **Pendiente inmediato:** elegir entre **A3 (panel para subir tus avisos)** vs **integrar WebXR al motor** (capa Android). Más adelante: A4 (iPhone), A5 (tarjeta de info), Supabase.

---

## 1. Dónde estamos

**Hito alcanzado:** el **visor AR georreferenciado FUNCIONA en terreno** (validado en Android/Chrome, de noche). El cartel "AR" aparece **anclado en su dirección real** (norte/sur/etc.), la flecha guía hacia él, y se mantiene fijo en su punto del mundo mientras el usuario gira. **Era el riesgo central del proyecto y está superado.**

**Fases:**
- ✅ **Fase 0** — Andamiaje Next.js 16 + Tailwind v4, landing, CI, deploy en Vercel.
- ✅ **Fase 1** — Panel `/crear` link-only: pega coords/link de Maps → genera `/visor?lat=&lng=` + QR + compartir.
- ✅ **Fase 2** — Visor AR (A-Frame 1.3.0 + AR.js 3.4.7 locales): pantalla "Activar cámara" (permisos iOS), HUD, errores accionables.
- 🟡 **Fase 3 — Visor robusto (en curso):**
  - ✅ 3a — Anclaje georreferenciado + **radio de aparición configurable** (`?r=`, default 100 m).
  - ✅ 3b — **Flecha de guía** + brújula + **HUD de debug** (brúj / rumbo / posición de la entidad).
  - ✅ Fix `gps-new-*` → `gps-projected-*` (ver aprendizajes).
  - ⬜ 3c — Autoajuste por `accuracy` / autocalibración de brújula por movimiento / anclaje fino oportunista. **Probablemente más liviano de lo previsto** porque la brújula respondió bien en campo.
- ⬜ **Fase 4** — Supabase: persistencia + subir campaña propia (imagen/video/3D) + avisos cercanos.
- ⬜ **Fase 5/6** — Cercanía avanzada, endurecimiento, docs finales.

**Deploy:** GitHub `hcrsol/ar-engine` → Vercel (push a `main` redeploya solo). CI (lint + typecheck + unit + build + E2E) en cada push.

**Verificación local hoy:** lint, typecheck, 16 unit (vitest), 7 E2E (Playwright) y build → verde.

---

## 2. Aprendizajes

1. **AR.js: usar `gps-projected-*`, no `gps-new-*`.** Con `gps-new-camera`/`gps-new-entity-place`, la entidad se proyectaba desde el origen (0,0) y aterrizaba a **~8 millones de metros** (`poi -7952558,3849270` en el debug) → invisible. `gps-projected-camera`/`gps-projected-entity-place` la coloca bien (`poi -8,-28` ≈ distancia real). La doc de AR.js ya señala `gps-projected` como alterno recomendado.
2. **Posición = GPS fusionado, con `accuracy`.** El navegador da UNA posición (no elegimos satélite vs red); la perilla es `enableHighAccuracy`. El **primer fix conviene pedirlo con baja precisión** (`enableHighAccuracy:false` + `maximumAge`) para resolver rápido por red (como Maps), y luego refinar. Cada lectura trae `accuracy` (±m) → mostrarla y usarla para decidir cuándo confiar.
3. **Brújula (heading) ≠ posición.** Son sensores distintos. En campo la brújula **respondió bien** (Android, orientación absoluta; iOS usa `webkitCompassHeading`). El HUD de distancia se alimenta de un **`watchPosition` propio**, no de eventos internos de AR.js (que pueden no dispararse).
4. **Robustez > calibración.** No sirve "calibrar a mi teléfono" (cada equipo varía). Sirve que el sistema **lea sensores en vivo y se adapte** por equipo. El objeto debe depender lo menos posible de la brújula.
5. **GPS de corta distancia es traicionero.** A 12 m, el error de GPS (±5–15 m) es del tamaño de la distancia → el rumbo se vuelve inestable. A **100 m, ±15 m son ~8°** → tolerable. Por eso el radio default 100 m no es solo UX, es donde el anclaje empieza a funcionar.
6. **Campo de visión:** el teléfono ve una franja angosta (~60–67°), mucho menos que la visión humana → de ahí la necesidad de la **flecha** (el aviso suele caer fuera de pantalla). Pendiente: igualar el FOV de la cámara virtual (~63°) para más naturalidad.
7. **Stack más nuevo que el PRD v1:** Next 16 (no 15), Tailwind v4 (no v3). El AR corre client-only por `<script>` desde `/public/ar`, desacoplado de React (se inyecta la escena por `innerHTML`).

---

## 3. Desviaciones respecto al plan original

- **El "snap pegado a la cámara" se descartó.** En 3a primero hice un billboard hijo de la cámara (aparecía frente a la vista, sin dirección). El usuario observó —con razón— que eso **rompe la georreferencia** (da igual norte/sur). Se **revirtió** al anclaje geo real con la cercanía solo como gatillo de aparición.
- **La "Fase 3 = prueba de campo" se transformó en "Fase 3 = visor robusto"** en incrementos (3a/3b/3c), porque la primera prueba reveló que el anclaje geo necesitaba trabajo, no solo un veredicto.
- **El radio de aparición pasó a ser configurable** (idea del usuario, estilo zoom de Maps), default 100 m, vía `?r=`.

---

## 4. Pendientes / cómo seguir mañana

**Pulido del visor (corto):**
- [ ] **Agrandar el cartel** (escala) — se ve chico a ~21 m.
- [ ] **Iluminación/emisivo** para que resalte (se vio apagado de noche).
- [ ] **Esconder el HUD de debug detrás de `?debug=1`** (hoy se muestra siempre).
- [ ] Igualar el **FOV** de la cámara virtual (~63°).
- [ ] Control de **zoom +/- del radio** en vivo (opcional).

**Validación:**
- [ ] Probar en **iPhone (Safari)** — permisos de orientación iOS, `webkitCompassHeading`.
- [ ] Probar de **día** y a **40–50 m**.

**Siguiente fase grande:**
- [ ] **Fase 4 — Supabase:** tabla `pois`, Storage, API `/api/pois`, subir campaña propia, panel `POST → /visor?id=`. Requiere que el usuario cree el proyecto Supabase y dé las 3 keys (intervención pendiente).

**3c (si hace falta):** autoajuste por `accuracy`, autocalibración de brújula por movimiento, anclaje fino oportunista. Evaluar tras validar iPhone — puede ser mínimo.

---

## 5. Datos útiles

- **Probar el visor:** `…/visor?lat=<lat>&lng=<lng>` (radio default 100 m). Variar radio: `&r=300` o `&r=40`.
- **HUD de debug (hoy siempre visible):** `brúj <heading>° · rumbo <bearing al aviso>° · poi <x>,<z>`. Si `poi` es chico (≈distancia) → bien colocado; si es gigante → mal proyectado.
- **Componentes AR clave** en `components/ARViewer.tsx`: `gps-projected-camera` + `gps-projected-entity-place`.
- **Scripts:** `npm run dev | build | typecheck | lint | test:unit | test:e2e`.
