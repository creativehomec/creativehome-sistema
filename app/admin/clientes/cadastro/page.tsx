import { AdminHeader } from "@/components/admin/AdminHeader";
import { ClientTabs } from "@/components/admin/ClientTabs";
import { ClientRegistry, type ClientSummary } from "@/components/admin/ClientRegistry";
import { getYearTotals } from "@/lib/billing";
import { listGalleryClients } from "@/lib/galleries";
import { getAllowedFeatures, getCurrentUsername } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ClientesCadastroPage() {
  const year = new Date().getFullYear();
  const [todos, totals, username, features] = await Promise.all([
    listGalleryClients({ includeArchived: true }),
    getYearTotals(year),
    getCurrentUsername(),
    getAllowedFeatures(),
  ]);

  const clients = todos.filter((client) => !client.archived_at);
  const archived = todos.filter((client) => client.archived_at);

  // Valor faturado é dado do financeiro: quem não tem a área liberada vê só
  // a contagem de entregas.
  const showMoney = features.includes("financeiro");
  const summaries: Record<string, ClientSummary> = {};
  for (const row of totals) {
    summaries[row.clientId] = {
      entregasNoAno: row.deliveries,
      faturadoNoAnoCents: showMoney ? row.totalCents : 0,
    };
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeader
        title="Clientes"
        trail={[
          { label: "Admin", href: "/admin" },
          { label: "Clientes", href: "/admin/clientes" },
          { label: "Cadastro" },
        ]}
        username={username}
      />

      <div className="mb-6">
        <ClientTabs features={features} />
      </div>

      <ClientRegistry
        clients={clients}
        archived={archived}
        summaries={summaries}
        year={year}
      />
    </div>
  );
}
