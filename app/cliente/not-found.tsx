import Link from "next/link";
import { pCard, pLead, pPrimary } from "./portalUi";

/**
 * 404 dentro do portal: fica na moldura do portal e volta pro Início, em vez
 * da 404 geral, que manda pro Painel da equipe.
 */
export default function PortalNotFound() {
  return (
    <div className={`${pCard} space-y-4`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--p-muted)]">Erro 404</p>
      <h1 className="text-xl font-semibold">Esta página não existe</h1>
      <p className={pLead}>O endereço pode ter mudado, ou o item que estava aqui foi apagado.</p>
      <Link href="/cliente" className={pPrimary}>
        Voltar ao início
      </Link>
    </div>
  );
}
