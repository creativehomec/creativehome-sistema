import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ClientAvatar } from "@/components/admin/ClientAvatar";
import { findClientLogo } from "@/lib/clientLogoMatch";
import { listClientLogos } from "@/lib/clientLogos";
import { listGalleryClients } from "@/lib/galleries";
import { getCurrentSession } from "@/lib/session";
import { pCard, pLead, pLink, pRow, pTitle } from "../portalUi";

export const dynamic = "force-dynamic";

/**
 * Tela do admin que abre o portal sem cliente escolhido: lista os clientes
 * para visualizar como ele. O cliente de verdade nunca chega aqui.
 */
export default async function EscolherClientePage() {
  const session = await getCurrentSession();
  if (!session || session.role === "client") redirect("/cliente/sair");

  const [clients, logos] = await Promise.all([
    listGalleryClients(),
    listClientLogos(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className={pTitle}>Ver o portal como…</h1>
        <p className={pLead}>
          Escolha o cliente. O que você fizer na visualização fica registrado como da equipe, e o app lembra a sua escolha.
        </p>
      </header>

      <ul
        className={`${pCard} p-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none`}
      >
        {clients.map((client) => (
          <li
            key={client.id}
            className={`${pRow} lg:rounded-[26px] lg:border lg:border-[var(--p-line)] lg:bg-[var(--p-glass)] lg:first:border-t`}
          >
            {/* <a> comum, não <Link>: a rota grava o cliente escolhido num cookie
                e uma pré-carga do Next gravaria um por um (ficava o último). */}
            <a href={`/cliente/previa?cliente=${client.id}`} className="flex min-h-[4.5rem] items-center gap-3 p-4">
              <ClientAvatar name={client.name} logoUrl={findClientLogo(client.name, logos)} size={48} />
              <span className="min-w-0 flex-1 truncate font-semibold">{client.name}</span>
              <ChevronRight className="size-4 shrink-0 text-[var(--p-muted)]" aria-hidden />
            </a>
          </li>
        ))}
      </ul>

      <Link href="/admin/area-do-cliente" className={pLink}>
        ← Voltar ao painel
      </Link>
    </div>
  );
}
