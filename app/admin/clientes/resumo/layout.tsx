import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("financeiro");
  return children;
}
