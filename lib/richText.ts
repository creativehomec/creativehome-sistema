// Formatação inline dentro do texto puro das cenas: **negrito**, ~~itálico~~, __sublinhado__.
// O editor insere os marcadores (atalhos cmd+b/i/u); página e PDF leem com parseRich.
export type RichSpan = { text: string; b: boolean; i: boolean; u: boolean };

export const RICH_MARKERS = { b: "**", i: "~~", u: "__" } as const;

const TOKEN = /(\*\*|~~|__)/;

export function parseRich(input: string): RichSpan[] {
  const spans: RichSpan[] = [];
  const state = { b: false, i: false, u: false };
  for (const part of input.split(TOKEN)) {
    if (part === "**") state.b = !state.b;
    else if (part === "~~") state.i = !state.i;
    else if (part === "__") state.u = !state.u;
    else if (part) spans.push({ text: part, ...state });
  }
  return spans;
}
