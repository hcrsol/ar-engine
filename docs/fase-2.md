# Fase 2 — Visor AR con cartel 3D (el núcleo)

**Estado:** construido y verificado en local (todo lo no-AR). La validación real del anclaje es la **prueba de campo (Fase 3)** — el AR solo se valida en la calle.

## Qué se hizo

- **Librerías AR locales** en `public/ar/` (no CDN, por estabilidad):
  - `aframe.min.js` — **A-Frame 1.3.0**.
  - `aframe-ar.js` — **AR.js 3.4.7** (build de A-Frame, location-based).
  - Combo elegido tras verificar la doc de AR.js: A-Frame ≥1.4 rompe AR.js por el salto de THREE.js.
- **`components/ARViewer.tsx`** (client):
  - Pantalla **"Activar cámara"** que dispara, tras gesto del usuario:
    - permiso de orientación iOS (`DeviceOrientationEvent.requestPermission`),
    - permiso de cámara (`getUserMedia`).
  - Carga A-Frame y AR.js de forma diferida e inyecta la escena por `innerHTML` (para que React no pelee con los custom elements de A-Frame).
  - Escena: **`gps-new-camera`** + entidad **`gps-new-entity-place`** anclada a `lat`/`lng`, con un **cartel 3D** (poste + panel terracota + texto "AR") y animación de rotación continua (visible desde cualquier ángulo, mitiga la incertidumbre de brújula).
  - **HUD**: GPS actual + distancia al aviso (vía `haversine`, escuchando `gps-camera-update-position`).
  - **Errores accionables**: faltan coordenadas, permiso denegado, webview IG/WhatsApp (detección por UA), sin señal GPS (timeout 15 s), genérico. Con "Reintentar" donde aplica.
- **`app/visor/page.tsx`**: extrae `lat`/`lng` del link y monta el `ARViewer`.
- **E2E** (Playwright): la pantalla "Activar cámara" aparece con coordenadas; sin coordenadas, al activar avisa que faltan. (La cámara/AR real no se testea en headless — es la prueba de campo.)

## Por qué se eligió cada cosa

- **`gps-new-*`** sobre `gps-camera`/`gps-projected-*`: es la API recomendada por AR.js (bug fixes, código más simple).
- **Cartel con primitivas A-Frame** (no un `.glb`): cero binarios que mantener, funciona offline y respeta la elección "cartel/billboard 3D simple".
- **Rotación continua**: dado que el heading puede estar descalibrado, un objeto que gira es más fácil de localizar que uno orientado a un punto fijo.
- **Inyección por `innerHTML`**: patrón estándar para A-Frame dentro de React sin conflictos de hidratación.

## Cómo verificar

- Local: `npm run lint && npm run typecheck && npm run test:unit && npm run build && npm run test:e2e` → todo verde (9 unit + 7 E2E).
- Preview: `/visor?lat=..&lng=..` muestra "Activar cámara"; al tocar pide cámara/ubicación.

## Pendiente: prueba de campo (Fase 3 — intervención tuya)

Abrir un link `/visor?lat=..&lng=..` en el teléfono, ir a la coordenada, apuntar y confirmar:
- ¿Aparece el cartel anclado al lugar?
- ¿El heading lo coloca de forma razonable (no detrás de ti / saltando)?
- Probar iOS (Safari) y Android (Chrome).

El resultado decide si seguimos con WebAR puro o ajustamos (calibración, escala, distancia).
