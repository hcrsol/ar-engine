import type { LatLng } from "./types";

/**
 * Extrae una coordenada de un texto: coordenadas sueltas ("lat, lng"),
 * o un link de Google Maps (formatos @lat,lng / q=lat,lng / !3dlat!4dlng).
 * Devuelve null si no encuentra un par válido dentro de rango.
 */
export function parseCoords(text: string): LatLng | null {
  if (!text) return null;
  const at = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const qp = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const bang = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const pair = text.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  const m = at || qp || bang || pair;
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia Haversine en metros entre dos coordenadas. */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
