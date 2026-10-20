import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function ArmazenamentoLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("armazenamento");
  return children;
}
