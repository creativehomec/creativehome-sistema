"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BACKLOG_FORMAT_LABELS, BACKLOG_FORMATS, type BacklogFormat } from "@/lib/backlogTypes";
import { monthWeeks } from "@/lib/editorialMonths";
import { setPostDoneAction } from "../actions";
import { pCard, pCardSolid, pRow, pSeg, pSegWrap } from "../portalUi";

export interface PlannerPost {
  id: string;
  title: string;
  format: string;
  post_date: string;
  caption: string;
  client_plan: string;
  done: boolean;
  locked: boolean;
  guide_slug: string | null;
}

// Uma cor por formato, em tons claros: sobre o vidro escuro do portal, todas
// com contraste de objeto (3:1) ou mais.
const FORMAT_COLORS: Record<BacklogFormat, string> = {
  reel: "#8fd1ae",
  carrossel: "#f2b56b",
  card: "#d9a3cf",
  story: "#9fb8ef",
  foto: "#eba88a",
};
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WEEKDAY_NAMES = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

const pad = (n: number) => String(n).padStart(2, "0");
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const weekday = (iso: string) => new Date(`${iso}T12:00:00`).getDay();
const formatOf = (p: PlannerPost): BacklogFormat =>
  (BACKLOG_FORMATS as readonly string[]).includes(p.format) ? (p.format as BacklogFormat) : "reel";
const label = (p: PlannerPost) => p.title || "Sem título";

/** "Gancho: texto" vira [rótulo, texto]; linha sem rótulo vira [null, texto]. */
function planRows(plan: string): [string | null, string][] {
  return plan
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
      return m ? [m[1], m[2]] : [null, line];
    });
}

/**
 * Dia como anel. Com publicação, borda creme cheia; hoje é pílula creme; dia
 * passado sem nada apaga. Os cantos e a grade ficam no vidro do portal.
 */
function dayRing({ today, past }: { today?: boolean; past?: boolean }, hasItems: boolean, filled: boolean) {
  // Hoje fica sempre branco, mesmo com tudo feito.
  if (today) return "border-[var(--brand-cream)] bg-[var(--brand-cream)] text-[var(--brand-ink)]";
  // Tudo feito: o fundo e a borda vêm do estilo inline, na cor do formato.
  if (filled) return "text-[var(--brand-ink)]";
  if (hasItems) return "border-[var(--brand-cream)] bg-transparent text-[var(--p-text)]";
  if (past) return "border-[var(--p-line)] bg-transparent text-[var(--p-muted)] opacity-70";
  return "border-[var(--p-line)] bg-transparent text-[var(--p-text)]";
}

/**
 * Preenchimento do dia quando todas as postagens dele foram feitas: a cor do
 * formato (carrossel laranja, reel verde, foto salmão…). Com formatos
 * diferentes no mesmo dia, o círculo se divide em fatias iguais, uma por cor.
 * Dia com algo ainda por fazer segue só com o traçado.
 */
function dayFill(items: PlannerPost[]) {
  if (!items.length || !items.every((p) => p.done)) return null;
  const colors = [...new Set(items.map((p) => FORMAT_COLORS[formatOf(p)]))];
  if (colors.length === 1) return { background: colors[0], borderColor: colors[0] };
  const step = 100 / colors.length;
  const slices = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ");
  return { background: `conic-gradient(${slices})`, borderColor: "transparent" };
}

