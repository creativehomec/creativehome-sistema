import { CountUp } from "@/components/budget/motion/CountUp";
import { FadeUp } from "@/components/budget/motion/FadeUp";
import { StaggerIn } from "@/components/budget/motion/StaggerIn";
import { SectionBlock, SectionHeading } from "@/components/budget/SectionShell";
import type { BlockTone, SectionData } from "@/lib/budgetSections";
import { brandDisplayFontFamily } from "@/lib/brand";

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
  const hasAside = Boolean(data.statNumber) || data.items.length > 0;

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
            <FadeUp>
              <h3 className="mt-8 text-xl font-bold sm:text-2xl">{data.subtitle}</h3>
            </FadeUp>
          ) : null}
          {data.text ? (
            <FadeUp>
              <p
                className={`mt-6 max-w-xl whitespace-pre-wrap text-base leading-relaxed ${tone.textMuted}`}
              >
                {data.text}
              </p>
            </FadeUp>
          ) : null}
        </div>

        {hasAside ? (
          <div>
            {data.statNumber ? (
              <FadeUp>
                <CountUp
                  value={data.statNumber}
                  style={{ fontFamily: brandDisplayFontFamily }}
                  className="text-5xl leading-none tracking-wide sm:text-6xl"
                />
                {data.statCaption ? (
                  <p className={`mt-3 max-w-[16rem] text-sm ${tone.textMuted}`}>
                    {data.statCaption}
                  </p>
                ) : null}
              </FadeUp>
            ) : null}

            {data.items.length > 0 ? (
              <StaggerIn className={data.statNumber ? "mt-10" : ""}>
                {data.items.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className={`flex items-baseline gap-3 border-t py-3.5 ${tone.divider}`}
                  >
                    <span className={`text-xs tabular-nums ${tone.textMuted}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </StaggerIn>
            ) : null}
          </div>
        ) : null}
      </div>
    </SectionBlock>
  );
}
