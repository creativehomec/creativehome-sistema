import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function ReferencesLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("referencias");
  return children;
}
