import { brandDisplayFontFamily } from "@/lib/brand";

/**
 * O título da capa. Só entra com um fade ao carregar (CSS, sem JS e sem
 * scroll): animar por letra travava no meio em alguns navegadores.
 */
export function CoverTitle({ children }: { children: string }) {
  return (
    <h1
      style={{
        fontFamily: brandDisplayFontFamily,
        fontSize: "clamp(2.75rem, 5.2vw, 5.5rem)",
      }}
      className="budget-fade-in mb-6 w-full max-w-6xl leading-[1] tracking-wide"
    >
      {children}
    </h1>
  );
}
