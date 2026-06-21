// Modelo de aviso del motor AR (independiente de UI y de la fuente de datos).
// La fuente puede ser: URL (link), demo, o más adelante Supabase.

export type ContentType = "image" | "video" | "model" | "text";

export interface ARPoi {
  id: string;
  lat: number;
  lng: number;
  type: ContentType;
  /** URL del contenido para image/video/model. */
  url?: string;
  /** Texto para el tipo `text` (cartel). */
  text?: string;
  /** Tamaño/escala del aviso (metros aprox del lado). */
  scale?: number;
  /** Radio de aparición en metros (si no, usa el global del visor). */
  radius?: number;
  // Para la tarjeta de info (A5):
  title?: string;
  body?: string;
  link?: string;
}
