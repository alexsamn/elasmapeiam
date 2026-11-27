import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { parseContribuirSearch } from "@/lib/contribuir";
import { routeTree } from "@/routeTree.gen";

describe("Contribuir", () => {
  it("lê o lugar vindo do card e ignora valores inválidos", () => {
    expect(parseContribuirSearch({ lugar: "abc-123" })).toEqual({ lugar: "abc-123" });
    expect(parseContribuirSearch({ lugar: "   " })).toEqual({});
    expect(parseContribuirSearch({ lugar: 42 })).toEqual({});
    expect(parseContribuirSearch({})).toEqual({});
  });

  it("a rota /contribuir aceita ?lugar=", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const match = router.matchRoutes("/contribuir", { lugar: "abc" }).at(-1);
    expect(match?.routeId).toBe("/contribuir");
  });
});
