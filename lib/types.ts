// Tipos compartidos del motor AR. Ampliados en fases posteriores (Supabase).

export type MediaType = "image" | "video" | "model";

/** Coordenada geográfica básica. */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Aviso geoanclado. En la pasada link-only solo se usan lat/lng (vía URL).
 * Los campos de persistencia (id, media, etc.) se rellenan desde Supabase
 * a partir de la Fase 4.
 */
export interface Poi {
  id?: string;
  created_at?: string;
  title?: string;
  body?: string;
  link_url?: string | null;
  lat: number;
  lng: number;
  altitude?: number;
  media_type?: MediaType;
  media_url?: string;
  scale?: number;
  active?: boolean;
  owner_id?: string | null;
}
