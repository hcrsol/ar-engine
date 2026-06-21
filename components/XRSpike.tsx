"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Spike de WebXR AR (immersive-ar, respaldado por ARCore en Android). Objetivo:
// medir cuánto mejora la precisión de "caminar y atravesar" con seguimiento
// visual de movimiento, vs. el visor GPS. Página aparte, no toca el motor GPS.
// iOS/Safari no soporta WebXR → mostramos mensaje.

const SCENE_HTML = `
  <a-scene
    webxr="requiredFeatures: local-floor"
    vr-mode-ui="enabled: false"
    renderer="antialias: true; colorManagement: true"
    style="width:100%;height:100%;">
    <a-assets>
      <a-asset-item id="duckmodel" src="/demo/duck.glb"></a-asset-item>
    </a-assets>
    <a-entity light="type: ambient; intensity: 1.3"></a-entity>
    <a-entity light="type: directional; intensity: 0.8" position="1 3 1"></a-entity>
    <!-- Pato grande a 12 m de frente: el objetivo de la caminata. -->
    <a-entity gltf-model="#duckmodel" position="0 1.2 -12" scale="3 3 3" rotation="0 180 0"></a-entity>
    <!-- Pato menor a 6 m, como referencia cercana. -->
    <a-entity gltf-model="#duckmodel" position="1.5 1 -6" scale="1.8 1.8 1.8" rotation="0 200 0"></a-entity>
    <a-camera></a-camera>
  </a-scene>`;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-xr="${src}"]`,
    );
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.xr = src;
    s.addEventListener("load", () => {
      s.dataset.loaded = "true";
      resolve();
    });
    s.addEventListener("error", () => reject(new Error(`No cargó ${src}`)));
    document.head.appendChild(s);
  });
}

type Supported = "checking" | "yes" | "no";

export default function XRSpike() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState<Supported>("checking");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  function preload() {
    loadScript("/ar-xr/aframe.min.js")
      .then(() => {
        const el = containerRef.current;
        if (!el) return;
        el.innerHTML = SCENE_HTML;
        const scene = el.querySelector("a-scene") as
          | (Element & { hasLoaded?: boolean })
          | null;
        if (!scene) return;
        if (scene.hasLoaded) setReady(true);
        else scene.addEventListener("loaded", () => setReady(true));
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    let cancelled = false;
    const xr = (
      navigator as unknown as {
        xr?: { isSessionSupported?: (mode: string) => Promise<boolean> };
      }
    ).xr;
    const check = xr?.isSessionSupported
      ? xr.isSessionSupported("immersive-ar").catch(() => false)
      : Promise.resolve(false);
    check.then((ok) => {
      if (cancelled) return;
      setSupported(ok ? "yes" : "no");
      if (ok) preload();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function enter() {
    const scene = containerRef.current?.querySelector("a-scene") as
      | (Element & { enterAR?: () => Promise<void> })
      | null;
    if (!scene?.enterAR) return setError(true);
    try {
      await scene.enterAR();
    } catch {
      setError(true);
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="bg-paper text-ink absolute inset-0 flex items-center justify-center px-5">
        <div className="w-full max-w-[420px] text-center">
          <div className="text-clay flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase">
            <span className="bg-clay h-px w-[18px]" />
            Spike · WebXR
            <span className="bg-clay h-px w-[18px]" />
          </div>

          {supported === "checking" && (
            <p className="text-soft mt-8 text-sm">Comprobando soporte AR…</p>
          )}

          {supported === "no" && (
            <>
              <h1 className="font-display mt-4 text-[26px] leading-tight font-medium">
                Este teléfono no soporta WebXR
              </h1>
              <p className="text-soft mx-auto mt-3 max-w-[90%] text-sm leading-relaxed">
                Es lo esperado en iPhone (Safari no lo soporta). Probalo en un
                Android con Chrome. El visor GPS sí funciona en ambos.
              </p>
              <Link
                href="/visor?demo=1"
                className="text-clay border-clay mt-7 inline-block rounded-full border-[1.5px] px-5 py-3 text-sm font-semibold"
              >
                Ir al visor GPS (demo)
              </Link>
            </>
          )}

          {supported === "yes" && (
            <>
              <h1 className="font-display mt-4 text-[28px] leading-tight font-medium">
                Prueba de precisión AR
              </h1>
              <p className="text-soft mx-auto mt-3 max-w-[90%] text-sm leading-relaxed">
                Al entrar, vas a ver un <b>pato grande a 12 m</b> de frente (y
                otro a 6 m). <b>Caminá hacia él y pasalo.</b> Mirá si se queda
                clavado en su lugar (sin correrse), que es lo que el GPS no
                lograba.
              </p>
              <button
                onClick={enter}
                disabled={!ready || error}
                className="bg-clay mt-7 w-full rounded-full px-4 py-4 text-sm font-semibold text-white transition active:scale-[0.99] disabled:bg-[#d9cfc2]"
              >
                {error
                  ? "No se pudo iniciar"
                  : ready
                    ? "Entrar en AR"
                    : "Cargando motor…"}
              </button>
              <p className="text-soft mt-4 font-mono text-[11px]">
                Necesita cámara · al aire libre, con ~15 m libres al frente
              </p>
              <Link
                href="/visor?demo=1"
                className="text-soft hover:text-clay mt-5 inline-block font-mono text-[11px] tracking-[0.14em] uppercase"
              >
                ← Volver al visor GPS
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
