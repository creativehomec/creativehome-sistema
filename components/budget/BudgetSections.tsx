import { BudgetMenu } from "@/components/budget/motion/BudgetMenu";
import {
  blockTone,
  type BlockTone,
  SECTION_LABELS,
  isNumbered,
  sectionNumber,
  visibleSections,
  type BudgetSection,
} from "@/lib/budgetSections";
import { CoverSection } from "@/components/budget/sections/CoverSection";
import { AboutSection } from "@/components/budget/sections/AboutSection";
import { PortfolioSection } from "@/components/budget/sections/PortfolioSection";
import { LogosSection } from "@/components/budget/sections/LogosSection";
import { ListSection } from "@/components/budget/sections/ListSection";
import { PricingSection } from "@/components/budget/sections/PricingSection";
import { FaqSection } from "@/components/budget/sections/FaqSection";
import { FooterSection } from "@/components/budget/sections/FooterSection";

/**
 * Monta a proposta a partir do array de seções.
 *
 * É o mesmo componente nos dois lados: a página pública renderiza no servidor,
 * e o editor do admin renderiza no cliente com o estado do painel. Por isso
 * aqui não entra nada de Supabase — só os dados que já vieram prontos.
 *
 * Duas regras moram neste arquivo, e em nenhum outro:
 *   * a cor do bloco alterna na ordem em que os blocos aparecem, contando
 *     todos os visíveis, inclusive capa e rodapé;
 *   * o número só avança nas seções de miolo — capa e rodapé não são
 *     numeradas, então a primeira seção depois da capa é a 01.
 */
export function BudgetSections({
  sections,
  clientName = "",
  menu = false,
}: {
  sections: BudgetSection[];
  clientName?: string;
  /** Menu fixo de navegação: só na página pública, nunca no preview do editor. */
  menu?: boolean;
}) {
  const visible = visibleSections(sections);
  const hasPricing = visible.some((section) => section.kind === "pricing");

  // Tom e número saem prontos antes do render: a numeração depende de quantas
  // seções numeráveis vieram antes, e contar durante o map seria mutar estado
  // no meio da renderização.
  const blocks = visible.map((section, index) => ({
    section,
    tone: blockTone(index),
    number: sectionNumber(visible.slice(0, index).filter(isNumbered).length),
  }));

  const menuItems = blocks
    .filter(({ section }) => isNumbered(section))
    .map(({ section }) => ({
      id: `s-${section.kind}`,
      label:
        ("eyebrow" in section.data && section.data.eyebrow) ||
        SECTION_LABELS[section.kind],
    }));

  return (
    <>
      {menu ? <BudgetMenu items={menuItems} /> : null}
      {blocks.map(({ section, tone, number }) => (
        // O id é o destino do menu; o wrapper não tem estilo, só ancora.
        <div key={section.kind} id={`s-${section.kind}`}>
          {renderBlock(section, tone, number, hasPricing, clientName)}
        </div>
      ))}
    </>
  );
}

function renderBlock(
  section: BudgetSection,
  tone: BlockTone,
  number: string,
  hasPricing: boolean,
  clientName: string
) {
        if (section.kind === "cover") {
          return (
            <CoverSection
                            data={section.data}
              tone={tone}
              hasPricing={hasPricing}
            />
          );
        }

        if (section.kind === "footer") {
          return (
            <FooterSection
                            data={section.data}
              tone={tone}
              clientName={clientName}
            />
          );
        }

        switch (section.kind) {
          case "about":
            return (
              <AboutSection
                                data={section.data}
                tone={tone}
                number={number}
              />
            );
          case "portfolio":
            return (
              <PortfolioSection
                                data={section.data}
                tone={tone}
                number={number}
              />
            );
          case "logos":
            return (
              <LogosSection
                                data={section.data}
                tone={tone}
                number={number}
              />
            );
          case "pricing":
            return (
              <PricingSection
                                data={section.data}
                tone={tone}
                number={number}
              />
            );
          case "faq":
            return (
              <FaqSection
                                data={section.data}
                tone={tone}
                number={number}
              />
            );
          default:
            // package1, package1Extra, package2Perks e strategy: todas a mesma
            // forma, um componente só.
            return (
              <ListSection
                                data={section.data}
                tone={tone}
                number={number}
              />
            );
        }
}
