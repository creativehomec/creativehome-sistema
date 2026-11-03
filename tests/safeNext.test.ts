import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safeNext";

describe("safeNext", () => {
  it("mantém caminho interno, com busca", () => {
    expect(safeNext("/cliente/previa?cliente=abc")).toBe("/cliente/previa?cliente=abc");
    expect(safeNext("/admin/backlog")).toBe("/admin/backlog");
  });

  it("recusa endereço de fora do sistema", () => {
    expect(safeNext("https://outro-site.com")).toBe("/admin");
    expect(safeNext("//outro-site.com")).toBe("/admin");
    expect(safeNext("/\\outro-site.com")).toBe("/admin");
    expect(safeNext("javascript:alert(1)")).toBe("/admin");
  });

  it("não volta para o logout logo depois de entrar", () => {
    expect(safeNext("/cliente/sair")).toBe("/admin");
    expect(safeNext("/cliente/sair?x=1")).toBe("/admin");
  });

  it("vazio cai no padrão", () => {
    expect(safeNext("")).toBe("/admin");
    expect(safeNext(null)).toBe("/admin");
  });
});
