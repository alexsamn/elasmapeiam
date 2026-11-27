import { describeCriteria } from "@/design-system/elasmapeiam-library-4342f4";
import type { Place } from "./mock-places";
import { APP_NAME } from "@/config/app";
import type { Avaliacao } from "@/lib/avaliacao";

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
  tipo_vaga?: "bicicletario" | "estacionamento" | "paraciclo" | "sem_estrutura" | null;
  confirmacoes: number;
  ultima_confirmacao: string | null;
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

/** Rótulo do tipo de vaga no card. Sem tipo informado, fica genérico. */
export const vagaLabels = { bicicletario: "Bicicletário", estacionamento: "Estacionamento", paraciclo: "Paraciclo", sem_estrutura: "Sem estrutura" } as const;

const closedLabels = { fechado: "Fechado", quebrado: "Quebrado", nao_existe_mais: "Não existe mais" } as const;

export function rowToPlace(row: LugarRow): Place {
  const isShop = row.tipo === "oficina";
  const type = isShop ? "Oficina" : row.tipo_vaga ? vagaLabels[row.tipo_vaga] : "Vaga para bike";
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

export interface PlacesResult { places: Place[]; source: "database" | "error" }

/** Oficinas ficam fora do mapa por enquanto (validação de 16/11). */
const onlyParking = (places: Place[]) => places.filter(p => p.kind !== "shop");

/** Lugares publicados. Se o banco falhar, devolve lista vazia com erro (nunca dados fictícios). */
export async function fetchPlaces(): Promise<PlacesResult> {
  if (!backendConfigured) return { places: [], source: "error" };
  try {
    const select = "id,nome,tipo,tipo_vaga,bairro,endereco,lat,lng,criterios,status,confirmacoes,ultima_confirmacao";
    const res = await fetch(`${supabaseUrl}/rest/v1/lugares?select=${select}&status=neq.nao_existe_mais&order=nome`, {
      headers: { apikey: supabaseKey! },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as LugarRow[];
    return { places: onlyParking(rows.map(rowToPlace)), source: "database" };
  } catch (error) {
    console.error(`[${APP_NAME}] não foi possível carregar os lugares:`, error);
    return { places: [], source: "error" };
  }
}

export type SendResult = { ok: true } | { ok: false; message: string };

/** Envia uma avaliação para a função enviar-relato (validação, limite e IA ficam no servidor). */
export async function sendReport(input: Avaliacao): Promise<SendResult> {
  if (!backendConfigured) return { ok: false, message: "O envio ainda não está disponível nesta versão." };
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/enviar-relato`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: supabaseKey! },
      body: JSON.stringify({
        lugar_id: input.lugarId ?? null,
        lugar_texto: input.lugarTexto ?? null,
        situacao: input.situacao,
        marcadores: input.marcadores,
        texto: input.texto ?? null,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { erro?: string } | null;
    return { ok: false, message: body?.erro ?? "Não conseguimos enviar agora. Tente de novo em instantes." };
  } catch {
    return { ok: false, message: "Sem conexão com o servidor. Confira sua internet e tente de novo." };
  }
}
