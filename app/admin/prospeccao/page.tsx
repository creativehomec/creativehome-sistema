import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProspeccaoForm } from "@/components/admin/ProspeccaoForm";
import { listarBuscas, listarContatados, usuarioProspeccao } from "@/lib/prospeccao";
import { getCurrentUsername } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProspeccaoPage() {
  const username = await getCurrentUsername();
  const userId = await usuarioProspeccao();
  // Se a migration 0075 ainda não rodou, a tela funciona sem histórico.
  const [historico, contatados] = userId
    ? await Promise.all([listarBuscas(userId).catch(() => []), listarContatados(userId).catch(() => [])])
    : [[], []];
  return (
    <>
      <AdminHeader
        title="Prospecção"
        trail={[{ label: "Admin", href: "/admin" }, { label: "Prospecção" }]}
        username={username}
      />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="mb-6 w-fit max-w-full rounded-lg bg-white/90 px-3 py-2 text-sm text-neutral-700 backdrop-blur-sm">
          Busca empresas no Google Maps e mostra telefone, e-mail, site e Instagram, com planilha para baixar.
          Só funciona no Mac que tem o scraper instalado.
        </p>
        <ProspeccaoForm historico={historico} contatados={contatados} />
      </main>
    </>
  );
}
