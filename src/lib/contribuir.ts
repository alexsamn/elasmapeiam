import type { Place } from "@/data/mock-places";

/** `?lugar=<id>`: quem vem do card de um lugar já chega com ele escolhido. */
export type ContribuirSearch = { lugar?: string };

export function parseContribuirSearch(search: Record<string, unknown>): ContribuirSearch {
  const lugar = typeof search["lugar"] === "string" ? search["lugar"].trim().slice(0, 100) : "";
  return lugar ? { lugar } : {};
}

/** Lugares que aceitam relato (tudo menos oficina), em ordem alfabética. */
export function lugaresParaRelato(places: Place[]): Place[] {
  return places.filter(p => p.kind !== "shop").sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
}
