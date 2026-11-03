"use client";

import { useId, useState } from "react";
import { BACKLOG_FORMAT_LABELS, type BacklogFormat } from "@/lib/backlogTypes";
import { pCard, pRow } from "./portalUi";

export interface WeekItem {
  id: string;
  title: string;
  format: string;
  done: boolean;
}

export interface WeekDay {
  iso: string;
  letter: string;
  number: number;
  /** Nome do dia por extenso, pra leitor de tela. */
  label: string;
  isToday: boolean;
  items: WeekItem[];
}

const isBacklogFormat = (f: string): f is BacklogFormat => f in BACKLOG_FORMAT_LABELS;

/**
 * Semana de domingo a sábado. Toque num dia com atividade e ele expande ali
 * mesmo, mostrando o que sai; sem atividade o toque não faz nada. Não leva ao
 * calendário: quem quer o mês inteiro usa a aba Calendário.
 */
export function WeekStrip({ days }: { days: WeekDay[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const panelId = useId();
  const selected = days.find((d) => d.iso === open) ?? null;

  function toggle(day: WeekDay) {
    if (!day.items.length) return;
    setOpen((current) => (current === day.iso ? null : day.iso));
  }

  return (
    <div className={`${pCard} p-2`}>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const active = day.items.length > 0;
          const expanded = open === day.iso;
          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => toggle(day)}
              disabled={!active}
              aria-expanded={active ? expanded : undefined}
              aria-controls={active ? panelId : undefined}
              aria-label={`${day.label}${
                active ? `, ${day.items.length} ${day.items.length === 1 ? "postagem" : "postagens"}` : ", sem postagens"
              }`}
              className={`flex flex-col items-center gap-1.5 rounded-2xl py-2.5 transition-[background-color,transform] duration-150 active:scale-95 disabled:active:scale-100 ${
                day.isToday ? "bg-[var(--brand-cream)] text-[var(--brand-ink)]" : "text-[var(--p-text)]"
              } ${expanded ? "ring-2 ring-[var(--brand-cream)] ring-offset-2 ring-offset-transparent" : ""} ${
                active ? "" : "opacity-60"
              }`}
            >
              <span className="text-[11px] font-medium uppercase opacity-80">{day.letter}</span>
              <span className="text-lg font-bold leading-none tabular-nums">{day.number}</span>
              <span className="flex h-1.5 gap-0.5" aria-hidden>
                {day.items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className={`size-1.5 rounded-full ${day.isToday ? "bg-[var(--brand-ink)]" : "bg-[var(--brand-cream)]"}`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expansão: a altura anima por grid-template-rows, sem medir nada. */}
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          selected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {selected ? (
            <ul className="mt-2 space-y-0" aria-label={`Atividades de ${selected.label}`}>
              {selected.items.map((item) => (
                <li key={item.id} className={`${pRow} flex items-center gap-3 py-2.5`}>
                  <span
                    aria-hidden
                    className={`size-2.5 shrink-0 rounded-full ${item.done ? "bg-[var(--brand-cream)]" : "border-2 border-[var(--brand-cream)]"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-semibold ${item.done ? "text-[var(--p-muted)] line-through" : ""}`}>
                      {item.title || "Sem título"}
                    </span>
                    <span className="block text-xs text-[var(--p-muted)]">
                      {isBacklogFormat(item.format) ? BACKLOG_FORMAT_LABELS[item.format] : item.format}
                      {item.done ? " · feito" : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
