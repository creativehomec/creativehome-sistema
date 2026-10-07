/* eslint-disable @next/next/no-img-element */
import { IndexWipe } from "@/components/budget/motion/IndexWipe";
import { Marquee } from "@/components/budget/motion/Marquee";
import { SectionBlock, SectionHeading } from "@/components/budget/SectionShell";
import {
  PLACEHOLDER_LOGOS,
  type BlockTone,
  type SectionData,
} from "@/lib/budgetSections";

/**
 * A faixa de logos de quem já foi cliente.
 *
 * Os logos chegam em arte e cor de origem, cada um com um peso — por isso
 * entram dessaturados e num tom só, ganhando cor no hover. É o que faz uma
 * fileira de marcas diferentes parecer uma coisa só.
 *
 * <img> cru em vez de next/image de propósito: a URL pode ser de qualquer
 * domínio que alguém cole no editor, e a otimização do Next exige domínio
 * declarado na config.
 */
function isSvg(url: string) {
  return /\.svg($|\?)/i.test(url);
}

export function LogosSection({
  data,
  tone,
  number,
}: {
  data: SectionData["logos"];
  tone: BlockTone;
  number: string;
}) {
  // Em desenvolvimento, completa com empresas de exemplo até 4 para dar para
  // testar o efeito. Em produção só vale o que foi escolhido no editor.
  const logos =
    process.env.NODE_ENV === "production"
      ? data.logos
      : [...data.logos, ...PLACEHOLDER_LOGOS].slice(0, Math.max(4, data.logos.length));

  return (
    <SectionBlock tone={tone}>
      <SectionHeading
        number={number}
        eyebrow={data.eyebrow}
        title={data.title}
        tone={tone}
        className="mb-16"
      />
      {/* Sai do max-w do bloco para a faixa ir de borda a borda. */}
      <div className="-mx-4 sm:-mx-8 xl:-mx-[calc((100vw-64rem)/2)]">
        <Marquee className="items-center gap-6 pr-6">
          {logos.map((logo, index) => (
            <div
              key={`${logo.url}-${index}`}
              className={`flex h-24 w-52 shrink-0 items-center justify-center rounded-3xl border px-6 sm:h-28 sm:w-60 ${tone.divider}`}
            >
              {isSvg(logo.url) ? (
                <span
                  role="img"
                  aria-label={logo.name || "Cliente"}
                  style={{
                    maskImage: `url("${logo.url}")`,
                    WebkitMaskImage: `url("${logo.url}")`,
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskPosition: "center",
                    maskSize: "contain",
                    WebkitMaskSize: "contain",
                  }}
                  className={`block h-10 w-full bg-current opacity-70 sm:h-12 ${tone.iconColor}`}
                />
              ) : (
                <img
                  src={logo.url}
                  alt={logo.name || "Cliente"}
                  className="h-10 w-full object-contain opacity-70 grayscale sm:h-12"
                />
              )}
            </div>
          ))}
        </Marquee>
      </div>
      <IndexWipe items={logos} />
    </SectionBlock>
  );
}
