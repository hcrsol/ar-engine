# Roadmap del Motor AR

_Plan vivo, orientado a producto. Actualizado 2026-06-21._

**Dónde estamos:** visor de **un** aviso, geoanclado (`gps-projected`), con flecha de guía, HUD + debug y radio configurable. Funciona en Android en campo.

**Principio:** A) hacerlo sólido y completo → B) ordenarlo para extraer → C) datos reales → D) convertirlo en motor embebible. Cada paso se valida **en campo**. El motor se escribe **agnóstico del renderer** (AR.js hoy; LocAR/WebXR mañana sin reescribir).

---

## Parte A — Robustecer el motor

### A1 · Motor multi-aviso + tipos de contenido
- **Qué:** el motor toma una **lista** de avisos (no uno) y renderiza cada uno según su **tipo**: imagen, video o 3D (`.glb`). Cada aviso con sus propiedades: lat/lng, tipo, URL del contenido, **tamaño/escala**, **radio de aparición**.
- **Objetivo:** que el motor sea **genérico y configurable por aviso** — cualquier cantidad, cualquier tipo, cada uno con su tamaño y distancia. Es la base de todo lo demás.
- **Verificable:** pasarle una lista de prueba y ver los 3 tipos, cada uno en su lugar.
- **Nota:** el contenido de URLs externas necesita **CORS** (texturas/video/glb cross-origin); preverlo desde ya.

### A2 · Modo demo N/S/E/O con 4 tipos distintos
- **Qué:** un modo que **planta 4 avisos alrededor tuyo** —norte, sur, este, oeste, a ~30 m— **cada uno de un tipo distinto** (ej.: imagen al N, video al E, 3D al S, otro al O). Calculados desde tu ubicación, **sin backend**.
- **Objetivo:** **estresar la orientación en todos los rumbos a la vez** (si el norte anda pero el este está corrido, se ve al instante) **y** validar los tipos de contenido juntos. Es nuestro mejor test de robustez de dirección.
- **Verificable:** en campo, girar 360° y encontrar los 4, cada uno en su rumbo y su tipo bien renderizado.

### A3 · Panel v2 — subís TUS avisos
- **Qué:** extender `/crear` para que **vos** compongas avisos: **ubicación** a elección (pegar coords / "mi ubicación"), **tipo** (imagen/video/3D por **URL** del contenido que creás en otras plataformas), **tamaño** y **distancia/radio** por aviso. Podés agregar **varios**. Genera un **link** que los lleva (sin backend aún: encodeados en la URL o guardados en el teléfono).
- **Objetivo:** que **vos** crees avisos con **material real**, en **tus locaciones**, con **distintos tamaños y distancias**, y los ajustemos hasta que **se vean bien** — tu idea tocable, sin esperar el backend.
- **Verificable:** armás 2-3 avisos tuyos, generás el link, los ves en campo bien ubicados y dimensionados.

### A4 · Probar en varios aparatos
- **Qué:** validar en **iPhone/Safari** (otra API de orientación, permisos iOS) y **Android**, de **día**, a **distintas distancias** (cerca y 40-50 m).
- **Objetivo:** confirmar que el motor es **robusto entre equipos y condiciones**, no solo en tu Android de noche. Acá medimos qué tan bien anda la orientación en cada plataforma.
- **Verificable:** el demo N/S/E/O funciona aceptablemente en iPhone y Android.

### A5 · Tarjeta de info al tocar
- **Qué:** tocar un aviso abre una **tarjeta** con título, texto y CTA "Ver más" (link).
- **Objetivo:** que el aviso sea **interactivo y útil como publicidad**, no solo decorativo.
- **Verificable:** toco un aviso y se abre su tarjeta con su CTA.

### A6 · Pulir naturalidad / que "se vea bien"
- **Qué:** **tamaño** correcto por distancia, **iluminación/emisivo** (que resalte de noche), **FOV** de cámara (~63°) para que se sienta clavado, **escalado por distancia** (legible de lejos y de cerca), animaciones, y **esconder el debug** detrás de `?debug=1`.
- **Objetivo:** que la experiencia se vea **profesional y anclada**, no de prueba.
- **Verificable:** a 10, 30 y 50 m el aviso se ve bien y "pegado" al lugar.

