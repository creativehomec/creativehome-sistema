import type { ReactNode } from "react";
import { FadeUp } from "@/components/budget/motion/FadeUp";
import { SplitTitle } from "@/components/budget/motion/SplitTitle";
import type { BlockTone } from "@/lib/budgetSections";
import { brandDisplayFontFamily } from "@/lib/brand";

/**
 * O cabeçalho que abre quase toda seção da proposta: o número, um filete, a
 * etiqueta em caixa alta e o título grande.
 *
 * Capa e rodapé não usam — são os dois blocos sem número, que abrem e fecham a
 * página com um desenho próprio.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone,
  className = "",
}: {
  /** Não é mais exibido (o número virou rótulo genérico); mantido para os chamadores. */
  number?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone: BlockTone;
  className?: string;
}) {
  if (!eyebrow && !title && !subtitle) return null;

  return (
    <FadeUp className={className}>
      {eyebrow ? (
        <p className={`mb-6 text-xs font-medium uppercase tracking-[0.25em] ${tone.textMuted}`}>
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <SplitTitle
          style={{ fontFamily: brandDisplayFontFamily }}
          className="max-w-5xl text-4xl leading-[1.05] tracking-wide sm:text-6xl"
        >
          {title}
        </SplitTitle>
      ) : null}
      {subtitle ? (
        <p className={`mt-4 max-w-xl text-base ${tone.textMuted}`}>{subtitle}</p>
      ) : null}
    </FadeUp>
  );
}

/** O bloco full-width com a cor da vez e o respiro padrão da página. */
export function SectionBlock({
  tone,
  id,
  children,
}: {
  tone: BlockTone;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`px-4 py-28 sm:px-8 md:py-44 ${tone.bg} ${tone.text}`}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
