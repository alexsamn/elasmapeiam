/** `?lugar=<id>`: quem vem do card de um lugar já chega com ele escolhido. */
export type ContribuirSearch = { lugar?: string };

export function parseContribuirSearch(search: Record<string, unknown>): ContribuirSearch {
  const lugar = typeof search["lugar"] === "string" ? search["lugar"].trim().slice(0, 100) : "";
  return lugar ? { lugar } : {};
}
