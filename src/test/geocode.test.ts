import { describe, expect, it } from "vitest";
import { buildSearchUrl, toGeoResult } from "@/lib/geocode";

describe("busca de endereço", () => {
  it("limita a busca à cidade de São Paulo", () => {
    const url = new URL(buildSearchUrl("Av. Paulista, 1230"));
    expect(url.hostname).toBe("nominatim.openstreetmap.org");
    expect(url.searchParams.get("q")).toBe("Av. Paulista, 1230");
    expect(url.searchParams.get("bounded")).toBe("1");
    expect(url.searchParams.get("countrycodes")).toBe("br");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("monta um rótulo curto com rua, número e bairro", () => {
    const r = toGeoResult({
      place_id: 1,
      lat: "-23.5629",
      lon: "-46.6544",
      display_name: "1230, Avenida Paulista, Bela Vista, São Paulo, Brasil",
      address: {
        road: "Avenida Paulista",
        house_number: "1230",
        suburb: "Bela Vista",
        city: "São Paulo",
      },
    });
    expect(r).toEqual({
      id: "1",
      label: "Avenida Paulista, 1230",
      detail: "Bela Vista, São Paulo",
      position: [-23.5629, -46.6544],
    });
  });

  it("usa o nome do lugar quando existe e põe a rua no detalhe", () => {
    const r = toGeoResult({
      place_id: 2,
      lat: "-23.56",
      lon: "-46.65",
      name: "Shopping Cidade São Paulo",
      display_name: "Shopping Cidade São Paulo, Avenida Paulista, Bela Vista, São Paulo",
      address: { road: "Avenida Paulista", suburb: "Bela Vista", city: "São Paulo" },
    });
    expect(r.label).toBe("Shopping Cidade São Paulo");
    expect(r.detail).toBe("Avenida Paulista, Bela Vista, São Paulo");
  });
});
