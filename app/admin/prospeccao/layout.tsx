import { requireFeature } from "@/lib/session";

export default async function ProspeccaoLayout({ children }: { children: React.ReactNode }) {
  await requireFeature("prospeccao");
  return children;
}
