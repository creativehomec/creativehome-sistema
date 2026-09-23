import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function AgendaLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("agenda");
  return children;
}
