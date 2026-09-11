import { redirect } from "next/navigation";

/** Endereço antigo, de quando o quadro de entregas era uma aba de Clientes. */
export default function ClientesEntregasRedirectPage() {
  redirect("/admin/backlog");
}
