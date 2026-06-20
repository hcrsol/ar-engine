"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { parseCoords } from "@/lib/geo";
import type { LatLng } from "@/lib/types";

export default function PoiForm() {
  const [raw, setRaw] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [shareLabel, setShareLabel] = useState("Compartir");

  function onChange(value: string) {
    setRaw(value);
    setCoords(parseCoords(value.trim()));
    // si ya se generó un link y cambian las coords, se invalida
    setLink(null);
    setQr(null);
  }

  async function generate() {
    if (!coords) return;
    const url = `${window.location.origin}/visor?lat=${coords.lat}&lng=${coords.lng}`;
    setLink(url);
    try {
      setQr(
        await QRCode.toDataURL(url, {
          margin: 1,
          width: 320,
          color: { dark: "#1f1b16", light: "#fffdf9" },
        }),
      );
    } catch {
      setQr(null);
    }
  }

  async function share() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Aviso AR", url: link });
      } catch {
        /* cancelado */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setShareLabel("Copiado ✓");
      setTimeout(() => setShareLabel("Compartir"), 1500);
    } catch {
      /* sin clipboard */
    }
  }

  return (
    <div>
      {/* 01 — Ubicación */}
      <section className="mb-7">
        <div className="mb-3 flex items-baseline gap-2.5">
          <span className="text-clay font-mono text-xs font-medium">01</span>
          <span className="text-[13px] font-semibold">Ubicación</span>
        </div>

        <input
          aria-label="Coordenadas o link de Google Maps"
          type="text"
          autoComplete="off"
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pega coordenadas o el link de Google Maps"
          className="border-line bg-card text-ink focus:border-clay w-full rounded-2xl border px-4 py-4 font-mono text-sm outline-none placeholder:text-[#bdb5a6]"
        />

        <div
          className={`mt-3 flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-opacity ${
            coords ? "border-clay-soft opacity-100" : "border-line opacity-50"
          } bg-card`}
        >
          <div className="flex gap-6 font-mono text-[13px]">
            <div>
              <span className="text-soft block text-[10px] tracking-[0.14em] uppercase">
                Lat
              </span>
              <span className="font-medium" data-testid="lat">
                {coords ? coords.lat.toFixed(6) : "—"}
              </span>
            </div>
            <div>
              <span className="text-soft block text-[10px] tracking-[0.14em] uppercase">
                Lng
              </span>
              <span className="font-medium" data-testid="lng">
                {coords ? coords.lng.toFixed(6) : "—"}
              </span>
            </div>
          </div>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              coords ? "bg-ok shadow-[0_0_0_4px_rgba(91,122,82,0.15)]" : "bg-[#cfc7b8]"
            }`}
          />
        </div>

        <p className="text-soft mt-2 text-xs leading-relaxed">
          En Google Maps, mantén pulsado un punto y toca las coordenadas para
          copiarlas. También sirve pegar el link completo del mapa.
        </p>
      </section>

      {/* Acciones */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={generate}
          disabled={!coords}
          className="bg-clay flex-1 rounded-full px-4 py-4 text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#d9cfc2]"
        >
          {link ? "Aviso generado ✓" : "Generar aviso"}
        </button>
        {link && (
          <button
            onClick={share}
            className="text-clay border-clay rounded-full border-[1.5px] bg-transparent px-5 py-4 text-sm font-semibold"
          >
            {shareLabel}
          </button>
        )}
      </div>

      {/* Resultado */}
      {link && (
        <div className="mt-5">
          <div className="bg-clay-soft rounded-xl px-4 py-3.5 font-mono text-xs leading-relaxed break-all text-[#7a3a20]">
            {link}
          </div>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="Código QR del aviso"
              width={160}
              height={160}
              className="border-line bg-card mt-4 rounded-xl border p-2"
            />
          )}
        </div>
      )}
    </div>
  );
}
