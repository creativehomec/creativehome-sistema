import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function GuiasLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("guias");
  return children;
}
