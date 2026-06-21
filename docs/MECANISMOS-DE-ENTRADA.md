# Mecanismos de entrada al visor AR

_Cómo entra un usuario al "mundo AR" de la web. Conversado el 2026-06-21._

Premisa: es **WebAR (sin instalar app)**. El AR vive dentro de una página web, así que **siempre hay un "abrir el visor"** — aunque sea de un solo toque. La cámara nativa del teléfono, sola, no muestra los avisos.

```
[ puerta de entrada ]  →  se abre la web  →  "Activar cámara"  →  avisos AR alrededor
```

---

## 1. Las puertas de entrada (todas llevan a la misma web)

| Mecanismo | Qué es | Uso ideal | Estado |
|---|---|---|---|
| **Link (URL)** | La dirección del visor | WhatsApp, redes, mail, SMS | ✅ ya existe |
| **QR** | El mismo link, empaquetado para escanear. La cámara nativa lo detecta y abre la web | Cartel, vidriera, folleto, pantalla, packaging | ✅ el panel ya lo genera |
| **NFC** | Sticker/tag que abre la web al acercar el teléfono | Carteles físicos, mostradores | ⬜ futuro (es solo grabar la URL en el tag) |
| **PWA / "Agregar a pantalla de inicio"** | Deja un **ícono** como si fuera una app; un toque abre el visor, permisos ya recordados | Usuarios recurrentes | ⬜ futuro (fácil de sumar) |
| **Notificación push** | "Hay un aviso AR cerca tuyo — tocá para verlo" → abre con un toque | Reenganche por cercanía | ⬜ futuro (limitado en web; mejor con app nativa) |

> **QR = link.** No son caminos distintos: el QR **contiene** la URL; escanearlo abre la web igual que tocar el link. Mismo destino, distinto envase. Lo mismo NFC.

---

## 2. Dos tipos de destino (qué carga el link)

1. **Aviso puntual** — el link lleva la coordenada de **un** aviso (`/visor?lat=&lng=`). _(Hoy.)_
2. **Toda la campaña / avisos cercanos** — **un solo link/QR** abre el visor y muestra **todos los avisos activos**, renderizando los que tenés **físicamente cerca** (geoanclados). _(Requiere backend — Fase 4/5.)_

Ejemplo del caso 2: un **QR en tu web** → lo abre cualquiera → ve en AR los avisos a su alrededor.

---

## 3. Persistencia: qué se puede y qué no

- ✅ **Quedar instalado/accesible para siempre:** con PWA ("Agregar a pantalla de inicio") queda un **ícono** permanente; se abre de un toque, con permisos recordados. Se siente como app.
- ❌ **Quedar "corriendo para siempre" en segundo plano:** ninguna web (ni casi ninguna app) mantiene la **cámara prendida de fondo** vigilando avisos — los sistemas operativos lo prohíben (batería y privacidad). El AR funciona **mientras la página está abierta y en pantalla**.

---

## 4. Límites (lo que NO se puede con WebAR)

- ❌ Que los avisos aparezcan **solos cada vez que prendés la pantalla**.
- ❌ Superponer AR sobre la **cámara nativa** del teléfono.
- ❌ Un **"plugin"/extensión** que lo haga ambiental (no existe en móvil de forma útil).
- ❌ Cámara/AR **en segundo plano** 24/7.

Lo más cerca de "ambiental" con web = **ícono en pantalla (un toque)** + **notificación de cercanía**. El "AR siempre superpuesto a la realidad sin abrir nada" = **lentes/gafas AR (hardware)**, no un teléfono. En teléfono (web o app) siempre es: **abrir → mirar**.

---

## 5. Requisitos para que cualquier puerta funcione

1. **Navegador real:** Safari (iPhone) / Chrome (Android). **No** dentro de Instagram/WhatsApp (la app avisa "abrí en el navegador").
2. **Permisos:** cámara + ubicación (+ movimiento/orientación en iPhone).
3. **Al aire libre** (GPS).
4. **HTTPS** (Vercel ya lo da).
