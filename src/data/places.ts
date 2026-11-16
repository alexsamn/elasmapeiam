import { describeCriteria } from "@/design-system/elasmapeiam-library-4342f4";
import { mockPlaces, type Place } from "./mock-places";

/** Endereço e chave pública (publishable) do Supabase. Não são segredos. */
export const supabaseUrl = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.replace(/\/+$/, "");
export const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
export const backendConfigured = Boolean(supabaseUrl && supabaseKey);

interface LugarRow {
  id: string;
  nome: string;
  tipo: "bicicletario" | "oficina";
  bairro: string;
  endereco: string | null;
  lat: number;
  lng: number;
  criterios: Record<string, unknown> | null;
  status: "funcionando" | "fechado" | "quebrado" | "nao_existe_mais" | "desconhecido";
  confirmacoes: number;
  ultima_confirmacao: string | null;
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

export function rowToPlace(row: LugarRow): Place {
  const isShop = row.tipo === "oficina";
  const type = isShop ? "Oficina" : "Bicicletário";
  const { confirmed, attention } = describeCriteria(row.criterios);
  const closed = row.status === "fechado" || row.status === "quebrado";
  const kind = isShop ? "shop" : closed || row.confirmacoes <= 0 || row.status === "desconhecido" ? "unconfirmed" : "safe";
  return {
    id: row.id,
    kind,
    ...(closed ? { status: "closed" as const, statusLabel: row.status === "quebrado" ? "Quebrado" : "Fechado" } : {}),
    title: row.nome,
    subtitle: `${type} · ${row.bairro}`,
    type,
    bairro: row.bairro,
    address: row.endereco ?? row.bairro,
    position: [row.lat, row.lng],
    criteria: confirmed,
    attention,
    confirmations: row.confirmacoes,
    ...(row.ultima_confirmacao ? { lastConfirmed: dateFormat.format(new Date(row.ultima_confirmacao)) } : {}),
  };
}

export interface PlacesResult { places: Place[]; source: "database" | "demo" }

/** Lugares publicados. Se o banco não estiver configurado ou falhar, usa os dados de demonstração. */
export async function fetchPlaces(): Promise<PlacesResult> {
  if (!backendConfigured) return { places: mockPlaces, source: "demo" };
  try {
    const select = "id,nome,tipo,bairro,endereco,lat,lng,criterios,status,confirmacoes,ultima_confirmacao";
    const res = await fetch(`${supabaseUrl}/rest/v1/lugares?select=${select}&status=neq.nao_existe_mais&order=nome`, {
      headers: { apikey: supabaseKey! },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as LugarRow[];
    return { places: rows.map(rowToPlace), source: "database" };
  } catch (error) {
    console.error("[ElasMapeiam] usando dados de demonstração:", error);
    return { places: mockPlaces, source: "demo" };
  }
}

export type SendResult = { ok: true } | { ok: false; message: string };

/** Envia um relato para a função enviar-relato (validação, limite e IA ficam no servidor). */
export async function sendReport(input: { lugarId?: string; lugarTexto?: string; texto: string }): Promise<SendResult> {
  if (!backendConfigured) return { ok: false, message: "O envio ainda não está disponível nesta versão." };
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/enviar-relato`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: supabaseKey! },
      body: JSON.stringify({ lugar_id: input.lugarId ?? null, lugar_texto: input.lugarTexto ?? null, texto: input.texto }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { erro?: string } | null;
    return { ok: false, message: body?.erro ?? "Não conseguimos enviar agora. Tente de novo em instantes." };
  } catch {
    return { ok: false, message: "Sem conexão com o servidor. Confira sua internet e tente de novo." };
  }
}
