import {
  Briefcase,
  CalendarClock,
  Clapperboard,
  HardDrive,
  MonitorSmartphone,
  Images,
  Kanban,
  Library,
  PenLine,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { FeatureKey } from "@/lib/features";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Aparece se qualquer uma dessas áreas estiver liberada. */
  features: FeatureKey[];
  /** Grupo no menu do cabeçalho. */
  group: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/guias", label: "Guia de Captação", icon: Clapperboard, features: ["guias"], group: "Criação" },
  { href: "/admin/lettering", label: "Lettering", icon: PenLine, features: ["lettering"], group: "Criação" },
  { href: "/admin/biblioteca", label: "Biblioteca", icon: Library, features: ["biblioteca"], group: "Criação" },
  { href: "/admin/clientes", label: "Clientes", icon: Briefcase, features: ["clientes", "financeiro"], group: "Clientes" },
  { href: "/admin/orcamentos", label: "Orçamento", icon: Receipt, features: ["orcamentos"], group: "Clientes" },
  { href: "/admin/galerias", label: "Galeria do cliente", icon: Images, features: ["galerias"], group: "Clientes" },
  { href: "/admin/area-do-cliente", label: "Área do cliente", icon: MonitorSmartphone, features: ["area-do-cliente"], group: "Clientes" },
  { href: "/admin/backlog", label: "Entregas", icon: Kanban, features: ["backlog"], group: "Rotina" },
  { href: "/admin/agenda", label: "Minha Agenda", icon: CalendarClock, features: ["agenda"], group: "Rotina" },
  { href: "/admin/armazenamento", label: "Armazenamento", icon: HardDrive, features: ["armazenamento"], group: "Rotina" },
];

export const ADMIN_USERS_ITEM: AdminNavItem = {
  href: "/admin/usuarios",
  label: "Usuários",
  icon: Users,
  features: [],
  group: "Sistema",
};

/** Itens visíveis para quem está logado; Usuários só para admin. */
export function visibleNavItems(features: FeatureKey[], isAdmin: boolean): AdminNavItem[] {
  const items = ADMIN_NAV_ITEMS.filter((item) =>
    item.features.some((key) => features.includes(key))
  );
  return isAdmin ? [...items, ADMIN_USERS_ITEM] : items;
}
