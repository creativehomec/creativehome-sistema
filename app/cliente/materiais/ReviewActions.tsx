"use client";

import { useFormStatus } from "react-dom";
import { approveCardAction, requestChangesAction } from "../actions";
import { pGhost, pPrimary } from "../portalUi";

function Submit({ children, primary = false }: { children: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={`${primary ? pPrimary : pGhost} w-full`}>
      {pending ? "Enviando…" : children}
    </button>
  );
}

/**
 * As duas decisões lado a lado. O ajuste abre o campo só quando escolhido, e
 * depois de qualquer uma o portal segue para o próximo material pendente.
 */
export function ReviewActions({ cardId }: { cardId: string }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Grupo nomeado: este <details> fica dentro do <details> do material, que também
            é "group". Com `group-open:` sem nome o botão sumia assim que o material abria. */}
        <details className="group/ajuste col-span-1 [&[open]]:col-span-2 [&[open]]:order-2">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center rounded-full border border-[var(--p-line)] bg-[var(--p-glass)] font-semibold text-[var(--p-text)] [&::-webkit-details-marker]:hidden group-open/ajuste:hidden">
            Ajuste
          </summary>
          <form action={requestChangesAction} className="space-y-2">
            <input type="hidden" name="cardId" value={cardId} />
            <label className="block text-sm font-medium" htmlFor={`fb-${cardId}`}>
              Comente o ajuste que você quer
            </label>
            <textarea
              id={`fb-${cardId}`}
              name="feedback"
              required
              rows={3}
              autoFocus
              className="w-full rounded-[18px] border border-[var(--p-line)] bg-[var(--brand-cream)] p-3 text-[var(--brand-ink)]"
            />
            <Submit>Enviar ajuste</Submit>
          </form>
        </details>
        <form action={approveCardAction} className="col-span-1">
          <input type="hidden" name="cardId" value={cardId} />
          <Submit primary>Aprovar</Submit>
        </form>
      </div>
    </div>
  );
}
