import { redirect } from "next/navigation";

/** A seção abre no faturamento: as entregas moraram aqui, mas hoje o quadro
 *  é um só e vive em /admin/backlog. */
export default function ClientesPage() {
  redirect("/admin/clientes/faturamento");
}
