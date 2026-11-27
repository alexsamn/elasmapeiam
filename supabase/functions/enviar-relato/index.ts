// Recebe uma avaliação do formulário Avaliar, valida, aplica o limite de envios
// e grava em `relatos` como pendente. Se houver texto, a gravação dispara
// (trigger no banco) a função processar-relato, que chama o Gemini.
// 21/11/2026: avaliação estruturada — "Dá pra parar a bike aqui?" (situacao,
// obrigatória no app), pílulas (marcadores) e texto opcional.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/http.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITUACOES = ["sim", "ressalvas", "fechado", "quebrado", "nao_existe_mais"];
// Pílulas: mesmas chaves do JSON da IA. Só valores que alguém confirmou.
const MARCADORES: Record<string, string[]> = {
  vigiado: ["sim"], camera: ["sim"], controle_de_acesso: ["sim"], coberto: ["sim"],
  movimentado: ["sim"], prende_o_quadro: ["sim"], costuma_lotar: ["sim"], custo: ["gratuito", "pago"],
};

function lerMarcadores(bruto: unknown): Record<string, string> | null {
  if (bruto == null) return {};
  if (typeof bruto !== "object" || Array.isArray(bruto)) return null;
  const saida: Record<string, string> = {};
  for (const [k, v] of Object.entries(bruto as Record<string, unknown>)) {
    if (!MARCADORES[k] || typeof v !== "string" || !MARCADORES[k].includes(v)) return null;
    saida[k] = v;
  }
  return saida;
}

async function hashIp(ip: string): Promise<string> {
  // HMAC com a chave de serviço: o IP puro nunca é gravado e o hash não pode ser
  // revertido testando todos os IPs sem conhecer a chave.
  const chave = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(chave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { erro: "Método não permitido." });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { erro: "Não entendemos o envio. Tente de novo." });
  }

  const texto = typeof body.texto === "string" ? body.texto.trim() : "";
  const situacao = typeof body.situacao === "string" ? body.situacao : null;
  if (situacao !== null && !SITUACOES.includes(situacao)) return json(req, 400, { erro: "Resposta inválida." });
  const marcadores = lerMarcadores(body.marcadores);
  if (!marcadores) return json(req, 400, { erro: "Marcações inválidas." });
  if (!situacao && !texto) return json(req, 400, { erro: "Responda se dá pra parar a bike aqui." });
  if (texto && texto.length < 10) return json(req, 400, { erro: "Conte um pouco mais: escreva pelo menos 10 caracteres." });
  if (texto.length > 1000) return json(req, 400, { erro: "O comentário pode ter até 1.000 caracteres." });

  const lugarId = typeof body.lugar_id === "string" && body.lugar_id ? body.lugar_id : null;
  if (lugarId && !UUID.test(lugarId)) return json(req, 400, { erro: "Lugar inválido." });
  const lugarTexto = typeof body.lugar_texto === "string" ? body.lugar_texto.trim().slice(0, 120) || null : null;
  if (!lugarId && (!lugarTexto || lugarTexto.length < 3)) return json(req, 400, { erro: "Diga o nome ou o endereço do lugar." });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (lugarId) {
    const { data } = await supabase.from("lugares").select("id").eq("id", lugarId).eq("publicado", true).maybeSingle();
    if (!data) return json(req, 400, { erro: "Esse lugar não está no mapa." });
  }

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "desconhecido";
  const ipHash = await hashIp(ip);
  const limite = Number(Deno.env.get("LIMITE_RELATOS_DIA") ?? "5") || 5;
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: erroContagem } = await supabase
    .from("relatos")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", desde);
  if (erroContagem) return json(req, 500, { erro: "Não conseguimos salvar agora. Tente de novo em instantes." });
  if ((count ?? 0) >= limite) {
    return json(req, 429, { erro: `Você já enviou ${limite} avaliações hoje. Obrigada! Tente de novo amanhã.` });
  }

  const { error } = await supabase.from("relatos").insert({
    lugar_id: lugarId,
    lugar_texto: lugarId ? null : lugarTexto,
    texto: texto || null,
    situacao,
    marcadores,
    origem: "app",
    ip_hash: ipHash,
  });
  if (error) return json(req, 500, { erro: "Não conseguimos salvar agora. Tente de novo em instantes." });

  return json(req, 200, { ok: true });
});
