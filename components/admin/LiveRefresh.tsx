"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const DEFAULT_INTERVAL_MS = 10_000;

/**
 * Tabelas com policy de `select` pública (supabase/migrations/0039_realtime_select.sql)
 * — mudança em qualquer uma delas dispara o mesmo `refresh()` do polling, só
 * que na hora, sem esperar o intervalo.
 */
const TABELAS_AO_VIVO = [
  "notifications",
  "backlog_columns",
  "backlog_cards",
  "backlog_checklist_items",
  "backlog_card_activity",
  "daily_todos",
  "daily_todo_assignees",
  "daily_todo_checklist_items",
  "guides",
  "videos",
  "scenes",
  "visual_references",
  "photo_items",
  "card_items",
  "shot_list_items",
  "checklist_items",
] as const;

// Elementos onde o usuário está digitando: revalidar por baixo enquanto isso
// acontece só atrapalha, então o ciclo espera o campo perder o foco.
const TYPING_SELECTOR = "input, textarea, select, [contenteditable='true']";

function isBusy() {
  if (document.visibilityState !== "visible") return true;
  // Qualquer modal aberto (drawer de tarefa, de card, confirmações) conta como
  // interação em curso — todos passam pelo DialogContent de components/ui.
  if (
    document.querySelector("[data-live-pause], [data-slot='dialog-content']")
  ) {
    return true;
  }

  const active = document.activeElement;
  return active instanceof HTMLElement && active.matches(TYPING_SELECTOR);
}

/**
 * Mantém a página em dia com o que os outros usuários fizeram, sem F5.
 *
 * As telas do admin são `force-dynamic` e o servidor é a fonte da verdade, então
 * basta pedir uma revalidação de rota de tempos em tempos: o React reconcilia as
 * props novas por cima do estado local (ver `Board.tsx` e `DailyTodoList.tsx`).
 *
 * Componentes que estejam no meio de uma interação (arraste, drawer aberto)
 * marcam um elemento com `data-live-pause` para segurar o ciclo.
 */
export function LiveRefresh({
  intervalMs = DEFAULT_INTERVAL_MS,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // O ciclo não deve reiniciar a cada transição, então a flag chega no efeito
  // por ref em vez de virar dependência.
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const lastRefreshRef = useRef(0);

  // Compartilhado pelo polling e pelo Realtime: os dois só pedem a mesma
  // revalidação de rota, o que muda é o que dispara o pedido.
  const refresh = useCallback(() => {
    // Em rede lenta uma revalidação pode passar do intervalo; não empilha.
    if (pendingRef.current) return;
    lastRefreshRef.current = Date.now();
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    function tick() {
      if (isBusy()) return;
      refresh();
    }

    // Voltar pra aba deve mostrar dados atuais na hora, sem esperar o ciclo.
    // `focus` e `visibilitychange` disparam juntos ao alternar de janela — a
    // janela de 1s abaixo evita a revalidação dobrada.
    function refreshOnReturn() {
      if (isBusy()) return;
      if (Date.now() - lastRefreshRef.current < 1000) return;
      refresh();
    }

    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", refreshOnReturn);
    window.addEventListener("focus", refreshOnReturn);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("focus", refreshOnReturn);
    };
  }, [intervalMs, refresh]);

  // Push do Realtime por cima do polling: o intervalo de 10s continua como
  // rede de segurança (canal caiu, RLS ainda não migrada), o canal só
  // adianta a revalidação pra na hora que alguém mexe em algo. Sem as
  // variáveis públicas configuradas, o efeito não faz nada — a tela some sem
  // quebrar o polling.
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel("live-refresh");

    for (const table of TABELAS_AO_VIVO) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          if (isBusy()) return;
          refresh();
        },
      );
    }

    channel.subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        // Cai pro polling sozinho — não é motivo pra quebrar a tela.
        console.warn("LiveRefresh: Realtime indisponível, seguindo no polling.", err);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return null;
}
