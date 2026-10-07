import { ScrollSteps } from "@/components/budget/motion/ScrollSteps";
import { SectionBlock, SectionHeading } from "@/components/budget/SectionShell";
import type { BlockTone, ListSectionData } from "@/lib/budgetSections";

/**
 * A forma genérica de seção: cabeçalho e etapas verticais numeradas, que
 * acendem conforme a página rola.
 * Serve as quatro seções que só precisam disso — os dois blocos de
 * diferenciais de pacote, o "mas se você precisa" e a estratégia.
 */
export function ListSection({
  data,
  tone,
  number,
}: {
  data: ListSectionData;
  tone: BlockTone;
  number: string;
}) {
  return (
    <SectionBlock tone={tone}>
      <SectionHeading
        number={number}
        eyebrow={data.eyebrow}
        title={data.title}
        subtitle={data.subtitle}
        tone={tone}
        className="mb-12"
      />
      <ScrollSteps
        items={data.items}
        dividerClass={tone.divider}
        mutedClass={tone.textMuted}
      />
    </SectionBlock>
  );
}
