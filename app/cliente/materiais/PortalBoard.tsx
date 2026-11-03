import Link from "next/link";
import { BACKLOG_FORMAT_LABELS, type BacklogFormat } from "@/lib/backlogTypes";
import type { PortalCard } from "@/lib/clientPortal";
import { shortDate } from "./shortDate";

/**
 * O quadro de Entregas do admin, só leitura e só com as colunas liberadas ao
 * cliente. Colunas em vidro, cartões em creme; o que já está em aprovação abre o
 * material na lista, onde ficam os botões de aprovar.
 */
export function PortalBoard({
  columns,
  cards,
}: {
  columns: { id: string; name: string; color: string }[];
  cards: PortalCard[];
}) {
  return (
    // Sangra até a borda da tela: o portal tem largura de leitura, e um quadro
    // de colunas precisa da largura toda.
    <div className="relative left-1/2 w-screen -translate-x-1/2 px-[var(--gutter)]">
      <div className="mx-auto flex max-w-[100rem] snap-x snap-proximity items-start gap-3 overflow-x-auto pb-2">
        {columns.map((column) => {
          const list = cards.filter((c) => c.column_id === column.id);
          return (
            <section
              key={column.id}
              aria-label={column.name}
              className="w-[min(18rem,80vw)] shrink-0 snap-start rounded-[26px] border border-[var(--p-line)] bg-[var(--p-glass)] p-3 text-[var(--p-text)]"
            >
              <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold">
                <span className="size-2.5 rounded-full" style={{ background: column.color }} aria-hidden />
                {column.name}
                <span className="font-normal text-[var(--p-muted)]">{list.length}</span>
              </h2>
              {list.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--p-line)] px-3 py-6 text-center text-xs text-[var(--p-muted)]">
                  Nenhuma entrega
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {list.map((card) => (
                    <li key={card.id}>
                      <BoardCard card={card} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({ card }: { card: PortalCard }) {
  const approved = Boolean(card.approved_at);
  const body = (
    <div
      className={`overflow-hidden rounded-2xl bg-[var(--brand-cream)] text-[var(--brand-ink)] shadow-sm ${
        approved ? "ring-2 ring-[#8fd1ae]" : ""
      }`}
    >
      {card.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.cover_url} alt="" className="h-24 w-full object-cover" />
      ) : null}
      <div className="p-2.5">
        <p className={`text-sm font-semibold ${approved ? "text-[var(--brand-muted)] line-through" : ""}`}>
          {card.title || "Sem título"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-[var(--brand-ink)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--brand-ink)]">
            {BACKLOG_FORMAT_LABELS[card.format as BacklogFormat] ?? card.format}
          </span>
          {card.post_date ? (
            <span className="rounded-full bg-[var(--brand-taupe)] px-2 py-0.5 text-[11px] font-medium text-[var(--brand-ink)]">
              {shortDate(card.post_date)}
            </span>
          ) : null}
          {card.in_review ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                approved
                  ? "bg-[#cfeadb] text-[#1f5a3d]"
                  : card.changes_requested_at
                    ? "bg-[#fbdfc5] text-[#8a3a17]"
                    : "bg-[var(--brand-ink)] text-[var(--brand-cream)]"
              }`}
            >
              {approved ? "Aprovado" : card.changes_requested_at ? "Ajuste solicitado" : "Para aprovar"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!card.in_review) return body;
  return (
    <Link
      href={`/cliente/materiais?${approved ? "v=aprovados&" : ""}abrir=${card.id}`}
      className="block rounded-2xl transition-transform active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-[var(--brand-cream)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-ink)] focus-visible:outline-none"
    >
      {body}
    </Link>
  );
}
