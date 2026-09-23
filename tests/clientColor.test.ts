import { describe, expect, it } from "vitest";
import { CLIENT_COLORS, clientColorKey } from "@/lib/backlogTypes";

describe("clientColorKey", () => {
  it("usa a cor escolhida quando ela existe na paleta", () => {
    expect(clientColorKey({ id: "abc", color: "rose" })).toBe("rose");
  });

  it("cai na automática quando não há escolha ou a chave é desconhecida", () => {
    const auto = clientColorKey({ id: "abc", color: null });
    expect(auto in CLIENT_COLORS).toBe(true);
    expect(clientColorKey({ id: "abc", color: "#ff0000" })).toBe(auto);
  });

  it("a automática é estável para o mesmo cliente", () => {
    const id = "6f1c2d3e-0000-4000-8000-000000000001";
    expect(clientColorKey({ id, color: null })).toBe(
      clientColorKey({ id, color: null })
    );
  });
});
