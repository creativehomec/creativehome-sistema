import { describe, expect, it } from "vitest";
import { buildMovePrompt } from "@/lib/backlog";
import type { BacklogColumn } from "@/lib/backlogTypes";

function coluna(
  id: string,
  name: string,
  billable = false,
  paid = false
): BacklogColumn {
  return {
    id,
    name,
    color: "#000",
    position: 0,
    billable,
    paid,
    created_at: "2026-09-01T00:00:00Z",
  };
}

// Fluxo do quadro: a espera é a coluna faturável ainda não paga, e "Entregue"
// é a faturável já paga.
const espera = coluna("w", "Aguardando pagamento", true, false);
const entregue = coluna("e", "Entregue", true, true);
const emEdicao = coluna("x", "Em edição");

describe("buildMovePrompt", () => {
  it("pergunta do pagamento ao chegar na coluna de dinheiro recebido", () => {
    const prompt = buildMovePrompt({
      columns: [emEdicao, espera, entregue],
      toColumnId: "e",
      fromName: "Em edição",
      toName: "Entregue",
    });
    expect(prompt).toMatchObject({ kind: "payment", waitingColumnId: "w" });
  });

  it("cala sem uma coluna de espera pra onde devolver o card", () => {
    const prompt = buildMovePrompt({
      columns: [emEdicao, entregue],
      toColumnId: "e",
      fromName: "Em edição",
      toName: "Entregue",
    });
    expect(prompt).toBeNull();
  });

  it("não pergunta na coluna que entra na nota mas ainda não recebeu", () => {
    const prompt = buildMovePrompt({
      columns: [emEdicao, espera, entregue],
      toColumnId: "w",
      fromName: "Em edição",
      toName: "Aguardando pagamento",
    });
    expect(prompt).toBeNull();
  });
});
