import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function AreaDoClienteLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("area-do-cliente");
  return children;
}
