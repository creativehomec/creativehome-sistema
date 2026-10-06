"use client";

import type { KeyboardEvent, TextareaHTMLAttributes } from "react";
import { RICH_MARKERS } from "@/lib/richText";

const TECLAS: Record<string, keyof typeof RICH_MARKERS> = { b: "b", i: "i", u: "u" };

/** Textarea com atalhos cmd/ctrl+B, I e U que envolvem a seleção nos marcadores. */
export function RichTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    props.onKeyDown?.(e);
    const tipo = TECLAS[e.key.toLowerCase()];
    if (!tipo || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
    e.preventDefault();
    const el = e.currentTarget;
    const m = RICH_MARKERS[tipo];
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b);
    // Seleção já marcada (por dentro ou por fora) desmarca em vez de dobrar.
    if (sel.startsWith(m) && sel.endsWith(m) && sel.length >= 2 * m.length) {
      el.setRangeText(sel.slice(m.length, -m.length), a, b, "select");
    } else if (value.slice(a - m.length, a) === m && value.slice(b, b + m.length) === m) {
      el.setRangeText(sel, a - m.length, b + m.length, "select");
    } else {
      el.setRangeText(m + sel + m, a, b, "preserve");
      el.setSelectionRange(a + m.length, b + m.length);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  return <textarea {...props} onKeyDown={onKeyDown} />;
}
