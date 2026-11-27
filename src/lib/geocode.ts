/**
 * Busca de endereços com o Nominatim (OpenStreetMap): grátis e sem chave.
 * Regras de uso do serviço: no máximo 1 busca por segundo e nada de autocomplete
 * a cada letra. Por isso o app só busca quando a pessoa aperta Enter.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

export interface GeoResult {
  id: string;
  /** Linha principal curta, ex.: "Av. Paulista, 1230". */
  label: string;
  /** Linha de apoio, ex.: "Bela Vista, São Paulo". */
  detail: string;
  position: [number, number];
}

/** Retângulo da cidade de São Paulo (oeste, norte, leste, sul). */
const SAO_PAULO_VIEWBOX = "-46.83,-23.35,-46.36,-24.01";
const ENDPOINT = "https://nominatim.openstreetmap.org/search";

interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: Record<string, string | undefined>;
}

export function buildSearchUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    countrycodes: "br",
    viewbox: SAO_PAULO_VIEWBOX,
    bounded: "1",
    "accept-language": "pt-BR",
  });
  return `${ENDPOINT}?${params.toString()}`;
}

export function toGeoResult(item: NominatimItem): GeoResult {
  const a = item.address ?? {};
  const road = a["road"] ?? a["pedestrian"] ?? a["footway"] ?? a["square"];
  const street = road ? [road, a["house_number"]].filter(Boolean).join(", ") : undefined;
  const label =
    item.name && item.name !== road
      ? item.name
      : (street ?? item.display_name.split(",")[0]?.trim() ?? item.display_name);
  const area = a["suburb"] ?? a["neighbourhood"] ?? a["city_district"] ?? a["quarter"];
  const detailParts = [
    label === street ? undefined : street,
    area,
    a["city"] ?? "São Paulo",
  ].filter((part): part is string => Boolean(part));
  return {
    id: String(item.place_id),
    label,
    detail: [...new Set(detailParts)].join(", "),
    position: [Number(item.lat), Number(item.lon)],
  };
}

const cache = new Map<string, GeoResult[]>();

/** Busca endereços em São Paulo. Lança erro se o serviço não responder. */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const key = query.trim().toLocaleLowerCase("pt-BR");
  const cached = cache.get(key);
  if (cached) return cached;
  const response = await fetch(buildSearchUrl(query.trim()), {
    signal: signal ?? null,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  const items = (await response.json()) as NominatimItem[];
  const results = items
    .map(toGeoResult)
    .filter((r) => Number.isFinite(r.position[0]) && Number.isFinite(r.position[1]));
  cache.set(key, results);
  return results;
}
