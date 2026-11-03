import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getPortalClient, getPortalSession } from "@/lib/clientPortal";
import { listPublishedGuidesByClientName } from "@/lib/guides";
import { pCard, pLead, pRow, pTitle } from "../portalUi";

export const dynamic = "force-dynamic";

export default async function RoteirosPage() {
  const { clientId } = await getPortalSession();
  const client = await getPortalClient(clientId);
  const guides = await listPublishedGuidesByClientName(client.name);

  return (
    <div className="space-y-6">
      <header>
        <h1 className={pTitle}>Roteiros</h1>
        <p className={pLead}>Roteiros, referências e orientações de cada gravação, reunidos no guia de captação.</p>
      </header>

      {guides.length ? (
        // Em tela larga cada roteiro vira um cartão, em duas colunas.
        <ul
          className={`${pCard} p-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none`}
        >
          {guides.map((guide) => (
            <li
              key={guide.slug}
              className={`${pRow} lg:rounded-[26px] lg:border lg:border-[var(--p-line)] lg:bg-[var(--p-glass)] lg:first:border-t`}
            >
              <Link href={`/guia/${guide.slug}?de=portal`} className="flex min-h-16 items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{guide.title}</span>
                  <span className="block text-sm text-[var(--p-muted)]">
                    {guide.shoot_date
                      ? `Gravação em ${new Date(`${guide.shoot_date}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}`
                      : "Data a definir"}
                    {guide.location ? ` · ${guide.location}` : ""}
                  </span>
                </span>
                <ChevronRight className="size-4 text-[var(--p-muted)]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`${pCard} text-[var(--p-muted)]`}>Os roteiros publicados para o seu projeto serão exibidos aqui.</p>
      )}
    </div>
  );
}
