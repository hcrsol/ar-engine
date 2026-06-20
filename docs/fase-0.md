# Fase 0 — Andamiaje + preview en Vercel

**Estado:** completada en local (pendiente conectar Vercel — intervención 1/3).

## Qué se hizo

- `create-next-app`: **Next.js 16.2.9 + React 19.2 + TypeScript + Tailwind v4** (App Router, sin `src/`, alias `@/*`).
- Estructura de carpetas del PRD: `components/ui`, `lib`, `public/ar`, `public/models`, `tests`, `docs`.
- **Tokens de diseño** portados del mockup `panel_motor_geolocalizacion.html` a `app/globals.css` (Tailwind v4 `@theme`): paleta (`paper/ink/soft/line/card/clay/clay-soft/ok`) y tipografías (Fraunces / Inter / JetBrains Mono vía `next/font/google`).
- **Landing** (`app/page.tsx`) con la estética editorial: kicker, título Fraunces, 3 pasos, CTA a `/crear`.
- **Placeholder** de panel (`app/crear/page.tsx`) para que el CTA no muera en 404 (la Fase 1 lo reemplaza).
- `lib/types.ts`: tipos compartidos (`Poi`, `MediaType`, `LatLng`).
- **CI** (`.github/workflows/ci.yml`): lint + typecheck + build + smoke E2E (Playwright) en cada push.
- **Smoke E2E** (`tests/landing.spec.ts`): la landing carga y el CTA navega a `/crear`.
- `.env.local.example`, `README.md` del proyecto con límites de precisión documentados.

## Decisiones / notas

- **Versiones más nuevas que el PRD v1:** Next 16 (no 15) y Tailwind v4 (no v3). Compatible con todo el plan; el AR irá client-only vía `<script>` desde `/public/ar`, desacoplado de React.
- **Repo:** raíz = `ar-engine/` (el `create-next-app` ya inicializó git aquí). Los docs viven dentro del repo en `docs/`. Vercel puede conectarse sin configurar "root directory".
- Documentos de origen (`borrador pdr.md.txt`, `panel_motor_geolocalizacion.html`) quedan en la carpeta padre como material de referencia.

## Cómo verificar

- `npm run lint && npm run typecheck && npm run build` → verde.
- `npx playwright install chromium && npm run test:e2e` → 2 tests verdes.
- Una vez en Vercel: la landing responde 200 y renderiza el título.

## Siguiente

Fase 1 — Panel `/crear` link-only (parser de coordenadas, QR, compartir).
