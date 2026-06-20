# Fase 1 — Panel `/crear` (link-only)

**Estado:** completada y verificada en local; se despliega a Vercel con el push.

## Qué se hizo

- **`lib/geo.ts`**: `parseCoords(text)` portado y endurecido del mockup (coords sueltas, `@lat,lng`, `q=lat,lng`, `!3d!4d`, validación de rango ±90/±180) + `haversine()` para fases futuras.
- **`components/PoiForm.tsx`** (client): input de coordenadas con readout en vivo (Lat/Lng + pin que pasa a verde), botón "Generar aviso" deshabilitado hasta tener coords válidas, generación de `/visor?lat=&lng=`, **QR** (lib `qrcode`, a data-URL) y botón **Compartir** (`navigator.share` + fallback a portapapeles).
- **`app/crear/page.tsx`**: panel real con la estética editorial (reemplaza el placeholder de Fase 0).
- **`app/visor/page.tsx`**: placeholder que lee `lat`/`lng` (se reemplaza por el visor AR en Fase 2).
- **Tests**:
  - Unitarios (vitest): 9 casos de `parseCoords` y `haversine`.
  - E2E (Playwright): botón deshabilitado sin coords, generación de link + QR, texto basura no habilita.
- **CI**: añadido paso de tests unitarios (`vitest run`) antes del build.

## Decisiones / notas

- **Sin API de mapas / sin API key:** la coordenada se pega como texto (o link de Maps) y un parser la extrae. No se carga ningún mapa.
- **`qrcode` en dependencies** (se usa en el cliente, se bundlea).
- `/visor` queda como ruta dinámica (lee `searchParams`); las demás son estáticas.
- Vitest acotado a `lib/**/*.test.ts` para no colisionar con los specs de Playwright en `tests/`.

## Cómo verificar

- `npm run lint && npm run typecheck && npm run test:unit && npm run build` → verde.
- `npm run test:e2e` → 5 tests verdes.
- En el preview: `/crear` → pegar `-34.6037,-58.3816` → el botón se habilita → "Generar aviso" muestra el link `/visor?lat=...&lng=...` y un QR.

## Siguiente

Fase 2 — Visor AR client-only (A-Frame + AR.js locales) que ancla un cartel 3D animado en `lat`/`lng`, con pantalla "Activar cámara" (permisos iOS), HUD y manejo de errores.
