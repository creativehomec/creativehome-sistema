import { requireFeature } from "@/lib/session";

/** Roteiros fazem parte do Guia de Captação: mesma liberação por usuário. */
export default async function RoteirosLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("guias");
  return children;
}
