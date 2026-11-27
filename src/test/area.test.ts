import { describe, expect, it } from "vitest";

import { inArea, placesInArea, type Area } from "@/lib/area";

const paulista: Area = { north: -23.55, south: -23.57, west: -46.67, east: -46.64 };
const lugares = [
  { id: "conjunto", position: [-23.5606, -46.6566] as [number, number] },
  { id: "pinheiros", position: [-23.5667, -46.7019] as [number, number] },
  { id: "centro", position: [-23.5431, -46.6291] as [number, number] },
];

describe("Lista pela área do mapa", () => {
  it("sabe se um ponto está na área", () => {
    expect(inArea([-23.5606, -46.6566], paulista)).toBe(true);
    expect(inArea([-23.5667, -46.7019], paulista)).toBe(false);
  });

  it("mostra só os lugares da área", () => {
    expect(placesInArea(lugares, paulista, { byName: false, selectedId: null }).map(p => p.id)).toEqual(["conjunto"]);
  });

  it("sem área conhecida, mostra todos", () => {
    expect(placesInArea(lugares, null, { byName: false, selectedId: null })).toHaveLength(3);
  });

  it("busca por nome ignora a área", () => {
    expect(placesInArea(lugares, paulista, { byName: true, selectedId: null })).toHaveLength(3);
  });

  it("o lugar aberto continua na lista mesmo fora da área", () => {
    expect(placesInArea(lugares, paulista, { byName: false, selectedId: "pinheiros" }).map(p => p.id)).toEqual(["conjunto", "pinheiros"]);
  });
});
