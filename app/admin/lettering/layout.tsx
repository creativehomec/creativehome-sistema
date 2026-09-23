import { requireFeature } from "@/lib/session";

/** Área liberada por usuário — ver lib/features.ts. */
export default async function LetteringLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("lettering");
  return children;
}
