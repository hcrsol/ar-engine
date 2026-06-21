import { describe, it, expect } from "vitest";
import { encodePois, decodePois } from "./encode";
import type { ARPoi } from "./types";

const sample: ARPoi[] = [
  {
    id: "a",
    lat: -33.4489,
    lng: -70.6693,
    type: "image",
    url: "https://x.com/á.jpg",
    scale: 2,
    radius: 100,
    title: "Café Ñandú",
  },
  { id: "b", lat: 40.4168, lng: -3.7038, type: "text", text: "Hola" },
];

describe("encode/decode pois", () => {
  it("ida y vuelta conserva los datos (incl. acentos)", () => {
    const decoded = decodePois(encodePois(sample));
    expect(decoded).toEqual(sample);
  });

  it("el string es url-safe (sin +, /, =)", () => {
    expect(encodePois(sample)).not.toMatch(/[+/=]/);
  });

  it("rechaza basura", () => {
    expect(decodePois("no-es-base64-valido!!!")).toBeNull();
    expect(decodePois("")).toBeNull();
  });

  it("filtra avisos con coordenadas inválidas", () => {
    const bad = encodePois([
      { id: "x", lat: 999, lng: 0, type: "text" },
      { id: "y", lat: 10, lng: 20, type: "text" },
    ] as ARPoi[]);
    const decoded = decodePois(bad);
    expect(decoded).toHaveLength(1);
    expect(decoded?.[0].id).toBe("y");
  });
});
