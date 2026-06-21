# Motor de Publicidad AR Geoanclada

Aplicación web que permite **anclar una campaña publicitaria a un punto del mundo real** y verla en realidad aumentada desde el navegador del teléfono, sin instalar ninguna app.

> Documentación de producto y plan de construcción: ver [`docs/PRD.md`](docs/PRD.md) y [`docs/PLAN-DE-FASES.md`](docs/PLAN-DE-FASES.md).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind v4** (tokens de diseño CSS-first)
- **AR.js / A-Frame** (visor WebAR, client-only) — se incorpora en la Fase 2
- **Supabase** (persistencia) — se incorpora en la Fase 4
- Desplegado en **Vercel**

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:3000
```

Otros scripts:

```bash
npm run build        # build de producción
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test:e2e     # smoke E2E con Playwright (requiere: npx playwright install)
```

## Estado actual (Fase 2 — primera pasada completa)

- Landing (`/`) con la estética del mockup.
- Panel (`/crear`): pega coordenadas o link de Maps → genera link `/visor?lat=&lng=` + QR + compartir.
- Visor AR (`/visor`): "Activar cámara" (permisos iOS), cartel 3D animado anclado a la coordenada (A-Frame + AR.js locales), HUD de GPS/distancia y errores accionables.
- CI (GitHub Actions): lint + typecheck + unit (vitest) + build + E2E (Playwright) en cada push.

> Pendiente: **prueba de campo** del AR en el teléfono (Fase 3) antes de invertir en persistencia (Supabase, Fase 4).

## Límites de precisión (documentados, no ocultos)

El WebAR puro tiene límites reales que afectan al producto y que **no se ocultan**:

- **GPS horizontal:** ~5–15 m de error. El aviso puede "flotar" o desplazarse respecto al punto exacto.
- **Brújula / heading:** la orientación absoluta es inestable, sobre todo en Android Chrome. Es el factor que más afecta a que el aviso aparezca "donde debe". Puede requerir calibrar moviendo el teléfono en forma de 8.
- **Altura:** no se ancla con fidelidad en WebAR puro. El campo se guarda como referencia, pero el render coloca el contenido a la altura aproximada de la cámara. La precisión vertical real queda para una fase futura con ARCore Geospatial.

## Requisitos del visor AR

- **HTTPS obligatorio** (cámara/GPS/orientación). Vercel lo da automático.
- **iOS:** el permiso de orientación se pide tras un gesto del usuario (botón "Activar cámara").
- **No funciona** dentro de los webviews de WhatsApp/Instagram en iOS → abrir en Safari/Chrome.
