import { parseRich } from "@/lib/richText";

/** Texto da cena com negrito/itálico/sublinhado vindos dos marcadores. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseRich(text).map((s, k) => (
        <span
          key={k}
          className={`${s.b ? "font-bold" : ""} ${s.i ? "italic" : ""} ${s.u ? "underline" : ""}`}
        >
          {s.text}
        </span>
      ))}
    </>
  );
}
