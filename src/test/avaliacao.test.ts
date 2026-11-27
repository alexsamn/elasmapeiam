import { describe, expect, it } from "vitest";

import { alternarPilula, montarAvaliacao, type EstadoAvaliacao } from "@/lib/avaliacao";

const base: EstadoAvaliacao = { lugarId: "abc", lugarTexto: "", resposta: "sim", motivo: null, pilulas: [], comentario: "" };

describe("Avaliação estruturada", () => {
  it("só a resposta é obrigatória", () => {
    expect(montarAvaliacao(base)).toEqual({ ok: true, avaliacao: { lugarId: "abc", situacao: "sim", marcadores: {} } });
    expect(montarAvaliacao({ ...base, resposta: null })).toMatchObject({ ok: false });
  });

  it("'Não' exige o motivo, que vira a situação", () => {
    expect(montarAvaliacao({ ...base, resposta: "nao" })).toMatchObject({ ok: false });
    expect(montarAvaliacao({ ...base, resposta: "nao", motivo: "fechado" })).toMatchObject({ ok: true, avaliacao: { situacao: "fechado" } });
  });

  it("pílulas viram os mesmos critérios da IA", () => {
    const r = montarAvaliacao({ ...base, pilulas: ["coberto", "pago", "costuma_lotar"] });
    expect(r).toMatchObject({ ok: true, avaliacao: { marcadores: { coberto: "sim", custo: "pago", costuma_lotar: "sim" } } });
  });

  it("Gratuito e Pago não ficam marcados juntos", () => {
    expect(alternarPilula(["gratuito", "coberto"], "pago")).toEqual(["coberto", "pago"]);
    expect(alternarPilula(["pago"], "pago")).toEqual([]);
  });

  it("comentário é opcional, mas com pelo menos 10 caracteres se preenchido", () => {
    expect(montarAvaliacao({ ...base, comentario: "curto" })).toMatchObject({ ok: false });
    expect(montarAvaliacao({ ...base, comentario: "  lota depois das 18h  " })).toMatchObject({ ok: true, avaliacao: { texto: "lota depois das 18h" } });
  });

  it("sugestão de lugar novo exige nome ou endereço", () => {
    expect(montarAvaliacao({ ...base, lugarId: null })).toMatchObject({ ok: false });
    expect(montarAvaliacao({ ...base, lugarId: null, lugarTexto: " Sesc Pinheiros " })).toMatchObject({ ok: true, avaliacao: { lugarTexto: "Sesc Pinheiros" } });
  });
});
