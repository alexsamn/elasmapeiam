import { describe, expect, it } from "vitest";
import { rowToPlace } from "@/data/places";

const base = {
  id: "1",
  nome: "Shopping Light",
  tipo: "bicicletario" as const,
  bairro: "República",
  endereco: "R. Cel. Xavier de Toledo, 23",
  lat: -23.5467,
  lng: -46.6386,
  criterios: {},
  status: "desconhecido" as const,
  confirmacoes: 0,
  ultima_confirmacao: null,
};

describe("tipo de vaga no card", () => {
  it("mostra o tipo informado no subtítulo", () => {
    expect(rowToPlace({ ...base, tipo_vaga: "estacionamento" }).subtitle).toBe(
      "Estacionamento · República",
    );
    expect(rowToPlace({ ...base, tipo_vaga: "paraciclo" }).subtitle).toBe("Paraciclo · República");
  });

  it("usa um rótulo genérico quando o tipo não foi informado", () => {
    expect(rowToPlace({ ...base, tipo_vaga: null }).subtitle).toBe("Vaga para bike · República");
  });

  it("lugar importado sem confirmação aparece como não confirmado", () => {
    const place = rowToPlace({ ...base, tipo_vaga: "estacionamento" });
    expect(place.statusLabel).toBe("Não confirmado");
    expect(place.lastConfirmed).toBeUndefined();
  });
});
