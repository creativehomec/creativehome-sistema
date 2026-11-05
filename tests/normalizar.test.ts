import { describe, expect, it } from "vitest";
import { normalizarCidade, normalizarNicho } from "@/lib/normalizar";

const cidades = ["Luís Eduardo Magalhães, BA", "Boa Vista, RR", "Boa Vista, PB", "Curitiba, PR", "São Paulo, SP"];

describe("normalizarCidade", () => {
  it("corrige acento, caixa e UF", () => {
    expect(normalizarCidade("luis eduardo magalhaes", cidades)).toBe("Luís Eduardo Magalhães, BA");
    expect(normalizarCidade("CURITIBA - pr", cidades)).toBe("Curitiba, PR");
  });
  it("corrige erro de digitação", () => {
    expect(normalizarCidade("Curitba, PR", cidades)).toBe("Curitiba, PR");
    expect(normalizarCidade("sao paolo", cidades)).toBe("São Paulo, SP");
  });
  it("não adivinha quando há mais de uma cidade com o nome", () => {
    expect(normalizarCidade("boa vista", cidades)).toBe("boa vista");
    expect(normalizarCidade("boa vista pb", cidades)).toBe("Boa Vista, PB");
  });
});

describe("normalizarNicho", () => {
  const cats = ["Dentista", "Clínica odontológica", "Academia", "Padaria"];
  it("corrige acento e digitação, mantém o que não conhece", () => {
    expect(normalizarNicho("clinica odontologica", cats)).toBe("Clínica odontológica");
    expect(normalizarNicho("dentisa", cats)).toBe("Dentista");
    expect(normalizarNicho("  loja   de   drones ", cats)).toBe("loja de drones");
  });
});
