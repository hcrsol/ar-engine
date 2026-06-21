# Changelog

## Fase 3a — Visor robusto: snap por cercanía

- El cartel pasa a billboard hijo de la cámara que aparece al entrar en el radio
  del aviso (~25 m), independiente de la brújula y del anclaje geo de AR.js.
- HUD muestra distancia + precisión real del GPS (±m) y estado de cercanía.
- Plan de fases reescrito: Fase 3 = visor robusto en incrementos (3a/3b/3c).

## Fase 2 — Visor AR con cartel 3D

- A-Frame 1.3.0 + AR.js 3.4.7 vendorizados en `public/ar` (no CDN).
- `ARViewer`: pantalla "Activar cámara" (permisos iOS), escena `gps-new-camera` + cartel 3D animado anclado a lat/lng, HUD de GPS/distancia.
- Errores accionables: sin coords, permiso denegado, webview IG/WhatsApp, sin GPS.
- `/visor` monta el visor; E2E de intro y error de coordenadas.

## Fase 1 — Panel `/crear` (link-only)

- `lib/geo.ts`: parser de coordenadas (texto/link de Maps) + haversine, con tests.
- Panel `/crear` con readout en vivo, generación de link `/visor?lat=&lng=`, QR y compartir.
- Placeholder de `/visor` que lee las coordenadas.
- Tests unitarios (vitest, 9) + E2E del panel (Playwright); vitest añadido al CI.

## Fase 0 — Andamiaje + preview en Vercel

- Andamiaje Next.js 16 + React 19 + TypeScript + Tailwind v4 (App Router).
- Tokens de diseño y tipografías portados del mockup HTML.
- Landing (`/`) con la estética editorial; placeholder de panel (`/crear`).
- CI con lint + typecheck + build + smoke E2E (Playwright).
- README con límites de precisión y requisitos del visor AR documentados.
- PRD y plan de fases incorporados en `docs/`.
