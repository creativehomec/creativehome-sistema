"use client";

import Link from "next/link";
import { pCard, pGhost, pLead, pPrimary } from "./portalUi";

/**
 * Falha em qualquer tela do portal: em vez da página de erro do navegador,
 * fica a moldura do portal com um jeito de sair dali.
 */
export default function PortalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className={`${pCard} space-y-4`}>
      <h1 className="text-xl font-semibold">Não foi possível carregar esta tela</h1>
      <p className={pLead}>Tente de novo. Se continuar, volte ao início.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={pPrimary}>
          Tentar de novo
        </button>
        <Link href="/cliente" className={pGhost}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
