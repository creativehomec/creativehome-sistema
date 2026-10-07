import { FadeUp } from "@/components/budget/motion/FadeUp";
import { ScrollWords } from "@/components/budget/motion/ScrollWords";
import type { BlockTone, SectionData } from "@/lib/budgetSections";
import { brandDisplayFontFamily, brandGeneratedBy } from "@/lib/brand";

/** Só os canais preenchidos viram link — um rodapé com campo vazio fica com
 *  buraco, e a proposta termina mal. */
function contacts(data: SectionData["footer"]) {
  const list: { label: string; href: string }[] = [];
  if (data.instagram) list.push({ label: "Instagram", href: data.instagram });
  if (data.youtube) list.push({ label: "YouTube", href: data.youtube });
  if (data.email) list.push({ label: data.email, href: `mailto:${data.email}` });
  if (data.phone) {
    list.push({
      label: data.phone,
      href: `https://wa.me/${data.phone.replace(/\D/g, "")}`,
    });
  }
  return list;
}

/**
 * O fecho da proposta: a frase que resume o estúdio e por onde falar com ele.
 * Não leva número — é o bloco que encerra a página.
 */
export function FooterSection({
  data,
  tone,
  clientName,
}: {
  data: SectionData["footer"];
  tone: BlockTone;
  clientName: string;
}) {
  const links = contacts(data);

  return (
    <footer className={`px-4 py-20 sm:px-8 sm:py-24 ${tone.bg} ${tone.text}`}>
      <div className="mx-auto w-full max-w-5xl">
        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-b pb-6 text-xs font-medium uppercase tracking-[0.2em] ${tone.divider} ${tone.textMuted}`}
        >
          <span>Fim da proposta</span>
          {clientName ? <span>{clientName}</span> : null}
        </div>

        {data.phrase ? (
          <ScrollWords
            style={{ fontFamily: brandDisplayFontFamily }}
            className="mt-12 max-w-4xl text-4xl leading-[1.05] tracking-wide sm:text-6xl"
          >
            {data.phrase}
          </ScrollWords>
        ) : null}

        {links.length > 0 ? (
          <FadeUp>
            <div className="mt-10 flex flex-wrap gap-3">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-current/40 px-6 py-3 text-sm font-bold uppercase tracking-widest"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </FadeUp>
        ) : null}

        <p className={`mt-14 text-xs ${tone.textMuted}`}>
          {brandGeneratedBy}
        </p>
      </div>
    </footer>
  );
}
