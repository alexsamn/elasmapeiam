// Recebe um relato do formulário Contribuir, valida, aplica o limite de envios
// e grava em `relatos` como pendente. A gravação dispara (trigger no banco)
// a função processar-relato, que chama o Gemini.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/http.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (texto.length < 10) return json(req, 400, { erro: "Conte um pouco mais: escreva pelo menos 10 caracteres." });
  if (texto.length > 1000) return json(req, 400, { erro: "O relato pode ter até 1.000 caracteres." });

  const lugarId = typeof body.lugar_id === "string" && body.lugar_id ? body.lugar_id : null;
  if (lugarId && !UUID.test(lugarId)) return json(req, 400, { erro: "Lugar inválido." });
  const lugarTexto = typeof body.lugar_texto === "string" ? body.lugar_texto.trim().slice(0, 120) || null : null;

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
    return json(req, 429, { erro: `Você já enviou ${limite} relatos hoje. Obrigada! Tente de novo amanhã.` });
  }

  const { error } = await supabase.from("relatos").insert({
    lugar_id: lugarId,
    lugar_texto: lugarId ? null : lugarTexto,
    texto,
    origem: "app",
    ip_hash: ipHash,
  });
  if (error) return json(req, 500, { erro: "Não conseguimos salvar agora. Tente de novo em instantes." });

  return json(req, 200, { ok: true });
});
