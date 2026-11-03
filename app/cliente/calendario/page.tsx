import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CreatorTag } from "@/components/CreatorTag";
import { listClientPosts } from "@/lib/clientArea";
import { getPortalSession } from "@/lib/clientPortal";
import { listIdeas } from "@/lib/editorialCalendar";
import { groupByMonth, MONTH_NAMES, nextMonths, todayISO } from "@/lib/editorialMonths";
import { IdeaForm } from "../IdeaForm";
import { MonthPlanner } from "./MonthPlanner";
import { YearAccordion } from "./YearAccordion";
import { pCard, pH2, pIconButton, pLead, pRow, pSeg, pSegWrap, pTitle } from "../portalUi";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");

function Arrow({ href, label, dir }: { href: string; label: string; dir: "l" | "r" }) {
  const Icon = dir === "l" ? ChevronLeft : ChevronRight;
  return (
    <Link href={href} aria-label={label} className={pIconButton}>
      <Icon className="size-5" aria-hidden />
    </Link>
  );
}

/** Setas + título do período (mês ou ano). Fica entre Ano/Mês e Sugerir ideia. */
function PeriodNav({
  prevHref,
  prevLabel,
  nextHref,
  nextLabel,
  title,
}: {
  prevHref: string;
  prevLabel: string;
  nextHref: string;
  nextLabel: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Arrow href={prevHref} label={prevLabel} dir="l" />
      <h2 className={`${pH2} min-w-[9.5rem] text-center tabular-nums`}>{title}</h2>
      <Arrow href={nextHref} label={nextLabel} dir="r" />
    </div>
  );
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; ano?: string; mes?: string }>;
}) {
  const { clientId, preview, viewerId } = await getPortalSession();
  const params = await searchParams;
  const today = todayISO();
  // Meio-dia da data de Brasília: getMonth()/getFullYear() acertam em qualquer fuso.
  const now = new Date(`${today}T12:00:00`);
  const year = Number(params.ano) || now.getFullYear();
  const monthly = params.vista !== "ano";
  const month = Math.min(12, Math.max(1, Number(params.mes) || now.getMonth() + 1));

  const tabs = (
    <div role="group" aria-label="Modo de visualização" className={pSegWrap}>
      {[
        { label: "Ano", href: `/cliente/calendario?vista=ano&ano=${year}`, on: !monthly },
        { label: "Mês", href: `/cliente/calendario?vista=mes&ano=${year}&mes=${month}`, on: monthly },
      ].map((t) => (
        <Link key={t.label} href={t.href} aria-current={t.on ? "true" : undefined} className={pSeg(t.on)}>
          {t.label}
        </Link>
      ))}
    </div>
  );

  // Linha de controles: [Ano|Mês] [‹ período ›] [Sugerir ideia]. No celular o
  // período desce para uma linha própria, de ponta a ponta.
  const header = (period: React.ReactNode) => (
    <header className="space-y-4">
      <div>
        <h1 className={pTitle}>Calendário editorial</h1>
        <p className={pLead}>Planejamento de conteúdo, programação de postagens e ideias de cada mês.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {tabs}
        <div className="order-last flex w-full justify-center sm:order-none sm:w-auto">{period}</div>
        <IdeaForm months={nextMonths(now, 12)} readOnly={preview} />
      </div>
    </header>
  );

  if (monthly) {
    const last = new Date(year, month, 0).getDate();
    const [ideas, posts] = await Promise.all([
      listIdeas(clientId, year, { includeInternal: false }),
      listClientPosts(clientId, `${year}-${pad(month)}-01`, `${year}-${pad(month)}-${pad(last)}`),
    ]);
    const monthIdeas = groupByMonth(ideas)[month - 1];
    const visible = posts.filter((p) => p.visible);
    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    const link = (d: { y: number; m: number }) => `/cliente/calendario?vista=mes&ano=${d.y}&mes=${d.m}`;

    return (
      <div className="space-y-6">
        {header(
          <PeriodNav
            prevHref={link(prev)}
            prevLabel="Mês anterior"
            nextHref={link(next)}
            nextLabel="Próximo mês"
            title={`${MONTH_NAMES[month - 1]} ${year}`}
          />,
        )}

        <MonthPlanner
          key={`${year}-${month}`}
          year={year}
          month={month}
          today={today}
          posts={visible}
          ideas={
            <section aria-labelledby="ideias-mes" className="space-y-3">
              <h3 id="ideias-mes" className={pH2}>
                Ideias de {MONTH_NAMES[month - 1].toLowerCase()}{" "}
                <span className="text-base font-normal text-[var(--p-muted)]">({monthIdeas.length})</span>
              </h3>
              <div className={`${pCard} p-0`}>
                {monthIdeas.length ? (
                  <ul>
                    {monthIdeas.map((idea) => (
                      <li key={idea.id} className={`${pRow} px-4 py-3`}>
                        <p className="font-semibold">
                          {idea.title} <CreatorTag idea={idea} viewerId={viewerId} />
                        </p>
                        {idea.notes ? (
                          <p className="whitespace-pre-line text-sm text-[var(--p-muted)]">{idea.notes}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-[var(--p-muted)]">Nenhuma ideia registrada para este mês.</p>
                )}
              </div>
            </section>
          }
        />
      </div>
    );
  }

  const [yearIdeas, yearPosts] = await Promise.all([
    listIdeas(clientId, year, { includeInternal: false }),
    listClientPosts(clientId, `${year}-01-01`, `${year}-12-31`),
  ]);
  const months = groupByMonth(yearIdeas);
  const postsByMonth = Array.from({ length: 12 }, () => [] as typeof yearPosts);
  for (const post of yearPosts) {
    if (post.visible) postsByMonth[Number(post.post_date.slice(5, 7)) - 1].push(post);
  }
  const currentMonth = year === now.getFullYear() ? now.getMonth() : -1;

  return (
    <div className="space-y-6">
      {header(
        <PeriodNav
          prevHref={`/cliente/calendario?vista=ano&ano=${year - 1}`}
          prevLabel={`Ver ${year - 1}`}
          nextHref={`/cliente/calendario?vista=ano&ano=${year + 1}`}
          nextLabel={`Ver ${year + 1}`}
          title={String(year)}
        />,
      )}

      <YearAccordion
        year={year}
        currentMonth={currentMonth}
        viewerId={viewerId}
        months={months.map((ideas, index) => ({
          ideas,
          posts: postsByMonth[index].map((p) => ({
            id: p.id,
            title: p.title,
            format: p.format,
            post_date: p.post_date,
          })),
        }))}
      />
    </div>
  );
}
