import { describe, expect, it } from "vitest";
import { parseRich } from "@/lib/richText";

describe("parseRich", () => {
  it("lê negrito, itálico e sublinhado, inclusive aninhados", () => {
    expect(parseRich("a **b ~~c~~** __d__")).toEqual([
      { text: "a ", b: false, i: false, u: false },
      { text: "b ", b: true, i: false, u: false },
      { text: "c", b: true, i: true, u: false },
      { text: " ", b: false, i: false, u: false },
      { text: "d", b: false, i: false, u: true },
    ]);
  });
  it("texto sem marcador passa intacto", () => {
    expect(parseRich("10% OFF")).toEqual([{ text: "10% OFF", b: false, i: false, u: false }]);
  });
});