function Mark({ post, size = "size-3", ink = false }: { post: PlannerPost; size?: string; ink?: boolean }) {
  // Sobre o dia preenchido a marca na cor do formato some: vira tinta.
  const color = ink ? "var(--brand-ink)" : FORMAT_COLORS[formatOf(post)];
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-[3px] border-2 ${size}`}
      style={{ borderColor: color, background: post.done ? color : "transparent" }}
    />
  );
}

/** Caixa de "feito" na cor do formato; travada quando o quadro já fechou o item. */
function DoneBox({
  post,
  onToggle,
  className = "",
}: {
  post: PlannerPost;
  onToggle: (post: PlannerPost) => void;
  className?: string;
}) {
  const color = FORMAT_COLORS[formatOf(post)];
  return (
    <label
      className={`relative grid size-11 shrink-0 cursor-pointer place-items-center has-[:disabled]:cursor-default ${className}`}
      title={post.locked ? "Concluído pela equipe" : undefined}
    >
      <input
        type="checkbox"
        checked={post.done}
        disabled={post.locked}
        onChange={() => onToggle(post)}
        aria-label={`${label(post)}: ${post.locked ? "concluído pela equipe" : "marcar como feito"}`}
        className="size-5 cursor-[inherit] appearance-none rounded-[4px] border-2 outline-offset-2"
        style={{ borderColor: color, background: post.done ? color : "transparent" }}
      />
      {post.done ? (
        <Check aria-hidden className="pointer-events-none absolute size-3.5 text-[var(--brand-ink)]" strokeWidth={3.5} />
      ) : null}
    </label>
  );
}

/**
 * Mola crítica (sem overshoot), a mesma do ano e do dropdown do dia: nada aqui
 * foi arremessado, então não quica. É interruptível: tocar no meio do movimento
 * reverte a partir da altura atual.
 */
const SPRING = { type: "spring", bounce: 0, duration: 0.45 } as const;

const legendPill =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--p-line)] bg-[var(--p-glass)] px-2.5 py-0.5 text-[0.6875rem] font-medium text-[var(--p-text)]";

/**
 * O mês como no plano de conteúdo, em duas colunas na tela larga:
 * - esquerda: progresso, a grade com um anel por dia (vazio = a fazer, cheio =
 *   feito) e, logo abaixo, o detalhe do dia tocado, que desce como dropdown;
 * - direita: a lista de tudo que sai no mês e as ideias do mês (`ideas`).
 * No celular as duas colunas se empilham na mesma ordem.
 */
export function MonthPlanner({
  year,
  month,
  today,
  posts: initial,
  ideas,
}: {
  year: number;
  month: number;
  today: string;
  posts: PlannerPost[];
  /** Cartão de ideias do mês, montado no servidor; entra na coluna da direita. */
  ideas: ReactNode;
}) {
  const reduce = useReducedMotion();
  const detailId = useId();
  const prefix = `${year}-${pad(month)}-`;
  // Marcação otimista: mostra na hora e desfaz se o servidor recusar.
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const posts = initial.map((p) => (p.id in marks && !p.locked ? { ...p, done: marks[p.id] } : p));

  function toggle(post: PlannerPost) {
    if (post.locked) return;
    const done = !post.done;
    setError("");
    setMarks((m) => ({ ...m, [post.id]: done }));
    startTransition(async () => {
      try {
        await setPostDoneAction(post.id, done);
      } catch {
        setMarks((m) => ({ ...m, [post.id]: !done }));
        setError("Não foi possível salvar a marcação. Tente de novo.");
      }
    });
  }

  const pending = posts.filter((p) => !p.done);
  const late = pending.filter((p) => p.post_date < today);
  const next = pending.find((p) => p.post_date >= today);

  // Dia aberto no popover e onde ele ancora; nenhum até a pessoa tocar numa data.
  const [selected, setSelected] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{
    left: number;
    width: number;
    /** Distância da seta ao canto esquerdo do popover. */
    arrow: number;
    /** Abre pra cima quando embaixo do dia não cabe na tela. */
    above: boolean;
    /** Distância do popover ao dia (a partir do topo da grade, ou do fundo se abre pra cima). */
    edge: number;
  } | null>(null);
  const [group, setGroup] = useState<"week" | "format">("week");
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");
  // Semanas (ou formatos) abertas na lista; começam todas recolhidas.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  function toggleGroup(title: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }
  const gridRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fecha o popover com Esc, toque fora ou ao redimensionar (a posição ficaria velha).
  useEffect(() => {
    if (!selected) return;
    const close = () => {
      setSelected(null);
      setAnchor(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element;
      // Tocar noutro dia troca o popover; o próprio dia decide no clique.
      if (popoverRef.current?.contains(target) || target.closest?.("[data-iso]")) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", close);
    };
  }, [selected]);

  const byDay = new Map<string, PlannerPost[]>();
  for (const p of posts) byDay.set(p.post_date, [...(byDay.get(p.post_date) ?? []), p]);
  const weeks = monthWeeks(year, month);
  const formats = BACKLOG_FORMATS.filter((f) => posts.some((p) => formatOf(p) === f));

  const summary = [
    { key: "all", title: "Tudo do mês", list: posts, color: "var(--brand-cream)" },
    ...formats.map((f) => ({
      key: f,
      title: BACKLOG_FORMAT_LABELS[f],
      list: posts.filter((p) => formatOf(p) === f),
      color: FORMAT_COLORS[f],
    })),
  ];

  const groups =
    group === "week"
      ? weeks.map((week, i) => {
          const days = week.filter((d): d is number => d !== null);
          const from = `${prefix}${pad(days[0])}`;
          const to = `${prefix}${pad(days[days.length - 1])}`;
          return {
            title: `Semana ${i + 1} · ${dm(from)} a ${dm(to)}`,
            items: posts.filter((p) => p.post_date >= from && p.post_date <= to),
          };
        })
      : formats.map((f) => ({
          title: BACKLOG_FORMAT_LABELS[f],
          items: posts.filter((p) => formatOf(p) === f),
        }));
  const pass = (p: PlannerPost) => filter === "all" || (filter === "done" ? p.done : !p.done);

  /**
   * Posição do popover na grade: colado ao dia, com a seta no centro dele.
   * Abre pra baixo; se embaixo faltar espaço na tela e houver mais em cima, vira.
   */
  function anchorFor(el: HTMLElement) {
    const area = gridRef.current;
    if (!area) return null;
    const a = area.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const width = Math.min(352, a.width - 16);
    const center = b.left - a.left + b.width / 2;
    const left = Math.min(Math.max(center - width / 2, 8), a.width - width - 8);
    const spaceBelow = window.innerHeight - b.bottom;
    const above = spaceBelow < 300 && b.top > spaceBelow;
    return {
      left,
      width,
      arrow: center - left,
      above,
      edge: above ? a.bottom - b.top + 10 : b.bottom - a.top + 10,
    };
  }

  function pick(iso: string, el: HTMLElement) {
    if (selected === iso) {
      setSelected(null);
      setAnchor(null);
      return;
    }
    setSelected(iso);
    setAnchor(anchorFor(el));
  }

  // "Detalhes" na lista: traz o dia pra vista e abre o popover dele.
  function openDay(iso: string) {
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-iso="${iso}"]`);
    if (!el) return;
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
    setSelected(iso);
    setAnchor(anchorFor(el));
  }

  const dayItems = selected ? (byDay.get(selected) ?? []) : [];

  if (!posts.length) {
    return (
      <div className="space-y-6">
        <p className={`${pCard} text-[var(--p-muted)]`}>Nenhuma postagem programada para este mês.</p>
        {ideas}
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8 lg:space-y-0">
      <div className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-[26px] bg-[var(--brand-cream)] px-4 py-3 text-sm font-semibold text-[var(--brand-ink)]">
          {error}
        </p>
      ) : null}

      {/* Progresso */}
      <section
        aria-label="Progresso do mês"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-[26px] border border-[var(--p-line)] bg-[var(--p-line)]"
      >
        {summary.map((s) => {
          const done = s.list.filter((p) => p.done).length;
          return (
            <div key={s.key} className="space-y-1.5 bg-[rgb(58_31_20/0.6)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: s.color }}>
                {s.title}
              </p>
              <p className="text-2xl font-bold tabular-nums leading-none">
                {done} de {s.list.length}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--p-line)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.list.length ? (done / s.list.length) * 100 : 0}%`, background: s.color }}
                />
              </div>
            </div>
          );
        })}
        <div
          className={`space-y-1 bg-[rgb(58_31_20/0.6)] px-4 py-3 ${summary.length % 2 ? "" : "col-span-2"}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--p-muted)]">Próximo</p>
          {next ? (
            <>
              <p className="truncate font-semibold">{label(next)}</p>
              <p className="text-sm text-[var(--p-muted)]">
                {WEEKDAY_NAMES[weekday(next.post_date)]}, {dm(next.post_date)}
              </p>
            </>
          ) : (
            <p className="font-semibold">{pending.length ? "Nada mais pela frente" : "Tudo feito"}</p>
          )}
          {late.length ? (
            <p className="text-sm font-semibold text-[#f4a582]">
              {late.length} {late.length === 1 ? "atrasado" : "atrasados"}
            </p>
          ) : null}
        </div>
      </section>

      {/* Grade */}
      <section aria-label="Calendário do mês" className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--p-muted)]">
          {formats.map((f) => (
            <span key={f} className={legendPill}>
              <span aria-hidden className="inline-block size-3 rounded-[3px] border-2" style={{ borderColor: FORMAT_COLORS[f] }} />
              {BACKLOG_FORMAT_LABELS[f]}
            </span>
          ))}
          <span>Vazio: a fazer. Cheio: feito. Dia com tudo feito fica preenchido na cor do formato.</span>
        </div>
        <div ref={gridRef} className="relative">
        <div className={`${pCard} grid grid-cols-7 gap-1 p-3 sm:gap-1.5`}>
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              aria-hidden
              className="pb-1 text-center text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--p-muted)]"
            >
              {w}
            </div>
          ))}
          {weeks.flat().map((day, i) => {
            if (!day) return <div key={i} aria-hidden />;
            const iso = `${prefix}${pad(day)}`;
            const items = byDay.get(iso) ?? [];
            const on = iso === selected;
            const state = { today: iso === today, past: iso < today };
            const fill = state.today ? null : dayFill(items);
            const aria = `${day}, ${WEEKDAY_NAMES[weekday(iso)]}: ${
              items.length ? items.map((p) => `${label(p)} (${p.done ? "feito" : "a fazer"})`).join("; ") : "sem publicações"
            }`;
            return (
              <button
                key={i}
                type="button"
                data-iso={iso}
                aria-label={aria}
                aria-haspopup="dialog"
                aria-expanded={on}
                aria-controls={on ? detailId : undefined}
                onClick={(e) => pick(iso, e.currentTarget)}
                style={fill ?? undefined}
                className={`flex aspect-square w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full border-2 outline-offset-2 transition-colors duration-300 ${dayRing(state, items.length > 0, fill !== null)} ${
                  on ? "ring-2 ring-[var(--brand-cream)] ring-offset-2 ring-offset-[var(--brand-ink)]" : ""
                }`}
              >
                <span className="text-xs font-semibold tabular-nums">{day}</span>
                <span className="flex flex-wrap justify-center gap-px">
                  {items.map((p) => (
                    <Mark key={p.id} post={p} size="size-2" ink={fill !== null} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detalhe do dia: popover creme ancorado no dia tocado, com a seta
            apontando pra ele. Nasce do próprio dia (transform-origin na seta),
            por mola crítica, e sai pelo mesmo caminho. Esc ou toque fora fecham. */}
        <AnimatePresence>
          {selected && anchor ? (
            <motion.div
              key="detalhe"
              id={detailId}
              ref={popoverRef}
              role="dialog"
              aria-label={`${WEEKDAY_NAMES[weekday(selected)]}, ${dm(selected)}`}
              style={{
                left: anchor.left,
                width: anchor.width,
                ...(anchor.above ? { bottom: anchor.edge } : { top: anchor.edge }),
                transformOrigin: `${anchor.arrow}px ${anchor.above ? "100%" : "0px"}`,
              }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: anchor.above ? 6 : -6 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: anchor.above ? 6 : -6 }}
              transition={reduce ? { duration: 0.15 } : { type: "spring", bounce: 0, duration: 0.3 }}
              className="absolute z-30 drop-shadow-2xl"
            >
              <span
                aria-hidden
                className={`absolute size-3 rotate-45 rounded-[3px] bg-[var(--brand-cream)] ${
                  anchor.above ? "-bottom-1.5" : "-top-1.5"
                }`}
                style={{ left: anchor.arrow - 6 }}
              />
        <div className={`${pCardSolid} relative max-h-[min(24rem,70vh)] space-y-4 overflow-y-auto`}>
          <h3 className="text-lg font-semibold first-letter:uppercase">
            {WEEKDAY_NAMES[weekday(selected)]}, {dm(selected)}
            {selected === today ? (
              <span className="ml-2 rounded-full bg-[var(--brand-ink)] px-2 py-0.5 align-middle text-[11px] font-medium text-[var(--brand-cream)]">
                hoje
              </span>
            ) : null}
          </h3>
          {dayItems.length ? (
            <ul className="space-y-4">
              {dayItems.map((p) => {
                const f = formatOf(p);
                return (
                  <li key={p.id} className="space-y-2 border-t border-[var(--brand-taupe)] pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start gap-2.5">
                      <DoneBox post={p} onToggle={toggle} className="-my-3 -ml-3" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-olive)]">
                          {BACKLOG_FORMAT_LABELS[f]} ·{" "}
                          {p.done ? "feito" : p.post_date < today ? <span className="text-[#a3401a]">atrasado</span> : "a fazer"}
                        </p>
                        <p className={`font-semibold ${p.done ? "text-[var(--brand-muted)] line-through" : ""}`}>{label(p)}</p>
                      </div>
                    </div>
                    <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1 pl-8 text-sm">
                      {planRows(p.client_plan).map(([k, v], n) =>
                        k ? (
                          <div key={n} className="contents">
                            <dt className="text-[var(--brand-muted)]">{k}</dt>
                            <dd className="break-words">{v}</dd>
                          </div>
                        ) : (
                          <div key={n} className="col-span-2">
                            <dt className="sr-only">Nota</dt>
                            <dd className="break-words">{v}</dd>
                          </div>
                        ),
                      )}
                      {p.caption ? (
                        <>
                          <dt className="text-[var(--brand-muted)]">Legenda</dt>
                          <dd className="whitespace-pre-line break-words">{p.caption}</dd>
                        </>
                      ) : null}
                      {p.guide_slug ? (
                        <>
                          <dt className="text-[var(--brand-muted)]">Roteiro</dt>
                          <dd>
                            <Link href={`/guia/${p.guide_slug}?de=portal&volta=calendario`} className="font-semibold underline underline-offset-4">
                              Abrir roteiro
                            </Link>
                          </dd>
                        </>
                      ) : null}
                    </dl>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[var(--brand-muted)]">Nenhuma publicação neste dia.</p>
          )}
        </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>
      </section>
      </div>

      <div className="space-y-6">
      {/* Checklist */}
      <section aria-label={`Tudo o que sai no mês (${posts.length})`} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div role="group" aria-label="Agrupar por" className={pSegWrap}>
            <button type="button" aria-pressed={group === "week"} onClick={() => setGroup("week")} className={pSeg(group === "week")}>
              Semana
            </button>
            <button type="button" aria-pressed={group === "format"} onClick={() => setGroup("format")} className={pSeg(group === "format")}>
              Formato
            </button>
          </div>
          <div role="group" aria-label="Mostrar" className={pSegWrap}>
            {(
              [
                ["all", "Todos"],
                ["todo", "A fazer"],
                ["done", "Feitos"],
              ] as const
            ).map(([k, t]) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={pSeg(filter === k)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {groups.some((g) => g.items.some(pass)) ? (
          <div className="space-y-3">
          {groups.map((g, gi) => {
            const visible = g.items.filter(pass);
            if (!visible.length) return null;
            return (
              <section key={g.title} className={`${pCard} overflow-hidden p-0`}>
                {/* Recolhido por padrão. O toque afunda a linha na hora (CSS, no
                    pointer-down); a mola abre a altura e gira o chevron. */}
                <button
                  type="button"
                  onClick={() => toggleGroup(g.title)}
                  aria-expanded={openGroups.has(g.title)}
                  aria-controls={`${detailId}-g${gi}`}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left outline-offset-[-3px] transition-transform duration-150 ease-out active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  <h4 className="min-w-0 truncate font-semibold">{g.title}</h4>
                  <span className="flex shrink-0 items-center gap-2 text-sm text-[var(--p-muted)]">
                    {g.items.filter((p) => p.done).length} de {g.items.length} feitos
                    <motion.span
                      aria-hidden
                      className="grid place-items-center"
                      animate={{ rotate: openGroups.has(g.title) && !reduce ? 90 : 0 }}
                      transition={reduce ? { duration: 0 } : SPRING}
                    >
                      <ChevronRight className="size-4" />
                    </motion.span>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {openGroups.has(g.title) ? (
                    <motion.ul
                      key="itens"
                      id={`${detailId}-g${gi}`}
                      initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={reduce ? { duration: 0.15 } : SPRING}
                      className="overflow-hidden border-t border-[var(--p-line)]"
                    >
                      {visible.map((p) => (
                        <li key={p.id} className={`${pRow} flex items-center gap-3 px-4 py-2.5`}>
                          <DoneBox post={p} onToggle={toggle} className="-my-2 -ml-3" />
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate font-semibold ${p.done ? "text-[var(--p-muted)] line-through" : ""}`}>
                              {label(p)}
                            </span>
                            <span className="block text-sm text-[var(--p-muted)]">
                              {BACKLOG_FORMAT_LABELS[formatOf(p)]} · {WEEKDAYS[weekday(p.post_date)]} {dm(p.post_date)}
                              <span className="sr-only">{p.done ? ", feito" : ", a fazer"}</span>
                              {!p.done && p.post_date < today ? <span className="font-semibold text-[#f4a582]"> · atrasado</span> : null}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openDay(p.post_date)}
                            aria-label={`Ver detalhes de ${label(p)}`}
                            className="min-h-11 shrink-0 px-2 text-sm font-semibold underline underline-offset-4 active:opacity-70"
                          >
                            Detalhes
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  ) : null}
                </AnimatePresence>
              </section>
            );
          })}
          </div>
        ) : (
          <p className={`${pCard} text-[var(--p-muted)]`}>
            {filter === "done" ? "Nenhuma publicação feita ainda." : "Tudo feito. Nada a fazer neste mês."}
          </p>
        )}
      </section>

      {ideas}
      </div>
    </div>
  );
}
