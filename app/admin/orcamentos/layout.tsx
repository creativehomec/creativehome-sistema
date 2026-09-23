import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function OrcamentosLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("orcamentos");
  return children;
}
