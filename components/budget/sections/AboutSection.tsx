import { Reveal, RevealStagger, RevealItem } from "@/components/Reveal";
import { SectionBlock, SectionHeading } from "@/components/budget/SectionShell";
import type { BlockTone, SectionData } from "@/lib/budgetSections";

/**
 * A leitura que o estúdio faz da marca: título grande e texto de um lado, e do
 * outro o número de destaque com a lista de frentes de trabalho.
 */
export function AboutSection({
  data,
  tone,
  number,
}: {
  data: SectionData["about"];
  tone: BlockTone;
  number: string;
}) {
  const hasAside = data.items.length > 0;

  return (
    <SectionBlock tone={tone}>
      <div className={hasAside ? "grid gap-12 sm:grid-cols-[1.4fr_1fr] sm:gap-16" : ""}>
        <div>
          <SectionHeading
            number={number}
            eyebrow={data.eyebrow}
            title={data.title}
            tone={tone}
          />
          {data.subtitle ? (
            <Reveal>
              <h3 className="mt-8 text-xl font-medium sm:text-2xl">{data.subtitle}</h3>
            </Reveal>
          ) : null}
          {data.text ? (
            <Reveal>
              <p
                className={`mt-6 max-w-xl whitespace-pre-wrap text-base leading-relaxed ${tone.textMuted}`}
              >
                {data.text}
              </p>
            </Reveal>
          ) : null}
        </div>

        {hasAside ? (
          <div>
            {data.items.length > 0 ? (
              <RevealStagger >
                {data.items.map((item, index) => (
                  <RevealItem
                    key={`${item}-${index}`}
                    className={`flex items-baseline gap-3 border-t py-3.5 ${tone.divider}`}
                  >
                    <span className="text-sm font-medium">{item}</span>
                  </RevealItem>
                ))}
              </RevealStagger>
            ) : null}
          </div>
        ) : null}
      </div>
    </SectionBlock>
  );
}
