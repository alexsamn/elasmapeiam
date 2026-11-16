import { describeCriteria } from "@/design-system/elasmapeiam-library-4342f4";
import { mockPlaces, type Place } from "./mock-places";
import { APP_NAME } from "@/config/app";

/**
 * Endereço e chave pública (publishable) do Supabase. Não são segredos: a proteção
 * dos dados é o RLS no banco. As variáveis de ambiente têm prioridade; os valores
 * padrão permitem publicar na Vercel sem configurar nada.
 */
const DEFAULT_URL = "https://abgwjcmpohzihfjraqew.supabase.co";
const DEFAULT_KEY = "sb_publishable_IdjBRiWIDFdsyaIMfzbNCQ_TGPtc_Rk";
export const supabaseUrl = ((import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || DEFAULT_URL).replace(/\/+$/, "");
export const supabaseKey = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) || DEFAULT_KEY;
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

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

const closedLabels = { fechado: "Fechado", quebrado: "Quebrado", nao_existe_mais: "Não existe mais" } as const;

export function rowToPlace(row: LugarRow): Place {
  const isShop = row.tipo === "oficina";
  const type = isShop ? "Oficina" : "Bicicletário";
  const { confirmed, attention } = describeCriteria(row.criterios);
  const closed = row.status === "fechado" || row.status === "quebrado" || row.status === "nao_existe_mais";
  const working = row.status === "funcionando" && row.confirmacoes > 0;
  const kind = isShop ? "shop" : working ? "safe" : "unconfirmed";
  // Status do bicicletário no topo do card: Funcionando / Fechado / Quebrado / Não existe mais / Não confirmado.
  const status = isShop
    ? {}
    : closed
      ? { status: "closed" as const, statusLabel: closedLabels[row.status as keyof typeof closedLabels] }
      : working
        ? { status: "safe" as const, statusLabel: "Funcionando" }
        : { status: "unconfirmed" as const, statusLabel: "Não confirmado" };
  return {
    id: row.id,
    kind,
    ...status,
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

/** Oficinas ficam fora do mapa por enquanto (validação de 16/11). */
const onlyParking = (places: Place[]) => places.filter(p => p.kind !== "shop");

/** Dados de demonstração com o mesmo rótulo de status do banco. */
const demoPlaces = (): Place[] =>
  onlyParking(mockPlaces).map(p => (p.statusLabel || p.status ? p : { ...p, statusLabel: p.kind === "safe" ? "Funcionando" : "Não confirmado" }));

/** Bicicletários publicados. Se o banco não estiver configurado ou falhar, usa os dados de demonstração. */
export async function fetchPlaces(): Promise<PlacesResult> {
  if (!backendConfigured) return { places: demoPlaces(), source: "demo" };
  try {
    const select = "id,nome,tipo,bairro,endereco,lat,lng,criterios,status,confirmacoes,ultima_confirmacao";
    const res = await fetch(`${supabaseUrl}/rest/v1/lugares?select=${select}&status=neq.nao_existe_mais&order=nome`, {
      headers: { apikey: supabaseKey! },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as LugarRow[];
    return { places: onlyParking(rows.map(rowToPlace)), source: "database" };
  } catch (error) {
    console.error(`[${APP_NAME}] usando dados de demonstração:`, error);
    return { places: demoPlaces(), source: "demo" };
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
