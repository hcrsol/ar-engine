"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { haversine } from "@/lib/geo";
import type { LatLng } from "@/lib/types";

type Phase = "intro" | "loading" | "running" | "error";
type ErrKind = "coords" | "denied" | "webview" | "gps" | "generic";

declare global {
  interface Window {
    AFRAME?: unknown;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-ar="${src}"]`,
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
    s.dataset.ar = src;
    s.addEventListener("load", () => {
      s.dataset.loaded = "true";
      resolve();
    });
    s.addEventListener("error", () => reject(new Error(`No cargó ${src}`)));
    document.head.appendChild(s);
  });
}

/** Primer fix de GPS: fuerza el prompt de ubicación y "calienta" el sensor. */
function getFirstFix(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ code: 2 } as GeolocationPositionError);
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    });
  });
}

/** Escena A-Frame + AR.js con un cartel 3D animado anclado a la coordenada. */
function sceneHTML({ lat, lng }: LatLng): string {
  return `
  <a-scene
    vr-mode-ui="enabled: false"
    embedded
    arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false"
    renderer="antialias: true; alpha: true"
    style="width:100%;height:100%;">
    <a-camera gps-new-camera="gpsMinDistance: 5" rotation-reader></a-camera>
    <a-entity
      id="poi"
      gps-new-entity-place="latitude: ${lat}; longitude: ${lng}"
      scale="3 3 3"
      animation="property: rotation; to: 0 360 0; loop: true; dur: 9000; easing: linear">
      <a-box position="0 0.6 0" depth="0.08" width="0.08" height="1.2" color="#8A8275"></a-box>
      <a-box position="0 1.75 0" depth="0.07" width="1.7" height="1.05" color="#C2603C"></a-box>
      <a-box position="0 1.75 0.045" depth="0.02" width="1.5" height="0.85" color="#F0DDD2"></a-box>
      <a-text value="AR" align="center" color="#1F1B16" width="5" position="0 1.75 0.08"></a-text>
    </a-entity>
  </a-scene>`;
}

export default function ARViewer({ lat, lng }: { lat?: string; lng?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedScene = useRef(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [err, setErr] = useState<ErrKind | null>(null);
  const [hud, setHud] = useState<{ lat: number; lng: number; dist: number } | null>(
    null,
  );
  const [loadingMsg, setLoadingMsg] = useState("Iniciando el motor AR…");

  const latN = lat != null ? Number(lat) : NaN;
  const lngN = lng != null ? Number(lng) : NaN;
  const target: LatLng | null =
    Number.isFinite(latN) &&
    Number.isFinite(lngN) &&
    Math.abs(latN) <= 90 &&
    Math.abs(lngN) <= 180
      ? { lat: latN, lng: lngN }
      : null;

  function fail(kind: ErrKind) {
    setErr(kind);
    setPhase("error");
  }

  async function activate() {
    // La cámara no funciona dentro de los webviews de Instagram/Facebook/WhatsApp.
    const ua = navigator.userAgent || "";
    if (/Instagram|FBAN|FBAV|FB_IAB|WhatsApp/i.test(ua)) return fail("webview");

    if (!target) return fail("coords");

    // iOS: permiso de orientación, obligatoriamente tras gesto.
    try {
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (DOE && typeof DOE.requestPermission === "function") {
        const res = await DOE.requestPermission();
        if (res !== "granted") return fail("denied");
      }
    } catch {
      return fail("denied");
    }

    // Permiso de cámara (lo soltamos; AR.js lo vuelve a pedir al iniciar).
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      return fail("denied");
    }

    // GPS: pedimos el permiso y un primer fix ANTES de montar la escena.
    // Así el prompt de ubicación aparece explícito y el sensor llega caliente.
    setLoadingMsg("Buscando señal GPS…");
    setPhase("loading");
    try {
      await getFirstFix();
    } catch (e) {
      const code = (e as GeolocationPositionError)?.code;
      return fail(code === 1 ? "denied" : "gps");
    }

    setLoadingMsg("Iniciando el motor AR…");
    try {
      await loadScript("/ar/aframe.min.js");
      await loadScript("/ar/aframe-ar.js");
      injectScene();
      setPhase("running");
    } catch {
      fail("generic");
    }
  }

  function injectScene() {
    const el = containerRef.current;
    if (!el || !target || mountedScene.current) return;
    mountedScene.current = true;
    el.innerHTML = sceneHTML(target);

    const cam = el.querySelector("[gps-new-camera]");
    let gotPosition = false;
    cam?.addEventListener("gps-camera-update-position", (e: Event) => {
      gotPosition = true;
      const pos = (e as CustomEvent).detail?.position;
      if (!pos) return;
      const here = { lat: pos.latitude, lng: pos.longitude };
      setHud({ ...here, dist: haversine(here, target) });
    });

    // Red de seguridad: si en 30 s no llega ninguna posición GPS, avisar.
    window.setTimeout(() => {
      if (!gotPosition) fail("gps");
    }, 30000);
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Contenedor de la escena AR (siempre presente para el ref) */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* HUD durante la sesión */}
      {phase === "running" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4">
            <div className="bg-ink/70 rounded-full px-4 py-2 font-mono text-[11px] text-white backdrop-blur">
              {hud ? (
                <>
                  GPS {hud.lat.toFixed(5)}, {hud.lng.toFixed(5)} ·{" "}
                  {hud.dist < 1000
                    ? `${Math.round(hud.dist)} m`
                    : `${(hud.dist / 1000).toFixed(1)} km`}{" "}
                  al aviso
                </>
              ) : (
                "Buscando señal GPS…"
              )}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-5">
            <Link
              href="/crear"
              className="pointer-events-auto rounded-full bg-white/90 px-5 py-2.5 text-sm font-semibold text-black"
            >
              Salir
            </Link>
          </div>
        </>
      )}

      {/* Pantalla intro / loading / error */}
      {phase !== "running" && (
        <div className="bg-paper text-ink absolute inset-0 flex items-center justify-center px-5">
          <div className="w-full max-w-[420px] text-center">
            <div className="text-clay flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase">
              <span className="bg-clay h-px w-[18px]" />
              Visor AR
              <span className="bg-clay h-px w-[18px]" />
            </div>

            {phase === "intro" && (
              <>
                <h1 className="font-display mt-4 text-[30px] leading-tight font-medium">
                  Activa la cámara
                </h1>
                <p className="text-soft mx-auto mt-3 max-w-[90%] text-sm leading-relaxed">
                  Apunta el teléfono hacia el lugar del aviso. Necesitamos cámara,
                  ubicación y orientación para anclar la animación en el espacio
                  real.
                </p>
                <button
                  onClick={activate}
                  className="bg-clay mt-7 w-full rounded-full px-4 py-4 text-sm font-semibold text-white transition active:scale-[0.99]"
                >
                  Activar cámara
                </button>
                <p className="text-soft mt-4 font-mono text-[11px]">
                  GPS ~5–15 m · la brújula puede necesitar calibración (mueve el
                  teléfono en forma de 8)
                </p>
              </>
            )}

            {phase === "loading" && (
              <>
                <p className="text-soft mt-8 text-sm">{loadingMsg}</p>
                <p className="text-soft mt-3 font-mono text-[11px]">
                  La primera señal GPS puede tardar hasta 30 s al aire libre
                </p>
              </>
            )}

            {phase === "error" && (
              <>
                <h1 className="font-display mt-4 text-[26px] leading-tight font-medium">
                  {ERRORS[err ?? "generic"].title}
                </h1>
                <p className="text-soft mx-auto mt-3 max-w-[90%] text-sm leading-relaxed">
                  {ERRORS[err ?? "generic"].body}
                </p>
                {err !== "webview" && err !== "coords" && (
                  <button
                    onClick={() => {
                      setErr(null);
                      mountedScene.current = false;
                      setPhase("intro");
                    }}
                    className="bg-clay mt-7 w-full rounded-full px-4 py-4 text-sm font-semibold text-white"
                  >
                    Reintentar
                  </button>
                )}
                <Link
                  href="/crear"
                  className="text-clay border-clay mt-3 inline-block rounded-full border-[1.5px] px-5 py-3 text-sm font-semibold"
                >
                  ← Volver al panel
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ERRORS: Record<ErrKind, { title: string; body: string }> = {
  coords: {
    title: "Faltan las coordenadas",
    body: "Este visor se abre desde un link generado en el panel. Vuelve y genera uno.",
  },
  denied: {
    title: "Permiso denegado",
    body: "Sin cámara y orientación no podemos mostrar el aviso. Revisa los permisos del navegador e inténtalo otra vez.",
  },
  webview: {
    title: "Ábrelo en el navegador",
    body: "La cámara no funciona dentro de Instagram/WhatsApp. Toca los tres puntos y elige “Abrir en Safari/Chrome”.",
  },
  gps: {
    title: "Sin señal GPS",
    body: "No recibimos tu ubicación. Permite la ubicación a este sitio en el navegador, sal a un espacio abierto y espera unos segundos antes de reintentar.",
  },
  generic: {
    title: "Algo falló",
    body: "No se pudo iniciar el motor AR. Recarga la página e inténtalo otra vez.",
  },
};
