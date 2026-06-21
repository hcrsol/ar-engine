import type { ARPoi } from "./types";

// Codifica/decodifica una lista de avisos en un string para el link (sin
// backend todavía). base64url de JSON, seguro para UTF-8 (títulos con acentos).

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return b64 + pad;
}

export function encodePois(pois: ARPoi[]): string {
  const bytes = new TextEncoder().encode(JSON.stringify(pois));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return toUrlSafe(btoa(bin));
}

export function decodePois(s: string): ARPoi[] | null {
  try {
    const bin = atob(fromUrlSafe(s));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(data)) return null;
    const valid = data
      .filter(
        (p) =>
          p &&
          Number.isFinite(p.lat) &&
          Number.isFinite(p.lng) &&
          Math.abs(p.lat) <= 90 &&
          Math.abs(p.lng) <= 180,
      )
      .map((p, i) => ({ ...p, id: p.id ?? `p${i}` }) as ARPoi);
    return valid.length ? valid : null;
  } catch {
    return null;
  }
}
