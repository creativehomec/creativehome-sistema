import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function BacklogLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("backlog");
  return children;
}
