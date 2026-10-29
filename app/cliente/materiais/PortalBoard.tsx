import Link from "next/link";
import { BACKLOG_FORMAT_LABELS, type BacklogFormat } from "@/lib/backlogTypes";
import type { PortalCard } from "@/lib/clientPortal";
import { shortDate } from "./StatusChip";

/**
 * O quadro de Entregas do admin, só leitura e só com as colunas liberadas ao
 * cliente. Mesmo visual dos cards da equipe; o que já está em aprovação abre o
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
    // Sangra até a borda da tela: o portal tem 36rem, e um quadro de colunas
    // precisa da largura toda.
    <div className="relative left-1/2 w-screen -translate-x-1/2 px-[var(--gutter)]">
      <div className="mx-auto flex max-w-[100rem] snap-x snap-proximity items-start gap-3 overflow-x-auto pb-2">
        {columns.map((column) => {
          const list = cards.filter((c) => c.column_id === column.id);
          return (
            <section
              key={column.id}
              aria-label={column.name}
              className="w-[min(18rem,80vw)] shrink-0 snap-start rounded-lg bg-white/70 p-3 text-neutral-900"
            >
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="size-2.5 rounded-full" style={{ background: column.color }} aria-hidden />
                {column.name}
                <span className="font-normal text-neutral-500">{list.length}</span>
              </h2>
              {list.length === 0 ? (
                <p className="rounded-md border border-dashed border-neutral-300 px-3 py-6 text-center text-xs text-neutral-400">
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
      className={`rounded-md border bg-white shadow-sm ${
        approved ? "border-emerald-300" : "border-neutral-200"
      }`}
    >
      {card.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.cover_url} alt="" className="h-24 w-full rounded-t-md object-cover" />
      ) : null}
      <div className="p-2.5">
        <p className={`text-sm font-medium ${approved ? "text-neutral-500 line-through" : ""}`}>
          {card.title || "Sem título"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">
            {BACKLOG_FORMAT_LABELS[card.format as BacklogFormat] ?? card.format}
          </span>
          {card.post_date ? (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
              {shortDate(card.post_date)}
            </span>
          ) : null}
          {card.in_review ? (
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] ${
                approved
                  ? "bg-emerald-50 text-emerald-700"
                  : card.changes_requested_at
                    ? "bg-amber-50 text-amber-700"
                    : "bg-sky-50 text-sky-700"
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
      className="block rounded-md transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {body}
    </Link>
  );
}
