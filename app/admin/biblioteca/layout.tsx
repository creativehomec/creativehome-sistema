import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function BibliotecaLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("biblioteca");
  return children;
}
