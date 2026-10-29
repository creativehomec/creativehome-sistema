import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function ClientesLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("clientes");
  return children;
}
