"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { CreatorTag } from "@/components/CreatorTag";
import { MONTH_NAMES, type EditorialIdea } from "@/lib/editorialMonths";
import { pCard, pCount, pLink, pRow } from "../portalUi";

export interface YearPost {
  id: string;
  title: string;
  format: string;
  post_date: string;
}

export interface YearMonth {
  ideas: EditorialIdea[];
  posts: YearPost[];
}

/**
 * Mola crítica (sem overshoot): é o padrão para o que aparece sem um gesto de
 * arremesso. A altura nunca é um valor fixo, então tocar de novo no meio do
 * movimento reverte a partir de onde ele está, sem esperar terminar.
 */
const SPRING = { type: "spring", bounce: 0, duration: 0.45 } as const;

/**
 * Ano em uma lista de linhas, uma por mês. Cada linha expande no toque.
 * - Reage ao toque na hora (a linha afunda um pouco, em CSS), antes de soltar.
 * - Abre e fecha com altura animada por mola, interruptível.
 * - O chevron gira junto, pela mesma mola.
 * - Com "reduzir movimento", troca a mola por um fade curto, sem girar nem deslizar.
 */
export function YearAccordion({
  year,
  months,
  currentMonth,
  viewerId,
}: {
  year: number;
  months: YearMonth[];
  currentMonth: number;
  viewerId: string | null;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const baseId = useId();

  function toggle(index: number) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <ul className="space-y-2">
      {months.map(({ ideas, posts }, index) => {
        const isOpen = open.has(index);
        const empty = !ideas.length && !posts.length;
        const panelId = `${baseId}-${index}`;
        const summary = [
          posts.length ? `${posts.length} ${posts.length === 1 ? "postagem" : "postagens"}` : null,
          ideas.length ? `${ideas.length} ${ideas.length === 1 ? "ideia" : "ideias"}` : null,
        ]
          .filter(Boolean)
          .join(", ");

        return (
          <li key={index} className={`${pCard} overflow-hidden p-0`}>
            {/* Feedback do toque em CSS, não em whileTap: responde no pointer-down
                sem esperar o JS e não muda atributos do botão na hidratação. */}
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={`${MONTH_NAMES[index]}, ${summary || "vazio"}`}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left outline-offset-[-3px] transition-transform duration-150 ease-out active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={`truncate text-lg ${empty ? "font-medium text-[var(--p-muted)]" : "font-semibold"}`}>
                  {MONTH_NAMES[index]}
                </span>
                {index === currentMonth ? <span className={`shrink-0 ${pCount}`}>atual</span> : null}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-sm text-[var(--p-muted)]">
                {posts.length ? (
                  <span className={pCount} aria-hidden>
                    {posts.length}
                    <span className="hidden sm:inline">{posts.length === 1 ? " postagem" : " postagens"}</span>
                  </span>
                ) : null}
                {ideas.length ? (
                  <span
                    className="rounded-full border border-[var(--p-line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--p-text)]"
                    aria-hidden
                  >
                    {ideas.length}
                    <span className="hidden sm:inline">{ideas.length === 1 ? " ideia" : " ideias"}</span>
                  </span>
                ) : null}
                {empty ? <span aria-hidden>vazio</span> : null}
                <motion.span
                  aria-hidden
                  className="grid place-items-center"
                  animate={{ rotate: isOpen && !reduce ? 90 : 0 }}
                  transition={reduce ? { duration: 0 } : SPRING}
                >
                  <ChevronRight className="size-4" />
                </motion.span>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-label={`${MONTH_NAMES[index]} ${year}`}
                  initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0.15 } : SPRING}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 px-4 pb-4 pt-1">
                    {posts.length ? (
                      <section aria-label={`Postagens de ${MONTH_NAMES[index]}`}>
                        <h3 className="mb-1 text-sm font-semibold text-[var(--p-muted)]">Postagens</h3>
                        <ul>
                          {posts.map((p) => (
                            <li key={p.id} className={`${pRow} flex items-center gap-3 py-2`}>
                              <span className="grid w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-cream)] py-1 text-[var(--brand-ink)]">
                                <span className="text-base font-bold leading-none">{Number(p.post_date.slice(8, 10))}</span>
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">{p.title || "Sem título"}</span>
                                <span className="block text-sm capitalize text-[var(--p-muted)]">{p.format}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}

                    <section aria-label={`Ideias de ${MONTH_NAMES[index]}`}>
                      <h3 className="mb-1 text-sm font-semibold text-[var(--p-muted)]">Ideias</h3>
                      {ideas.length ? (
                        <ul className="space-y-2">
                          {ideas.map((idea) => (
                            <li key={idea.id} className="border-l-2 border-[var(--brand-cream)] pl-3">
                              <span className="font-medium">{idea.title}</span>{" "}
                              <CreatorTag idea={idea} viewerId={viewerId} />
                              {idea.notes ? (
                                <span className="block whitespace-pre-line text-sm text-[var(--p-muted)]">{idea.notes}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-[var(--p-muted)]">Nenhuma ideia registrada para este mês.</p>
                      )}
                    </section>

                    <Link href={`/cliente/calendario?vista=mes&ano=${year}&mes=${index + 1}`} className={pLink}>
                      Ver programação do mês <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
