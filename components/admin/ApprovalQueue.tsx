"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ExternalLink, X } from "lucide-react";
import {
  requestBacklogCardChangesAction,
  setBacklogCardApprovedAction,
} from "@/app/admin/kanbanActions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BACKLOG_FORMAT_LABELS,
  formatBacklogDateShort,
} from "@/lib/backlogTypes";
import type { ApprovalItem, ApprovalStatus } from "@/lib/approvalQueue";

const GROUPS: { status: ApprovalStatus; label: string; dot: string }[] = [
  { status: "changes", label: "Ajuste pedido", dot: "bg-amber-500" },
  { status: "waiting", label: "Aguardando o cliente", dot: "bg-sky-500" },
  { status: "approved", label: "Aprovado", dot: "bg-emerald-500" },
];

/**
 * O que está na coluna Aprovação, contado pela resposta do cliente. No Painel
 * fica só a contagem; clicar num número abre a lista daquele grupo.
 */
export function ApprovalQueue({ items }: { items: ApprovalItem[] }) {
  const [open, setOpen] = useState<{
    status: ApprovalStatus;
    ids: string[];
  } | null>(null);
  // A decisão tomada aqui vale na hora, sem esperar o servidor recontar.
  const [decided, setDecided] = useState<
    Record<string, { status: ApprovalStatus; feedback: string }>
  >({});
  // Card com a caixa de "qual ajuste?" aberta, e o texto dela.
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();
  const group = GROUPS.find((g) => g.status === open?.status);
  // A lista é a do momento em que o modal abriu: o card decidido continua à
  // vista, marcado, em vez de sumir debaixo do dedo.
  const list = items.filter((i) => open?.ids.includes(i.id));

  function approve(item: ApprovalItem, current: ApprovalStatus) {
    const next = current !== "approved";
    setDecided((d) => ({
      ...d,
      [item.id]: { status: next ? "approved" : "waiting", feedback: "" },
    }));
    setRejecting(null);
    startTransition(() => setBacklogCardApprovedAction(item.id, next));
  }

  function sendChanges(item: ApprovalItem) {
    const feedback = draft.trim();
    if (!feedback) return;
    setDecided((d) => ({ ...d, [item.id]: { status: "changes", feedback } }));
    setRejecting(null);
    setDraft("");
    startTransition(() => requestBacklogCardChangesAction(item.id, feedback));
  }

  return (
    <section
      aria-labelledby="aprovacao-titulo"
      className="rounded-lg border border-neutral-200 bg-white p-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2
          id="aprovacao-titulo"
          className="text-sm font-semibold text-neutral-900"
        >
          Aprovação
          {items.length > 0 ? (
            <span className="font-normal text-neutral-500">{` · ${items.length}`}</span>
          ) : null}
        </h2>
        <Link
          href="/admin/backlog"
          className="-mr-2 flex shrink-0 items-center rounded px-2 py-1 text-xs text-neutral-500 hover:text-neutral-900 pointer-coarse:min-h-11 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Entregas
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {GROUPS.map((g) => {
          const count = items.filter((i) => i.status === g.status).length;
          return (
            <button
              key={g.status}
              type="button"
              disabled={count === 0}
              onClick={() =>
                setOpen({
                  status: g.status,
                  ids: items
                    .filter((i) => i.status === g.status)
                    .map((i) => i.id),
                })
              }
              className="rounded-md bg-neutral-50 px-2 py-2 transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-default disabled:hover:bg-neutral-50"
            >
              <span className="block text-lg font-semibold tabular-nums text-neutral-900">
                {count}
              </span>
              <span className="flex items-center justify-center gap-1 text-[11px] text-neutral-500">
                <span
                  className={`size-1.5 rounded-full ${g.dot}`}
                  aria-hidden
                />
                {g.label}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog
        open={open !== null}
        onOpenChange={(next) => !next && setOpen(null)}
      >
        <DialogContent className="grid max-h-[calc(100dvh-6rem)] grid-rows-[auto_minmax(0,1fr)] gap-3 p-5 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span
                className={`size-2 rounded-full ${group?.dot ?? ""}`}
                aria-hidden
              />
              {group?.label}
              <span className="font-normal text-neutral-500">
                · {list.length}
              </span>
            </DialogTitle>
            <DialogDescription>Entregas na coluna Aprovação.</DialogDescription>
          </DialogHeader>

          <ul className="-mx-1 space-y-2 overflow-y-auto px-1">
            {list.map((item) => {
              const status = decided[item.id]?.status ?? item.status;
              const feedback = decided[item.id]?.feedback ?? item.feedback;
              const writing = rejecting === item.id;
              return (
                <li
                  key={item.id}
                  className={`rounded-lg border p-3 ${
                    status === "approved"
                      ? "border-emerald-300"
                      : status === "changes"
                        ? "border-amber-300"
                        : "border-neutral-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words text-neutral-900">
                        {item.title || "Sem título"}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {[
                          item.client_name,
                          BACKLOG_FORMAT_LABELS[item.format],
                          item.post_date
                            ? `posta ${formatBacklogDateShort(item.post_date)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {status === "changes" && feedback ? (
                        <p className="mt-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                          <span className="font-semibold">Ajuste pedido:</span>{" "}
                          {feedback}
                        </p>
                      ) : null}
                      {item.drive_url ? (
                        <a
                          href={item.drive_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                          Assistir no Drive
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-400">
                          Sem link do Drive no card.
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => approve(item, status)}
                        aria-pressed={status === "approved"}
                        aria-label={
                          status === "approved"
                            ? `Desmarcar aprovação de "${item.title}"`
                            : `Aprovar "${item.title}"`
                        }
                        title={
                          status === "approved"
                            ? "Desmarcar aprovação"
                            : "Aprovar"
                        }
                        className={`grid size-10 place-items-center rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none ${
                          status === "approved"
                            ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
                            : "border-neutral-300 text-neutral-300 hover:border-emerald-500 hover:text-emerald-600"
                        }`}
                      >
                        <Check className="size-5" strokeWidth={3} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejecting(writing ? null : item.id);
                          setDraft(status === "changes" ? feedback : "");
                        }}
                        aria-expanded={writing}
                        aria-pressed={status === "changes"}
                        aria-label={`Pedir ajuste em "${item.title}"`}
                        title="Pedir ajuste"
                        className={`grid size-10 place-items-center rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none ${
                          status === "changes"
                            ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                            : "border-neutral-300 text-neutral-300 hover:border-amber-500 hover:text-amber-600"
                        }`}
                      >
                        <X className="size-5" strokeWidth={3} aria-hidden />
                      </button>
                    </div>
                  </div>

                  {writing ? (
                    <form
                      className="mt-3 space-y-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        sendChanges(item);
                      }}
                    >
                      <label
                        htmlFor={`ajuste-${item.id}`}
                        className="block text-sm font-medium text-neutral-900"
                      >
                        Qual ajuste precisa ser feito?
                      </label>
                      <textarea
                        id={`ajuste-${item.id}`}
                        autoFocus
                        rows={3}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Ex.: trocar a música e cortar os 3 primeiros segundos"
                        className="w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRejecting(null)}
                          className="min-h-9 rounded-md px-3 text-sm text-neutral-600 hover:bg-neutral-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={!draft.trim()}
                          className="min-h-9 rounded-md bg-amber-500 px-3 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                        >
                          Enviar ajuste
                        </button>
                      </div>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
