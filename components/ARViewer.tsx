"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { haversine, bearing, relativeAngle } from "@/lib/geo";
import { buildSceneHTML } from "@/lib/ar/scene";
import { generateDemoPois } from "@/lib/ar/demo";
import type { ARPoi } from "@/lib/ar/types";

type Phase = "intro" | "loading" | "running" | "error";
type ErrKind = "coords" | "denied" | "webview" | "gps" | "generic";

// Radio de aparición por defecto (m): un aviso geoanclado se muestra al entrar
// en su radio (como el zoom de un mapa). Configurable por `r` del link o por
// aviso. El aviso SIEMPRE se coloca en su dirección real.
const DEFAULT_RADIUS = 100;
const MIN_RADIUS = 5;
const MAX_RADIUS = 5000;
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

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

/**
 * Primer fix de GPS: fuerza el prompt de ubicación y confirma que hay señal.
 * Baja precisión + posición reciente cacheada → resuelve rápido con ubicación
 * de red (como Maps), sin esperar al GPS puro por satélite.
 */
function getFirstFix(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ code: 2 } as GeolocationPositionError);
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 60000,
    });
  });
}

type Nearest = { lat: number; lng: number; title: string; id: string; radius: number };

export default function ARViewer({
  lat,
  lng,
  radius,
  demo,
  debug,
}: {
  lat?: string;
  lng?: string;
  radius?: string;
  demo?: string;
  debug?: string;
}) {
  const showDebug = debug === "1" || debug === "true";
  const radiusN = radius != null ? Number(radius) : NaN;
  const reveal = Number.isFinite(radiusN)
    ? clamp(radiusN, MIN_RADIUS, MAX_RADIUS)
    : DEFAULT_RADIUS;
  const isDemo = demo === "1" || demo === "true";

  const latN = lat != null ? Number(lat) : NaN;
  const lngN = lng != null ? Number(lng) : NaN;
  const validSingle =
    Number.isFinite(latN) &&
    Number.isFinite(lngN) &&
    Math.abs(latN) <= 90 &&
    Math.abs(lngN) <= 180;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountedScene = useRef(false);
  const watchId = useRef<number | null>(null);
  const poisRef = useRef<ARPoi[]>([]);
  const nearestIdRef = useRef<string | null>(null);
  const orientHandler = useRef<((e: DeviceOrientationEvent) => void) | null>(
    null,
  );
  const debugTimer = useRef<number | null>(null);
  const lastHeadingTs = useRef(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [err, setErr] = useState<ErrKind | null>(null);
  const [hud, setHud] = useState<{
    lat: number;
    lng: number;
    dist: number;
    acc: number;
    nearest: Nearest | null;
  } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [poiPos, setPoiPos] = useState<{ x: number; z: number } | null>(null);
  const [count, setCount] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState("Iniciando el motor AR…");

  useEffect(() => {
    return () => {
      if (watchId.current != null)
        navigator.geolocation.clearWatch(watchId.current);
      if (orientHandler.current) {
        window.removeEventListener(
          "deviceorientationabsolute",
          orientHandler.current as EventListener,
        );
        window.removeEventListener(
          "deviceorientation",
          orientHandler.current as EventListener,
        );
      }
      if (debugTimer.current != null) clearInterval(debugTimer.current);
    };
  }, []);

  function fail(kind: ErrKind) {
    setErr(kind);
    setPhase("error");
  }

  async function activate() {
    // La cámara no funciona en webviews de Instagram/Facebook/WhatsApp.
    const ua = navigator.userAgent || "";
    if (/Instagram|FBAN|FBAV|FB_IAB|WhatsApp/i.test(ua)) return fail("webview");

    if (!isDemo && !validSingle) return fail("coords");

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

    // GPS: pedimos permiso y un primer fix ANTES de montar la escena. En modo
    // demo, ese fix también define dónde plantar los 4 avisos alrededor.
    setLoadingMsg("Buscando señal GPS…");
    setPhase("loading");
    let fix: GeolocationPosition;
    try {
      fix = await getFirstFix();
    } catch (e) {
      const code = (e as GeolocationPositionError)?.code;
      return fail(code === 1 ? "denied" : "gps");
    }

    poisRef.current = isDemo
      ? generateDemoPois({
          lat: fix.coords.latitude,
          lng: fix.coords.longitude,
        })
      : [
          {
            id: "a",
            lat: latN,
            lng: lngN,
            type: "text",
            text: "AR",
            scale: 3,
            radius: reveal,
          },
        ];
    setCount(poisRef.current.length);

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
    if (!el || mountedScene.current) return;
    mountedScene.current = true;
    el.innerHTML = buildSceneHTML(poisRef.current);

    // watchPosition propio: por cada lectura (1) elegimos el aviso más cercano
    // para el HUD/flecha y (2) mostramos cada aviso si estás dentro de su radio.
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        let nearest: Nearest | null = null;
        let nd = Infinity;
        for (const p of poisRef.current) {
          const d = haversine(here, p);
          const r = p.radius ?? reveal;
          document
            .getElementById(`poi-${p.id}`)
            ?.setAttribute("visible", d <= r ? "true" : "false");
          if (d < nd) {
            nd = d;
            nearest = {
              lat: p.lat,
              lng: p.lng,
              title: p.title ?? "aviso",
              id: p.id,
              radius: r,
            };
          }
        }
        nearestIdRef.current = nearest?.id ?? null;
        setHud({ ...here, dist: nd, acc: pos.coords.accuracy, nearest });
      },
      (e) => {
        if (e.code === 1) fail("denied");
        // code 2/3 (sin señal/timeout puntual): seguimos intentando.
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 60000 },
    );

    // Brújula para la flecha de guía.
    const handler = (e: DeviceOrientationEvent) => {
      let h: number | null = null;
      const compass = (e as unknown as { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (typeof compass === "number") {
        h = compass; // iOS: 0=N, horario
      } else if (e.absolute && typeof e.alpha === "number") {
        h = (360 - e.alpha) % 360; // Android (orientación absoluta)
      }
      if (h == null) return;
      const now = Date.now();
      if (now - lastHeadingTs.current < 120) return; // throttle ~8 Hz
      lastHeadingTs.current = now;
      setHeading(h);
    };
    orientHandler.current = handler;
    window.addEventListener(
      "deviceorientationabsolute",
      handler as EventListener,
    );
    window.addEventListener("deviceorientation", handler as EventListener);

    // Debug: posición (x,z) que AR.js asigna al aviso más cercano.
    if (showDebug)
      debugTimer.current = window.setInterval(() => {
      const id = nearestIdRef.current;
      if (!id) return;
      const obj = (
        document.getElementById(`poi-${id}`) as unknown as {
          object3D?: { position: { x: number; z: number } };
        } | null
      )?.object3D;
      if (obj) setPoiPos({ x: obj.position.x, z: obj.position.z });
    }, 500);
  }

  const brg =
    hud && hud.nearest
      ? bearing({ lat: hud.lat, lng: hud.lng }, hud.nearest)
      : null;
  const turn =
    heading != null && brg != null ? relativeAngle(heading, brg) : null;
  const inRange = !!hud && !!hud.nearest && hud.dist <= hud.nearest.radius;

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      {phase === "running" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4">
            <div className="bg-ink/70 rounded-2xl px-4 py-2 text-center font-mono text-[11px] text-white backdrop-blur">
              {hud && hud.nearest ? (
                <>
                  <div>
                    {hud.dist < 1000
                      ? `${Math.round(hud.dist)} m`
                      : `${(hud.dist / 1000).toFixed(1)} km`}{" "}
                    a {hud.nearest.title} · GPS ±{Math.round(hud.acc)} m
                  </div>
                  <div className={inRange ? "text-ok" : "text-clay-soft"}>
                    {inRange
                      ? "En rango ✓ — gira hacia la flecha"
                      : `Acércate · aparece a ${hud.nearest.radius} m`}
                  </div>
                  {inRange && (
                    <div className="mt-0.5 text-[14px]">
                      {turn == null
                        ? "brújula sin datos"
                        : Math.abs(turn) <= 12
                          ? "de frente ✓"
                          : turn < 0
                            ? `◀ gira ${Math.round(-turn)}°`
                            : `gira ${Math.round(turn)}° ▶`}
                    </div>
                  )}
                  {showDebug && (
                    <div className="mt-1 text-[9px] text-white/55">
                      brúj {heading == null ? "—" : `${Math.round(heading)}°`} ·
                      rumbo {brg == null ? "—" : `${Math.round(brg)}°`} · poi{" "}
                      {poiPos
                        ? `${Math.round(poiPos.x)},${Math.round(poiPos.z)}`
                        : "—"}{" "}
                      · {count} avisos
                    </div>
                  )}
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

      {phase !== "running" && (
        <div className="bg-paper text-ink absolute inset-0 flex items-center justify-center px-5">
          <div className="w-full max-w-[420px] text-center">
            <div className="text-clay flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase">
              <span className="bg-clay h-px w-[18px]" />
              {isDemo ? "Visor AR · demo" : "Visor AR"}
              <span className="bg-clay h-px w-[18px]" />
            </div>

            {phase === "intro" && (
              <>
                <h1 className="font-display mt-4 text-[30px] leading-tight font-medium">
                  Activa la cámara
                </h1>
                <p className="text-soft mx-auto mt-3 max-w-[90%] text-sm leading-relaxed">
                  {isDemo
                    ? "Modo demo: al activar, se plantan 4 avisos a tu alrededor (norte, sur, este, oeste), uno de cada tipo. Gira sobre tu eje para encontrarlos."
                    : "Camina hacia el punto del aviso siguiendo la distancia de arriba. Al entrar en el radio, aparece anclado en su lugar real — gira la cámara hacia esa dirección."}
                </p>
                <button
                  onClick={activate}
                  className="bg-clay mt-7 w-full rounded-full px-4 py-4 text-sm font-semibold text-white transition active:scale-[0.99]"
                >
                  Activar cámara
                </button>
                <p className="text-soft mt-4 font-mono text-[11px]">
                  Necesita cámara y ubicación · funciona mejor al aire libre
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
