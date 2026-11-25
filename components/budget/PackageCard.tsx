"use client";

import { useId, useState } from "react";
import { RevealItem } from "@/components/Reveal";
import type { PricingPackage } from "@/lib/budgetSections";

function money(value: number) {
  return (
    "R$ " +
    (Number(value) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })
  );
}

/**
 * Um pacote (ou avulso). Os entregáveis ficam sempre visíveis, em linhas.
 * Clicar na linha (ou no "+") abre a descrição daquele item; só um fica
 * aberto por vez. Linha sem descrição não é clicável.
 */
export function PackageCard({
  pkg,
  index,
  variant,
  ctaLabel,
  ctaHref,
}: {
  pkg: PricingPackage;
  index: number;
  variant: "pricing" | "avulsos";
  ctaLabel: string;
  ctaHref: string;
}) {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const baseId = useId();
  const highlighted = variant === "pricing" && pkg.featured;
  const priceText = pkg.price > 0 ? money(pkg.price) : "A definir";

  return (
    <RevealItem
      // No PDF os cards dividem as linhas da grade (subgrid): nome, preço e lista alinham
      // de um pacote ao outro, mesmo com nomes e descrições de tamanhos diferentes.
      className={`relative flex flex-col p-7 pdf:grid pdf:row-span-7 pdf:grid-rows-subgrid pdf:p-5 pdf:pt-6 ${
        highlighted
          ? "rounded-3xl bg-[var(--brand-ink)] text-[var(--brand-cream)]"
          : variant === "avulsos"
            ? "rounded-3xl bg-[var(--brand-cream)] text-[var(--brand-ink)]"
            : "rounded-3xl border border-transparent border-t-current/20 text-[var(--brand-ink)] transition-colors duration-200 hover:border-current/20 hover:bg-current/[0.03]"
      }`}
    >
      <div className="mb-5 h-5 text-xs font-medium text-current/60 pdf:row-start-1 pdf:mb-0 pdf:h-0">
        {highlighted ? (
          <span className="pdf:absolute pdf:right-5 pdf:top-4">Recomendado</span>
        ) : null}
      </div>

      <p className="text-2xl font-medium pdf:row-start-2 pdf:text-[19px] pdf:leading-tight pdf:tracking-wide">{pkg.name}</p>
      {pkg.subtitle ? (
        <p className="mt-1 text-sm text-current/60 pdf:row-start-3">{pkg.subtitle}</p>
      ) : null}

      <p
                className="mt-6 pdf:mt-3 pdf:row-start-4 text-4xl leading-none tracking-tight"
      >
        {priceText}
        {pkg.price > 0 && pkg.unit ? (
          <span className="ml-2 align-middle font-sans text-sm tracking-normal text-current/60">
            {pkg.unit}
          </span>
        ) : null}
      </p>
      {pkg.description ? (
        <p className="mt-2 text-sm text-current/60 pdf:row-start-5">{pkg.description}</p>
      ) : null}

      {pkg.items.length > 0 ? (
        <ul className="mb-7 mt-6 flex-1 pdf:row-start-6 pdf:mb-0 pdf:mt-4">
          {pkg.items.map((item, i) => {
            const itemOpen = openItem === i;
            const itemPanelId = `${baseId}-item-${i}`;
            const expandable = item.description !== "";
            const rowClass = "flex w-full items-start gap-3 py-3 pdf:py-1.5 text-left";
            const content = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug">
                    {item.title}
                  </span>
                  {item.detail ? (
                    <span className="mt-0.5 block text-xs text-current/65">
                      {item.detail}
                    </span>
                  ) : null}
                </span>
                {expandable ? (
                  <span
                    aria-hidden
                    className="flex h-7 w-7 pdf:hidden shrink-0 items-center justify-center rounded-full border border-current/30 text-sm leading-none"
                  >
                    {itemOpen ? "−" : "+"}
                  </span>
                ) : null}
              </>
            );

            return (
              <li key={`${item.title}-${i}`} className="border-t border-current/15">
                {expandable ? (
                  <button
                    type="button"
                    aria-expanded={itemOpen}
                    aria-controls={itemPanelId}
                    onClick={() => setOpenItem(itemOpen ? null : i)}
                    className={`${rowClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-olive)]`}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
                {expandable ? (
                  <div
                    id={itemPanelId}
                    inert={!itemOpen}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                      itemOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-4 text-sm leading-relaxed text-current/75">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex-1 pdf:row-start-6" />
      )}

      <a
        href={ctaHref}
        target="_blank"
        rel="noreferrer"
        // Botão de link não serve num PDF apresentado; sai do slide.
        className={`block rounded-lg pdf:hidden py-3 text-center text-sm font-medium transition-colors ${
          highlighted
            ? "bg-[var(--brand-cream)] text-[var(--brand-ink)] hover:bg-[var(--brand-cream)]/90"
            : "border border-current/30 hover:bg-current/5"
        }`}
      >
        {ctaLabel || `Escolher ${pkg.name}`}
      </a>
    </RevealItem>
  );
}
