import { destination } from "../geo";
import type { LatLng } from "../types";
import type { ARPoi } from "./types";

// Modo demo: planta 4 avisos alrededor del usuario (N/S/E/O), uno de cada tipo
// de contenido. Sirve para probar en campo que cada uno aparece en su dirección
// correcta y que los 4 tipos renderizan. No necesita backend.

const DEMO_DISTANCE_M = 30;
const DEMO_RADIUS_M = 120;

export function generateDemoPois(center: LatLng): ARPoi[] {
  return [
    {
      id: "n",
      ...destination(center, 0, DEMO_DISTANCE_M),
      type: "text",
      text: "NORTE",
      title: "Aviso NORTE",
      body: "Tipo: texto/cartel 3D.",
      scale: 3,
      radius: DEMO_RADIUS_M,
    },
    {
      id: "e",
      ...destination(center, 90, DEMO_DISTANCE_M),
      type: "image",
      url: "/demo/img.jpg",
      title: "Aviso ESTE",
      body: "Tipo: imagen.",
      scale: 3,
      radius: DEMO_RADIUS_M,
    },
    {
      id: "s",
      ...destination(center, 180, DEMO_DISTANCE_M),
      type: "model",
      url: "/demo/box.glb",
      title: "Aviso SUR",
      body: "Tipo: modelo 3D (.glb).",
      scale: 3,
      radius: DEMO_RADIUS_M,
    },
    {
      id: "o",
      ...destination(center, 270, DEMO_DISTANCE_M),
      type: "video",
      url: "/demo/clip.mp4",
      title: "Aviso OESTE",
      body: "Tipo: video.",
      scale: 3,
      radius: DEMO_RADIUS_M,
    },
  ];
}
