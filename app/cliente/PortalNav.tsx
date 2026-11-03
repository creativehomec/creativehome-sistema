"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, CalendarDays, Clapperboard, House } from "lucide-react";

const TABS = [
  { href: "/cliente", label: "Início", Icon: House },
  { href: "/cliente/calendario", label: "Calendário", Icon: CalendarDays },
  { href: "/cliente/materiais", label: "Materiais", Icon: Clapperboard },
  { href: "/cliente/roteiros", label: "Roteiros", Icon: BookOpenText },
];

/**
 * Três abas, não mais: o cliente decide em um olhar. No celular é uma pílula
 * de vidro fixa embaixo (polegar). No desktop é a mesma pílula, no topo do
 * conteúdo. A aba atual é creme sólido: peso e cor, não só cor.
 */
export function PortalNav({ floating = false }: { floating?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Portal do cliente"
      className={
        floating
          ? "fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 rounded-full border border-[var(--p-line)] bg-[rgb(58_31_20/0.8)] shadow-lg shadow-black/20 backdrop-blur-md"
          : "md:inline-flex"
      }
    >
      <ul
        className={
          floating
            ? "mx-auto flex max-w-xl gap-1 p-1.5"
            : "flex gap-1 rounded-full border border-[var(--p-line)] bg-[var(--p-glass)] p-1.5"
        }
      >
        {TABS.map(({ href, label, Icon }) => {
          const current = href === "/cliente" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className={floating ? "flex-1" : ""}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full text-xs outline-offset-[-3px] transition-colors active:opacity-70 lg:min-h-11 lg:flex-row lg:gap-2 lg:px-4 lg:text-sm ${
                  current
                    ? "bg-[var(--brand-cream)] font-semibold text-[var(--brand-ink)]"
                    : "text-[var(--p-muted)] hover:text-[var(--p-text)]"
                }`}
              >
                <Icon className="size-5" strokeWidth={current ? 2.4 : 1.8} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
