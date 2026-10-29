"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { confirmar } from "@/components/ConfirmHost";
import { formatBacklogDateShort, type BacklogCard } from "@/lib/backlogTypes";
import {
  cancelInstagramPostAction,
  getInstagramCardStateAction,
  publishInstagramNowAction,
  scheduleInstagramPostAction,
} from "@/app/admin/instagramActions";

type State = Awaited<ReturnType<typeof getInstagramCardStateAction>>;

const button =
  "min-h-9 rounded-md px-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50";

/**
 * Postar o card no Instagram do cliente. Busca o próprio estado em vez de
 * vir por prop: assim o quadro e o calendário não precisam carregar isso pra
 * todos os cards só pra mostrar no que está aberto.
 */
export function InstagramSection({ card }: { card: BacklogCard }) {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    getInstagramCardStateAction(card.id).then(
      (next) => alive && setState(next),
    );
    return () => {
      alive = false;
    };
  }, [card.id]);

  // Vídeo processando: o cron termina, aqui só acompanha.
  const status = state?.post?.status;
  useEffect(() => {
    if (status !== "processando") return;
    const timer = setInterval(
      () => getInstagramCardStateAction(card.id).then(setState),
      10000,
    );
    return () => clearInterval(timer);
  }, [status, card.id]);

  if (!state?.configured) return null;

  function act(fn: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
      setState(await getInstagramCardStateAction(card.id));
    });
  }

  async function publishNow() {
    if (
      !(await confirmar(
        "Publicar agora no Instagram do cliente? Vai com a legenda salva no card.",
        "Publicar",
      ))
    )
      return;
    act(() => publishInstagramNowAction(card.id));
  }

  const post = state.post;
  const when = card.post_date
    ? `${formatBacklogDateShort(card.post_date)} às ${(card.post_time ?? "09:00").slice(0, 5)}`
    : null;

  return (
    <section
      aria-labelledby={`ig-${card.id}`}
      className="rounded-lg border border-neutral-200 p-3"
    >
      <h3
        id={`ig-${card.id}`}
        className="mb-2 text-sm font-semibold text-neutral-900"
      >
        Instagram
        {state.username ? (
          <span className="font-normal text-neutral-500">
            {" "}
            · @{state.username}
          </span>
        ) : null}
      </h3>

      {!state.username ? (
        <p className="text-sm text-neutral-600">
          {card.client_id
            ? "O Instagram desse cliente não está conectado. "
            : "Escolha o cliente do card. "}
          <Link href="/admin/clientes/instagram" className="underline">
            Conectar em Clientes › Instagram
          </Link>
        </p>
      ) : post?.status === "publicado" ? (
        <p className="text-sm text-emerald-700">
          Publicado.{" "}
          {post.permalink ? (
            <a
              href={post.permalink}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Ver no Instagram
            </a>
          ) : null}
        </p>
      ) : post?.status === "processando" ? (
        <p className="text-sm text-sky-700">
          O Instagram está processando a mídia. Publica sozinho quando terminar.
        </p>
      ) : (
        <div className="space-y-2">
          {post?.status === "agendado" ? (
            <p className="text-sm text-neutral-700">
              Agendado pra {when ?? "quando tiver data"}.
            </p>
          ) : null}
          {post?.status === "erro" ? (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-800">
              Não publicou: {post.error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={publishNow}
              disabled={pending}
              className={`${button} bg-neutral-900 text-white hover:bg-neutral-700`}
            >
              {pending ? "Enviando..." : "Publicar agora"}
            </button>
            {post?.status === "agendado" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => act(() => cancelInstagramPostAction(card.id))}
                className={`${button} text-neutral-600 hover:bg-neutral-100`}
              >
                Cancelar agendamento
              </button>
            ) : (
              <button
                type="button"
                disabled={pending || !when}
                title={when ? undefined : "Marque a data do post no card"}
                onClick={() => act(() => scheduleInstagramPostAction(card.id))}
                className={`${button} border border-neutral-300 text-neutral-800 hover:bg-neutral-50`}
              >
                {when ? `Agendar pra ${when}` : "Agendar (sem data)"}
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            Usa o link do Drive e a legenda salvos. Carrossel: link de uma pasta
            com 2 a 10 arquivos.
          </p>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
