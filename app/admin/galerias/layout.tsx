import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function GaleriasLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("galerias");
  return children;
}