### A7 · Señal y degradación elegante (gating)
- **Qué:** usar la **precisión real (`accuracy`)** para decidir en vivo: con señal buena, anclar; con señal pobre, avisar ("señal débil, acercate") en vez de mostrar algo mal ubicado.
- **Objetivo:** que el motor **nunca muestre algo claramente mal** — que se adapte a la señal de cada equipo/lugar y lo comunique.
- **Verificable:** con GPS malo, el motor degrada con un mensaje útil, no con un aviso flotando mal.

### A8 · Orientación robusta — escalar SOLO si hace falta _(última prioridad)_
- **Qué:** si A2/A4 muestran que el rumbo patina, escalar en orden: (1) **sensor de orientación fusionado** (`AbsoluteOrientationSensor`: gyro+accel+mag, mucho más estable que la brújula sola — upgrade barato), (2) **autocalibración por GPS** (al caminar, el rumbo de avance corrige el desvío, **sin puntos fijos conocidos**).
- **Objetivo:** que cualquiera apunte y el aviso esté en su dirección, **sin calibración manual**.
- **Nota:** **opcional, último**. Descartamos la "alineación a un punto conocido" (estilo apps de estrellas): no tenemos referencias fijas. La autocalibración por GPS **no** necesita puntos fijos.

---

## Parte B — Dejar el motor "listo para extraer" (en paralelo con A)

### B1 · Separar núcleo de la UI
- **Qué:** mover a módulos propios: `lib/ar/types` (modelos), `lib/ar/sensors` (GPS + orientación), `lib/ar/scene` (arma la escena = **adapter del renderer**), `lib/ar/engine` (orquesta). React queda como **cáscara** (HUD/intro/errores).
- **Objetivo:** **núcleo agnóstico del framework y del renderer** → el SDK después es mecánico, y migrar AR.js→LocAR/WebXR toca solo `scene`.

### B2 · Definir el contrato público (config + eventos)
- **Qué:** especificar **qué entra** (config: lista de avisos + opciones) y **qué sale** (eventos: listo, entró-en-rango, tocó-aviso, error, heading…).
- **Objetivo:** una **API estable** — es lo que después consumen las integraciones. Sin esto no hay SDK serio.

---

## Parte C — Datos reales

### C1 · Supabase (persistencia)
- **Qué:** tabla `pois` + **Storage** para subir media + API (`/api/pois`). El panel pasa a **guardar** de verdad. La **fuente** de la lista pasa de demo/URL → base de datos. + protección mínima del POST (anti-spam).
- **Objetivo:** tu **biblioteca de avisos** guardada, **compartible** y **consultable** (no "encima del link").
- **Intervención tuya:** crear proyecto Supabase + dar las 3 keys.

### C2 · Link "todos los avisos cercanos"
- **Qué:** un **solo QR/link** que consulta por GPS y muestra los avisos **a tu alrededor**, sin link por aviso.
- **Objetivo:** el caso "una web/campaña → cualquiera abre → ve lo cercano".

### C3 · Distribución / puerta de entrada
- **Qué:** QR (ya), **PWA "agregar a pantalla de inicio"** (ícono persistente), NFC opcional.
- **Objetivo:** bajar a **un toque** la entrada al visor. (Ver `MECANISMOS-DE-ENTRADA.md`.)

---

## Parte D — Convertirlo en motor reutilizable

### D1 · Extraer el SDK
- **Qué:** empaquetar el núcleo ya probado (engine + sensors + scene + geo + types) como librería.
- **Objetivo:** que el motor viva **independiente de esta app**.

### D2 · Superficies de integración
- **Qué:** **link/iframe** (cero código) → **web component** `<ar-viewer>` (etiqueta drop-in) → **SDK npm** (programático) → núcleo headless (tu UI).
- **Objetivo:** que **otras apps lo incluyan de distintas formas**, según cuánto control necesiten.

### D3 · Docs + demo para integradores
- **Qué:** README, ejemplos, página demo.
- **Objetivo:** que un tercero lo integre **sin nuestra ayuda**.

---

## Continuo (todas las fases)
- Tests (unit + e2e) + CI verde + deploy preview en cada push.
- Documentación por fase + bitácora (`ESTADO.md`).
- **Validación en campo** como juez final del AR.

**Resumen:** A) sólido y completo → B) ordenado para extraer → C) datos reales → D) embebible.
