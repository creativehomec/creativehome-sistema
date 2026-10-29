import { AdminHeader } from "@/components/admin/AdminHeader";
import { ClientTabs } from "@/components/admin/ClientTabs";
import { listGalleryClients } from "@/lib/galleries";
import { getCurrentClientScope } from "@/lib/clientAccess";
import { getAllowedFeatures, getCurrentUsername } from "@/lib/session";
import { isInstagramConfigured, listInstagramAccounts } from "@/lib/instagram";
import { DisconnectButton } from "./DisconnectButton";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ ig_conectado?: string; ig_erro?: string }>;

export default async function ClientesInstagramPage({ searchParams }: { searchParams: SearchParams }) {
  const { ig_conectado, ig_erro } = await searchParams;
  const clientScope = await getCurrentClientScope();
  const configured = isInstagramConfigured();
  const [clients, accounts, username, features] = await Promise.all([
    listGalleryClients({ clientScope }),
    configured ? listInstagramAccounts() : [],
    getCurrentUsername(),
    getAllowedFeatures(),
  ]);
  const accountByClient = new Map(accounts.map((a) => [a.client_id, a]));

  return (
    <div className="mx-auto w-full max-w-5xl py-10">
      <AdminHeader
        title="Clientes"
        trail={[
          { label: "Admin", href: "/admin" },
          { label: "Clientes", href: "/admin/clientes" },
          { label: "Instagram" },
        ]}
        username={username}
      />

      <div className="mb-6">
        <ClientTabs features={features} />
      </div>

      {ig_conectado ? (
        <p role="status" className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          @{ig_conectado} conectado. Os cards desse cliente já podem ser postados.
        </p>
      ) : null}
      {ig_erro ? (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
          Não deu pra conectar: {ig_erro}
        </p>
      ) : null}

      {!configured ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          O app do Instagram ainda não está configurado. Falta definir INSTAGRAM_APP_ID,
          INSTAGRAM_APP_SECRET e INSTAGRAM_REDIRECT_URI na Vercel.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-neutral-600">
            Conecte a conta profissional (Empresa ou Criador) de cada cliente. Na tela do
            Instagram, entre com o login do cliente. O acesso se renova sozinho.
          </p>
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {clients.map((client) => {
              const account = accountByClient.get(client.id);
              return (
                <li key={client.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900">{client.name}</p>
                    <p className="text-xs text-neutral-500">
                      {account ? `@${account.username}` : "Não conectado"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {account ? <DisconnectButton clientId={client.id} username={account.username} /> : null}
                    <a
                      href={`/api/instagram/oauth/start?cliente=${client.id}`}
                      className="inline-flex min-h-9 items-center rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {account ? "Trocar conta" : "Conectar Instagram"}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
