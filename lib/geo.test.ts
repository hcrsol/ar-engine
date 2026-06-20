import { describe, it, expect } from "vitest";
import { parseCoords, haversine } from "./geo";

describe("parseCoords", () => {
  it("par suelto 'lat, lng'", () => {
    expect(parseCoords("-34.6037, -58.3816")).toEqual({
      lat: -34.6037,
      lng: -58.3816,
    });
  });

  it("par sin espacio y con enteros", () => {
    expect(parseCoords("40,-3")).toEqual({ lat: 40, lng: -3 });
  });

  it("link de Google Maps con @lat,lng", () => {
    const url =
      "https://www.google.com/maps/@-34.6037,-58.3816,17z/data=!3m1";
    expect(parseCoords(url)).toEqual({ lat: -34.6037, lng: -58.3816 });
  });

  it("link con q=lat,lng", () => {
    expect(parseCoords("https://maps.google.com/?q=19.4326,-99.1332")).toEqual({
      lat: 19.4326,
      lng: -99.1332,
    });
  });

  it("link con !3d!4d (place URL)", () => {
    const url = "https://www.google.com/maps/place/X/data=!3d48.8584!4d2.2945";
    expect(parseCoords(url)).toEqual({ lat: 48.8584, lng: 2.2945 });
  });

  it("rechaza fuera de rango", () => {
    expect(parseCoords("95.0, 200.0")).toBeNull();
  });

  it("rechaza texto sin coordenadas", () => {
    expect(parseCoords("hola mundo")).toBeNull();
    expect(parseCoords("")).toBeNull();
  });
});

describe("haversine", () => {
  it("distancia ~0 para el mismo punto", () => {
    expect(haversine({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBeCloseTo(0, 5);
  });

  it("~111 km por grado de latitud", () => {
    const d = haversine({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});
