import {
  Briefcase,
  CalendarClock,
  Clapperboard,
  Images,
  Kanban,
  Library,
  PenLine,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { FeatureKey } from "@/lib/features";

export type AdminAction = { href: string; label: string; icon: LucideIcon };

const ACTIONS: (AdminAction & {
  /** Aparece se qualquer uma dessas áreas estiver liberada (lib/features.ts). */
  features: FeatureKey[];
})[] = [
  { href: "/admin/guias", label: "Guia de Captação", icon: Clapperboard, features: ["guias"] },
  { href: "/admin/orcamentos", label: "Orçamento", icon: Receipt, features: ["orcamentos"] },
  { href: "/admin/biblioteca", label: "Biblioteca", icon: Library, features: ["biblioteca"] },
  { href: "/admin/galerias", label: "Galeria do cliente", icon: Images, features: ["galerias"] },
  { href: "/admin/backlog", label: "Entregas", icon: Kanban, features: ["backlog"] },
  { href: "/admin/clientes", label: "Clientes", icon: Briefcase, features: ["clientes", "financeiro"] },
  { href: "/admin/agenda", label: "Minha Agenda", icon: CalendarClock, features: ["agenda"] },
  { href: "/admin/lettering", label: "Lettering", icon: PenLine, features: ["lettering"] },
];

const ADMIN_ONLY_ACTIONS: AdminAction[] = [
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
];

/** Só o que a pessoa pode abrir: as áreas liberadas e, pra admin, Usuários. */
export function adminActions(
  isAdmin: boolean,
  features: FeatureKey[]
): AdminAction[] {
  const allowed = ACTIONS.filter((action) =>
    action.features.some((key) => features.includes(key))
  );
  return isAdmin ? [...allowed, ...ADMIN_ONLY_ACTIONS] : allowed;
}

/**
 * `/admin/guias/abc` ainda é a tela de Guias — sem o prefixo, só a listagem
 * raiz ficaria marcada e a pessoa perderia a referência ao abrir um item.
 */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
