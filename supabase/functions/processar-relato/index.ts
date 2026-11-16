// Disparada pelo banco (trigger + pg_net) a cada relato novo. Chama o Gemini
// com o prompt versionado, valida o JSON, grava a saída e registra a execução.
// Cada relato é processado uma única vez (a linha é "reservada" antes da chamada).
// Só aceita chamadas com o header x-processar-token (token guardado no Vault).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/http.ts";
import { PROMPTS, validarSaida } from "../_shared/prompts.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Comparação em tempo constante para não vazar o token por tempo de resposta.
function iguais(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let d = 0;
  for (let i = 0; i < ea.length; i++) d |= ea[i] ^ eb[i];
  return d === 0;
}

// Impede que o texto do relato "feche" a tag <relato> e escape do invólucro.
function neutralizarTags(t: string): string {
  return t.replace(/<\s*\/?\s*relato\s*>/gi, "[relato]");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, 405, { erro: "Método não permitido." });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Autenticação interna: só o banco (trigger/reprocessar) conhece o token.
  const recebido = req.headers.get("x-processar-token") ?? "";
  const { data: esperado } = await supabase.rpc("token_processamento");
  if (typeof esperado !== "string" || !esperado || !iguais(recebido, esperado)) {
    return json(req, 401, { erro: "Não autorizado." });
  }

  let relatoId = "";
  try {
    relatoId = String((await req.json()).relato_id ?? "");
  } catch { /* corpo inválido */ }
  if (!UUID.test(relatoId)) return json(req, 400, { erro: "relato_id inválido" });

  const versao = Deno.env.get("PROMPT_VERSAO") ?? "v1";
  const prompt = PROMPTS[versao];
  const modelo = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.1-flash-lite";
  const inicio = Date.now();

  // Reserva o relato: só segue se ainda não foi processado.
  const { data: reservados } = await supabase
    .from("relatos")
    .update({ processado_em: new Date().toISOString(), modelo, prompt_versao: versao })
    .eq("id", relatoId)
    .is("processado_em", null)
    .select("id, texto, lugar_id, lugar_texto");
  const relato = reservados?.[0];
  if (!relato) return json(req, 200, { ok: true, ignorado: true });

  async function registrar(sucesso: boolean, erro: string | null) {
    await supabase.from("execucoes_ia").insert({
      relato_id: relatoId,
      sucesso,
      duracao_ms: Date.now() - inicio,
      modelo,
      prompt_versao: versao,
      erro,
    });
  }
  async function falhar(erro: string) {
    await supabase.from("relatos").update({ ia_erro: erro }).eq("id", relatoId);
    await registrar(false, erro);
    return json(req, 200, { ok: false });
  }

  const chave = Deno.env.get("GEMINI_API_KEY");
  if (!chave) return falhar("GEMINI_API_KEY não configurada");
  if (!prompt) return falhar(`prompt ${versao} não existe`);

  let lugar = relato.lugar_texto as string | null;
  if (relato.lugar_id) {
    const { data } = await supabase.from("lugares").select("nome").eq("id", relato.lugar_id).maybeSingle();
    lugar = data?.nome ?? lugar;
  }
  const conteudo = `${lugar ? `Lugar escolhido no app: ${neutralizarTags(lugar)}\n` : ""}<relato>${neutralizarTags(relato.texto)}</relato>`;

  let bruto: unknown;
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt }] },
        contents: [{ role: "user", parts: [{ text: conteudo }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!resp.ok) return falhar(`Gemini respondeu ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
    const dados = await resp.json();
    const texto: string = (dados?.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim()
      .replace(/^```(?:json)?\s*|\s*```$/g, "");
    bruto = JSON.parse(texto);
  } catch (e) {
    return falhar(`falha ao chamar ou ler o Gemini: ${String(e).slice(0, 300)}`);
  }

  const v = validarSaida(bruto);
  if (!v.ok) return falhar(`JSON fora do formato: ${v.erro}`);
  const s = v.saida;

  const { error } = await supabase
    .from("relatos")
    .update({
      ia_json: s,
      ia_tipo: s.tipo,
      relato_limpo: s.relato_limpo,
      precisa_revisao: s.precisa_revisao,
      motivo_revisao: s.motivo_revisao,
      ia_erro: null,
      status_moderacao: s.tipo === "relato" ? "pendente" : "arquivado",
    })
    .eq("id", relatoId);
  if (error) return falhar(`erro ao gravar: ${error.message}`);

  await registrar(true, null);
  return json(req, 200, { ok: true });
});
