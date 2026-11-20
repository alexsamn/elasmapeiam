import type { PinKind, PlaceStatus } from "@/design-system/elasmapeiam-library-4342f4";

export interface Place {
  id: string;
  kind: PinKind;
  /** Chip shown on the card; defaults to the chip for the pin kind. */
  status?: PlaceStatus;
  statusLabel?: string;
  title: string;
  subtitle: string;
  type: string;
  bairro: string;
  address: string;
  position: [number, number];
  /** Confirmed criteria (catalogue IDs or labels). */
  criteria: string[];
  /** Confirmed negatives and warnings. */
  attention?: string[];
  confirmations: number;
  /** Formatted date of the latest confirmation. */
  lastConfirmed?: string;
}
/** @deprecated use Place */
export type MockPlace = Place;

export const PINHEIROS_CENTER: [number, number] = [-23.5615, -46.6885];

/** Fallback used only when the database is not configured or does not answer. */
export const mockPlaces: Place[] = [
  { id: "p1", kind: "safe", title: "Paraciclo Largo da Batata", subtitle: "Bicicletário · Pinheiros", type: "Bicicletário", bairro: "Pinheiros", address: "Largo da Batata, Pinheiros", position: [-23.5668, -46.6936], criteria: ["coberto", "vigiado", "prende_o_quadro", "movimentado"], confirmations: 14 },
  { id: "p2", kind: "safe", title: "Bicicletário Metrô Faria Lima", subtitle: "Bicicletário · Pinheiros", type: "Bicicletário", bairro: "Pinheiros", address: "R. Capri, 145 - Pinheiros", position: [-23.5673, -46.6923], criteria: ["coberto", "vigiado", "prende_o_quadro"], attention: ["Costuma lotar"], confirmations: 22 },
  { id: "p3", kind: "safe", title: "Paraciclo Praça Benedito Calixto", subtitle: "Bicicletário · Pinheiros", type: "Bicicletário", bairro: "Pinheiros", address: "Praça Benedito Calixto", position: [-23.5579, -46.682], criteria: ["prende_o_quadro", "movimentado"], attention: ["Descoberto"], confirmations: 9 },
  { id: "p4", kind: "unconfirmed", status: "closed", title: "Bicicletário Instituto Tomie Ohtake", subtitle: "Bicicletário · Pinheiros", type: "Bicicletário", bairro: "Pinheiros", address: "Av. Faria Lima, 201", position: [-23.5651, -46.6915], criteria: ["coberto", "camera"], confirmations: 7 },
  { id: "p5", kind: "safe", title: "Paraciclo Metrô Fradique Coutinho", subtitle: "Bicicletário · Pinheiros", type: "Bicicletário", bairro: "Pinheiros", address: "R. Fradique Coutinho, 1500", position: [-23.5661, -46.6843], criteria: ["vigiado", "prende_o_quadro", "movimentado"], confirmations: 11 },
  { id: "p6", kind: "safe", title: "Paraciclo Praça do Pôr do Sol", subtitle: "Bicicletário · Alto de Pinheiros", type: "Bicicletário", bairro: "Alto de Pinheiros", address: "Praça Cel. Custódio Fernandes", position: [-23.5512, -46.704], criteria: ["movimentado"], attention: ["Não prende o quadro", "Descoberto"], confirmations: 5 },
  { id: "p7", kind: "safe", title: "Paraciclo Beco do Batman", subtitle: "Bicicletário · Vila Madalena", type: "Bicicletário", bairro: "Vila Madalena", address: "R. Gonçalo Afonso", position: [-23.5571, -46.6869], criteria: ["prende_o_quadro", "movimentado"], attention: ["Costuma lotar"], confirmations: 8 },
  { id: "p8", kind: "safe", title: "Bicicletário Metrô Vila Madalena", subtitle: "Bicicletário · Vila Madalena", type: "Bicicletário", bairro: "Vila Madalena", address: "R. Heitor Penteado, 1500", position: [-23.5464, -46.6909], criteria: ["coberto", "vigiado", "prende_o_quadro"], confirmations: 18 },
  { id: "s1", kind: "shop", title: "Oficina Pedal Livre", subtitle: "Oficina · Pinheiros", type: "Oficina", bairro: "Pinheiros", address: "R. dos Pinheiros, 870", position: [-23.5642, -46.6858], criteria: ["price_explained", "respectful_service", "deadline_met", "service_explained"], confirmations: 12 },
  { id: "s2", kind: "shop", title: "Bike Conserto Teodoro", subtitle: "Oficina · Pinheiros", type: "Oficina", bairro: "Pinheiros", address: "R. Teodoro Sampaio, 1200", position: [-23.5602, -46.68], criteria: ["respectful_service", "service_explained"], confirmations: 6 },
  { id: "s3", kind: "shop", title: "Garagem das Magrelas", subtitle: "Oficina · Vila Madalena", type: "Oficina", bairro: "Vila Madalena", address: "R. Aspicuelta, 300", position: [-23.5546, -46.6895], criteria: ["price_explained", "deadline_met"], confirmations: 9 },
  { id: "s4", kind: "shop", title: "Oficina Raio de Sol", subtitle: "Oficina · Vila Madalena", type: "Oficina", bairro: "Vila Madalena", address: "R. Harmonia, 520", position: [-23.553, -46.6855], criteria: ["respectful_service", "deadline_met", "service_explained"], confirmations: 4 },
  { id: "s5", kind: "shop", title: "Ciclo Mecânica Wisard", subtitle: "Oficina · Vila Madalena", type: "Oficina", bairro: "Vila Madalena", address: "R. Wisard, 210", position: [-23.556, -46.692], criteria: ["price_explained", "respectful_service"], confirmations: 7 },
  { id: "u1", kind: "unconfirmed", title: "Paraciclo R. Mourato Coelho", subtitle: "Bicicletário · Vila Madalena", type: "Bicicletário", bairro: "Vila Madalena", address: "R. Mourato Coelho, 1000", position: [-23.559, -46.688], criteria: [], confirmations: 0 },
  { id: "u2", kind: "unconfirmed", title: "Paraciclo R. Cardeal Arcoverde", subtitle: "Bicicletário · Pinheiros", type: "Bicicletário", bairro: "Pinheiros", address: "R. Cardeal Arcoverde, 2300", position: [-23.562, -46.696], criteria: [], confirmations: 0 },
];

export const statusForKind: Record<PinKind, PlaceStatus> = { safe: "safe", shop: "shop", unconfirmed: "unconfirmed" };
export const markerKindFor = { safe: "bike_parking", shop: "repair_shop", unconfirmed: "unconfirmed" } as const;
export function distanceMeters(a: [number, number], b: [number, number]) { const R = 6371000, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
export function formatDistance(m: number) { return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`; }
export function placeSubtitle(p: Place, from: [number, number] | null, suffix = "de você") { return from ? `${p.bairro} · ${formatDistance(distanceMeters(from, p.position))} ${suffix}` : `${p.type} · ${p.bairro}`; }
