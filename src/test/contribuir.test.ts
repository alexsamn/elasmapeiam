import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import type { Place } from "@/data/mock-places";
import { lugaresParaRelato, parseContribuirSearch } from "@/lib/contribuir";
import { routeTree } from "@/routeTree.gen";

const base = { subtitle: "", bairro: "Centro", address: "", position: [-23.56, -46.65] as [number, number], criteria: [], confirmations: 0 };
const lugar = (id: string, title: string, type: string, kind: Place["kind"] = "unconfirmed"): Place => ({ ...base, id, title, type, kind });

describe("Contribuir", () => {
  it("lê o lugar vindo do card e ignora valores inválidos", () => {
    expect(parseContribuirSearch({ lugar: "abc-123" })).toEqual({ lugar: "abc-123" });
    expect(parseContribuirSearch({ lugar: "   " })).toEqual({});
    expect(parseContribuirSearch({ lugar: 42 })).toEqual({});
    expect(parseContribuirSearch({})).toEqual({});
  });

  it("lista todos os tipos de vaga (menos oficina), em ordem alfabética", () => {
    const lista = lugaresParaRelato([
      lugar("1", "Shopping B", "Estacionamento"),
      lugar("2", "Estação A", "Vaga para bike"),
      lugar("3", "Oficina C", "Oficina", "shop"),
      lugar("4", "Praça D", "Paraciclo"),
      lugar("5", "Ácido E", "Bicicletário", "safe"),
    ]);
    expect(lista.map(p => p.id)).toEqual(["5", "2", "4", "1"]);
  });

  it("a rota /contribuir aceita ?lugar=", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const match = router.matchRoutes("/contribuir", { lugar: "abc" }).at(-1);
    expect(match?.routeId).toBe("/contribuir");
  });
});
