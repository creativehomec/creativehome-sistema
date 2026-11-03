import Link from "next/link";
import { ChevronRight, HardDrive } from "lucide-react";
import {
  getPortalClient,
  getPortalSession,
  listPortalCards,
  listUpcoming,
} from "@/lib/clientPortal";
import { CreatorTag } from "@/components/CreatorTag";
import { listIdeasBetween } from "@/lib/editorialCalendar";
import { listClientPosts } from "@/lib/clientArea";
import { driveTitle, MONTH_NAMES, nextMonths, todayISO } from "@/lib/editorialMonths";
import { PushPrompt } from "./PushPrompt";
import { WeekStrip } from "./WeekStrip";
import { pCard, pCardSolid, pCount, pDateChip, pH2, pLead, pLink, pRow, pTitle } from "./portalUi";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const firstOfMonth = (m: { year: number; month: number }) => `${m.year}-${pad(m.month)}-01`;
const WEEK_LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_LABELS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** A semana de hoje, de domingo a sábado, pela data de Brasília (meio-dia evita virada de dia). */
function weekOf(today: string) {
  const day = new Date(`${today}T12:00:00`);
  const sunday = new Date(day);
  sunday.setDate(day.getDate() - day.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

const WEEKDAY_NAMES = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function dayParts(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    weekday: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
  };
}

export default async function ClientePage() {
  const { clientId, preview, viewerId, viewerName } = await getPortalSession();
  const today = todayISO();
  // Mês atual e os dois seguintes (pode virar o ano), pela data de Brasília.
  const span = nextMonths(new Date(`${today}T12:00:00`), 3);
  const client = await getPortalClient(clientId);
  const week = weekOf(today);
  const [cards, ideas, weekPosts] = await Promise.all([
    listPortalCards(clientId),
    listIdeasBetween(clientId, firstOfMonth(span[0]), firstOfMonth(span[2]), {
      includeInternal: false,
    }),
    listClientPosts(clientId, isoOf(week[0]), isoOf(week[6])),
  ]);
  const visibleWeek = weekPosts.filter((p) => p.visible);

  const review = cards.filter((c) => c.in_review);
  const waiting = review.filter((c) => !c.approved_at).length;
  const approved = review.length - waiting;
  const upcoming = listUpcoming(cards, today);
  const firstName = viewerName || (client.contact_name || client.name).split(" ")[0];

  // Diagramação: duas colunas iguais, e cada linha da grade tem dois blocos
  // com título na mesma altura, para os olhos correrem pelas linhas.
  //   linha 2: Esta semana          | Para aprovar
  //   linha 3: Próximas postagens   | Ideias para os próximos meses
  //   linha 4: Galeria              | Avisos
  // No celular é uma coluna, na ordem do DOM: aprovar, semana, próximas,
  // ideias, galeria, avisos. Toda seção segue o mesmo molde (título, cartão),
  // com 12 px entre o título e o cartão e 40 px entre as linhas.
  return (
    <div className="space-y-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-10 lg:gap-y-10 lg:space-y-0">
      <header className="lg:col-span-2">
        <h1 className={pTitle}>Olá, {firstName}</h1>
        <p className={pLead}>Acompanhe aqui o andamento do seu conteúdo com a {brand.name}.</p>
      </header>

      {/* O que pede ação vem em creme; o resto fica em vidro. */}
      <section aria-labelledby="aprovar" className="flex flex-col gap-3 lg:col-start-2 lg:row-start-2 lg:self-start">
        <h2 id="aprovar" className={pH2}>
          Para aprovar
        </h2>
        {/* Mesma altura mínima do cartão da semana: alinhados em repouso, mas
            independentes. Abrir um dia na semana não estica este cartão. */}
        <Link
          href="/cliente/materiais"
          className={`flex min-h-16 items-center justify-between gap-3 transition-transform active:scale-[0.99] lg:min-h-[6.75rem] ${
            waiting ? pCardSolid : pCard
          }`}
        >
          <span>
            <span className="block text-lg font-semibold">
              {waiting} {waiting === 1 ? "material para aprovação" : "materiais para aprovação"}
            </span>
            <span className={`block text-sm ${waiting ? "opacity-80" : "text-[var(--p-muted)]"}`}>
              {review.length
                ? `${approved} ${approved === 1 ? "aprovado" : "aprovados"} de ${review.length}`
                : "Os materiais liberados pela nossa equipe ficarão disponíveis aqui."}
            </span>
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold">
            Abrir <ChevronRight className="size-4" aria-hidden />
          </span>
        </Link>
      </section>

      {/* Semana de domingo a sábado. Toque num dia com atividade expande ali. */}
      <section aria-labelledby="semana" className="flex flex-col gap-3 lg:col-start-1 lg:row-start-2 lg:self-start">
        <h2 id="semana" className={pH2}>
          Esta semana
        </h2>
        <div className="lg:[&>*]:min-h-[6.75rem]">
          <WeekStrip
            days={week.map((d) => {
              const iso = isoOf(d);
              return {
                iso,
                letter: WEEK_LETTERS[d.getDay()],
                number: d.getDate(),
                label: `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTH_LABELS[d.getMonth()]}`,
                isToday: iso === today,
                items: visibleWeek
                  .filter((p) => p.post_date === iso)
                  .map((p) => ({ id: p.id, title: p.title, format: p.format, done: p.done })),
              };
            })}
          />
        </div>
      </section>

      {upcoming.length ? (
        <section aria-labelledby="proximas" className="space-y-3 lg:col-start-1 lg:row-start-3">
          <h2 id="proximas" className={pH2}>
            Próximas postagens
          </h2>
          <ul className={`${pCard} p-0`}>
            {upcoming.map((card) => {
              const { day, month, weekday } = dayParts(card.post_date!);
              return (
                <li key={card.id} className={`flex items-center gap-4 p-4 ${pRow}`}>
                  <div className={pDateChip}>
                    <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">{month}</span>
                    <span className="text-xl font-bold leading-none">{day}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{card.title || "Sem título"}</p>
                    <p className="text-sm text-[var(--p-muted)]">
                      <span className="capitalize">{weekday}</span> · <span className="capitalize">{card.format}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Um cartão só, com uma linha por mês: mesmo molde da lista ao lado. */}
      <section aria-labelledby="ideias" className="space-y-3 lg:col-start-2 lg:row-start-3">
        <h2 id="ideias" className={pH2}>
          Ideias para os próximos meses
        </h2>
        <ul className={`${pCard} p-0`}>
          {span.map(({ year, month }) => {
            const list = ideas.filter((i) => i.month === `${year}-${pad(month)}-01`);
            return (
              <li key={`${year}-${month}`} className={`p-4 ${pRow}`}>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  {MONTH_NAMES[month - 1]}
                  {list.length ? <span className={pCount}>{list.length}</span> : null}
                </h3>
                {list.length ? (
                  <ul className="mt-2 space-y-2">
                    {list.slice(0, 4).map((idea) => (
                      <li key={idea.id} className="border-l-2 border-[var(--brand-cream)] pl-3">
                        <span className="font-medium">{idea.title}</span>{" "}
                        <CreatorTag idea={idea} viewerId={viewerId} />
                        {idea.notes ? <span className="block text-sm text-[var(--p-muted)]">{idea.notes}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-[var(--p-muted)]">Nenhuma ideia registrada.</p>
                )}
              </li>
            );
          })}
        </ul>
        <Link href="/cliente/calendario" className={pLink}>
          Ver o calendário completo e sugerir uma ideia <ChevronRight className="size-4" aria-hidden />
        </Link>
      </section>

      {client.status === "published" ? (
        <Link
          href={`/galeria/${client.slug}?de=portal`}
          className={`flex min-h-14 items-center gap-3 lg:col-start-1 lg:row-start-4 ${pCard}`}
        >
          <HardDrive className="size-5 text-[var(--brand-cream)]" aria-hidden />
          <span className="flex-1 font-semibold">{driveTitle(client.name, client.gallery_article)}</span>
          <ChevronRight className="size-4 text-[var(--p-muted)]" aria-hidden />
        </Link>
      ) : null}

      {preview ? null : (
        <div className="lg:col-start-2 lg:row-start-4">
          <PushPrompt />
        </div>
      )}
    </div>
  );
}
