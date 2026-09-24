import { describe, expect, it } from "vitest";
import {
  CLIENT_COLORS,
  clientColor,
  clientColorSolid,
  isClientColor,
} from "@/lib/backlogTypes";

describe("clientColor", () => {
  it("usa a cor escolhida, da paleta ou livre", () => {
    expect(clientColor({ id: "abc", color: "rose" })).toBe("rose");
    expect(clientColor({ id: "abc", color: "#12ab9f" })).toBe("#12ab9f");
  });

  it("cai na automática sem escolha ou com valor inválido", () => {
    const auto = clientColor({ id: "abc", color: null });
    expect(auto in CLIENT_COLORS).toBe(true);
    expect(clientColor({ id: "abc", color: "vermelho" })).toBe(auto);
    expect(clientColor({ id: "abc", color: "#fff" })).toBe(auto);
  });

  it("a automática é estável para o mesmo cliente", () => {
    const id = "6f1c2d3e-0000-4000-8000-000000000001";
    expect(clientColor({ id, color: null })).toBe(clientColor({ id, color: null }));
  });
});

describe("isClientColor", () => {
  it("não aceita chave herdada de Object", () => {
    expect(isClientColor("toString")).toBe(false);
  });
});

describe("clientColorSolid", () => {
  it("dá hex para o seletor nativo", () => {
    expect(clientColorSolid("sky")).toBe(CLIENT_COLORS.sky.fg);
    expect(clientColorSolid("#12ab9f")).toBe("#12ab9f");
  });
});
