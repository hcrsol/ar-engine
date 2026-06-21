"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { parseCoords } from "@/lib/geo";
import { encodePois } from "@/lib/ar/encode";
import type { LatLng } from "@/lib/types";
import type { ARPoi, ContentType } from "@/lib/ar/types";

const TYPES: { key: ContentType; label: string }[] = [
  { key: "text", label: "Texto" },
  { key: "image", label: "Imagen" },
  { key: "video", label: "Video" },
  { key: "model", label: "3D" },
];

const typeLabel = (t: ContentType) =>
  TYPES.find((x) => x.key === t)?.label ?? t;

export default function PoiForm() {
  // Aviso en edición
  const [raw, setRaw] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [type, setType] = useState<ContentType>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [scale, setScale] = useState(3);
  const [radius, setRadius] = useState(100);
  const [locating, setLocating] = useState(false);

  // Lista + resultado
  const [list, setList] = useState<ARPoi[]>([]);
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [shareLabel, setShareLabel] = useState("Compartir");

  function onCoord(value: string) {
    setRaw(value);
    setCoords(parseCoords(value.trim()));
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setRaw(`${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  const contentValid = type === "text" ? text.trim() !== "" : url.trim() !== "";
  const canAdd = !!coords && contentValid;

  function addPoi() {
    if (!coords || !contentValid) return;
    const poi: ARPoi = {
      id: `p${list.length}`,
      lat: coords.lat,
      lng: coords.lng,
      type,
      scale,
      radius,
      ...(type === "text" ? { text: text.trim() } : { url: url.trim() }),
      ...(title.trim() ? { title: title.trim() } : {}),
    };
    setList([...list, poi]);
    // limpiar lo del aviso (mantener tipo/tamaño/radio)
    setRaw("");
    setCoords(null);
    setText("");
    setUrl("");
    setTitle("");
    setLink(null);
    setQr(null);
  }

  function removePoi(id: string) {
    setList(list.filter((p) => p.id !== id));
    setLink(null);
    setQr(null);
  }

  async function generate() {
    if (!list.length) return;
    const url = `${window.location.origin}/visor?pois=${encodePois(list)}`;
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
        await navigator.share({ title: "Avisos AR", url: link });
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
      {/* Constructor de aviso */}
      <section className="border-line bg-card rounded-2xl border p-4">
        {/* Ubicación */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold">Nuevo aviso</span>
          <button
            onClick={useMyLocation}
            className="text-clay font-mono text-[11px] tracking-[0.1em] uppercase"
          >
            {locating ? "ubicando…" : "usar mi ubicación"}
          </button>
        </div>

        <input
          aria-label="Coordenadas o link de Google Maps"
          type="text"
          autoComplete="off"
          value={raw}
          onChange={(e) => onCoord(e.target.value)}
          placeholder="Pega coordenadas o el link de Google Maps"
          className="border-line bg-paper text-ink focus:border-clay w-full rounded-xl border px-3.5 py-3 font-mono text-[13px] outline-none placeholder:text-[#bdb5a6]"
        />
        <div className="text-soft mt-1.5 font-mono text-[11px]">
          {coords ? (
            <span className="text-ok">
              ✓ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          ) : (
            "—"
          )}
        </div>

        {/* Tipo */}
        <div className="mt-4 flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`flex-1 rounded-full px-2 py-2 text-[12px] font-semibold transition ${
                type === t.key
                  ? "bg-clay text-white"
                  : "border-line text-soft border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {type === "text" ? (
          <input
            aria-label="Texto del cartel"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué dice el cartel?"
            className="border-line bg-paper text-ink focus:border-clay mt-3 w-full rounded-xl border px-3.5 py-3 text-sm outline-none placeholder:text-[#bdb5a6]"
          />
        ) : (
          <input
            aria-label="URL del contenido"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              type === "model"
                ? "URL del modelo .glb / .gltf"
                : `URL ${type === "video" ? "del video" : "de la imagen"}`
            }
            className="border-line bg-paper text-ink focus:border-clay mt-3 w-full rounded-xl border px-3.5 py-3 font-mono text-[12px] outline-none placeholder:text-[#bdb5a6]"
          />
        )}

        {/* Título opcional */}
        <input
          aria-label="Título"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          className="border-line bg-paper text-ink focus:border-clay mt-3 w-full rounded-xl border px-3.5 py-3 text-sm outline-none placeholder:text-[#bdb5a6]"
        />

        {/* Tamaño + distancia */}
        <div className="mt-3 flex gap-3">
          <label className="flex-1 text-[12px]">
            <span className="text-soft block">Tamaño: {scale}</span>
            <input
              aria-label="Tamaño"
              type="range"
              min={1}
              max={8}
              step={0.5}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="accent-clay mt-1 w-full"
            />
          </label>
          <label className="flex-1 text-[12px]">
            <span className="text-soft block">Aparece a (m)</span>
            <input
              aria-label="Aparece a"
              type="number"
              min={5}
              max={5000}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="border-line bg-paper text-ink focus:border-clay mt-1 w-full rounded-lg border px-2.5 py-1.5 font-mono text-[12px] outline-none"
            />
          </label>
        </div>

        <button
          onClick={addPoi}
          disabled={!canAdd}
          className="border-clay text-clay mt-4 w-full rounded-full border-[1.5px] px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:border-[#d9cfc2] disabled:text-[#bdb5a6]"
        >
          + Agregar a la lista
        </button>
      </section>

      {/* Lista de avisos */}
      {list.length > 0 && (
        <section className="mt-5">
          <div className="text-soft mb-2 font-mono text-[11px] tracking-[0.14em] uppercase">
            {list.length} aviso{list.length > 1 ? "s" : ""}
          </div>
          <ul className="space-y-2">
            {list.map((p) => (
              <li
                key={p.id}
                className="border-line bg-card flex items-center gap-3 rounded-xl border px-3.5 py-3"
              >
                <span className="bg-clay-soft text-clay rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold">
                  {typeLabel(p.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">
                    {p.title || p.text || p.url || "aviso"}
                  </div>
                  <div className="text-soft font-mono text-[11px]">
                    {p.lat.toFixed(4)}, {p.lng.toFixed(4)} · {p.scale} · {p.radius}m
                  </div>
                </div>
                <button
                  onClick={() => removePoi(p.id)}
                  aria-label="Quitar"
                  className="text-soft px-1 text-lg"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Generar */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={generate}
          disabled={!list.length}
          className="bg-clay flex-1 rounded-full px-4 py-4 text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#d9cfc2]"
        >
          {link ? "Link generado ✓" : "Generar link"}
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

      {link && (
        <div className="mt-5">
          <div className="bg-clay-soft rounded-xl px-4 py-3.5 font-mono text-xs leading-relaxed break-all text-[#7a3a20]">
            {link}
          </div>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="Código QR de los avisos"
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
