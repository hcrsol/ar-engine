import { describe, it, expect } from "vitest";
import {
  parseCoords,
  haversine,
  bearing,
  relativeAngle,
  destination,
} from "./geo";

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

describe("bearing", () => {
  it("hacia el norte ~0°", () => {
    expect(bearing({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(0, 1);
  });

  it("hacia el este ~90°", () => {
    expect(bearing({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(90, 1);
  });

  it("hacia el sur ~180°", () => {
    expect(bearing({ lat: 0, lng: 0 }, { lat: -1, lng: 0 })).toBeCloseTo(180, 1);
  });
});

describe("relativeAngle", () => {
  it("mismo rumbo = 0 (de frente)", () => {
    expect(relativeAngle(90, 90)).toBe(0);
  });

  it("objetivo a la derecha = positivo", () => {
    expect(relativeAngle(0, 45)).toBe(45);
  });

  it("objetivo a la izquierda = negativo", () => {
    expect(relativeAngle(0, 315)).toBe(-45);
  });

  it("cruza el 360 sin saltar", () => {
    expect(relativeAngle(350, 10)).toBe(20);
  });
});

describe("destination", () => {
  const origin = { lat: -33, lng: -71 };

  it("a 30 m está a ~30 m del origen", () => {
    const d = destination(origin, 90, 30);
    expect(haversine(origin, d)).toBeCloseTo(30, 0);
  });

  it("el rumbo al destino coincide con el pedido", () => {
    const d = destination(origin, 90, 30);
    expect(bearing(origin, d)).toBeCloseTo(90, 0);
  });

  it("norte sube la latitud, sur la baja", () => {
    expect(destination(origin, 0, 50).lat).toBeGreaterThan(origin.lat);
    expect(destination(origin, 180, 50).lat).toBeLessThan(origin.lat);
  });
});
