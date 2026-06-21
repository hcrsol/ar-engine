import type { ARPoi } from "./types";

// Adapter del renderer (A-Frame + AR.js). Si migramos a LocAR/WebXR, se cambia
// solo este archivo. Construye el HTML de la escena a partir de una lista de
// avisos. Cada aviso se ancla en su lat/lng real (gps-projected-entity-place)
// y arranca oculto; el motor decide la visibilidad por cercanía.

// Elevación del aviso sobre el plano de la cámara, en METROS REALES (no se ve
// afectada por la escala del contenido).
const LIFT_M = 2;

function esc(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Contenido 3D de un aviso según su tipo. Todo centrado en y=0 (nivel de la
 * vista) para que los tipos queden a la misma altura, no flotando alto. */
function content(poi: ARPoi): string {
  switch (poi.type) {
    case "image":
      return `<a-entity geometry="primitive: plane; width: 2; height: 2" material="src: ${esc(poi.url ?? "")}; side: double; shader: flat"></a-entity>`;
    case "video":
      return `<a-entity geometry="primitive: plane; width: 2.4; height: 1.35" material="src: #vid-${esc(poi.id)}; side: double; shader: flat"></a-entity>`;
    case "model":
      // El modelo trae su base en y=0; lo bajamos para centrarlo a la vista.
      return `<a-entity gltf-model="${esc(poi.url ?? "")}" position="0 -0.9 0"></a-entity>`;
    case "text":
    default:
      return `
        <a-box position="0 -0.85 0" depth="0.06" width="0.06" height="0.9" color="#8A8275"></a-box>
        <a-box position="0 0 0" depth="0.07" width="1.7" height="1.05" color="#C2603C"></a-box>
        <a-box position="0 0 0.045" depth="0.02" width="1.5" height="0.85" color="#F0DDD2"></a-box>
        <a-text value="${esc(poi.text ?? "AR")}" align="center" color="#1F1B16" width="5" position="0 0 0.08"></a-text>`;
  }
}

function entity(poi: ARPoi): string {
  const s = poi.scale ?? 3;
  // Entidad externa: anclada al GPS (sin escala). Interna: elevada LIFT_M metros
  // reales, escalada y animada. Así la altura no depende del tamaño.
  return `
    <a-entity
      id="poi-${esc(poi.id)}"
      class="ar-poi"
      visible="false"
      gps-projected-entity-place="latitude: ${poi.lat}; longitude: ${poi.lng}">
      <a-entity
        position="0 ${LIFT_M} 0"
        scale="${s} ${s} ${s}"
        animation="property: rotation; to: 0 360 0; loop: true; dur: 12000; easing: linear">
        ${content(poi)}
      </a-entity>
    </a-entity>`;
}

export function buildSceneHTML(pois: ARPoi[]): string {
  const assets = pois
    .filter((p) => p.type === "video" && p.url)
    .map(
      (p) =>
        `<video id="vid-${esc(p.id)}" src="${esc(p.url ?? "")}" autoplay loop muted playsinline crossorigin="anonymous"></video>`,
    )
    .join("");

  const entities = pois.map(entity).join("");

  return `
  <a-scene
    vr-mode-ui="enabled: false"
    embedded
    arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false"
    renderer="antialias: true; alpha: true"
    style="width:100%;height:100%;">
    <a-assets>${assets}</a-assets>
    <a-camera gps-projected-camera="gpsMinDistance: 5" rotation-reader></a-camera>
    ${entities}
  </a-scene>`;
}
