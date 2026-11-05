import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProspeccaoForm } from "@/components/admin/ProspeccaoForm";
import { getCurrentUsername } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProspeccaoPage() {
  const username = await getCurrentUsername();
  return (
    <>
      <AdminHeader
        title="Prospecção"
        trail={[{ label: "Admin", href: "/admin" }, { label: "Prospecção" }]}
        username={username}
      />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p className="mb-6 text-sm text-neutral-600">
          Busca empresas no Google Maps e baixa uma planilha com telefone, e-mail, site e redes sociais.
          Só funciona no Mac que tem o scraper instalado.
        </p>
        <ProspeccaoForm />
      </main>
    </>
  );
}
