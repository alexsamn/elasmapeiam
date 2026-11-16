// CORS: em produção, defina o secret ALLOWED_ORIGIN com o endereço do app
// (ex.: https://elasmapeiam.pages.dev). Sem ele, qualquer origem é aceita.
export function corsHeaders(req: Request): Record<string, string> {
  const permitido = Deno.env.get("ALLOWED_ORIGIN");
  const origem = req.headers.get("origin") ?? "";
  const allow = !permitido ? "*" : permitido.split(",").map((s) => s.trim()).includes(origem) ? origem : permitido.split(",")[0].trim();
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8" },
  });
}
