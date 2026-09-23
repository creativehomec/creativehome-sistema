import { redirect } from "next/navigation";
import { getAllowedFeatures } from "@/lib/session";

/** A seção abre no faturamento: as entregas moraram aqui, mas hoje o quadro
 *  é um só e vive em /admin/backlog. Quem não tem o financeiro liberado cai
 *  direto no cadastro. */
export default async function ClientesPage() {
  const allowed = await getAllowedFeatures();
  redirect(
    allowed.includes("financeiro")
      ? "/admin/clientes/faturamento"
      : "/admin/clientes/cadastro"
  );
}
