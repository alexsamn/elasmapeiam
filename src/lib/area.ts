/** Retângulo do mapa que a pessoa está vendo (sem a parte coberta pela busca e pelo painel). */
export type Area = { north: number; south: number; east: number; west: number };

export function inArea([lat, lng]: [number, number], a: Area): boolean {
  return lat <= a.north && lat >= a.south && lng <= a.east && lng >= a.west;
}

/**
 * Lugares da lista: com busca por nome, todos (a pessoa procura um lugar específico,
 * mesmo fora da tela); sem área conhecida, todos; senão, só os da área, mantendo o
 * lugar aberto mesmo que ele saia da área.
 */
export function placesInArea<T extends { id: string; position: [number, number] }>(
  places: T[],
  area: Area | null,
  opts: { byName: boolean; selectedId: string | null },
): T[] {
  if (opts.byName || !area) return places;
  return places.filter(p => p.id === opts.selectedId || inArea(p.position, area));
}
