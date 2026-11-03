import { notFound } from "next/navigation";

// Endereço que não existe dentro de /cliente: sem esta rota o Next usa a 404
// geral; com ela, o not-found do portal aparece dentro do layout do portal.
export default function PortalCatchAll() {
  notFound();
}
