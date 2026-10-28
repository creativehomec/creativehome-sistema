"use client";

import Link from "next/link";
import { Accordion } from "@/components/Accordion";
import { visibleNavItems } from "@/components/admin/adminNavItems";
import type { FeatureKey } from "@/lib/features";

export function AdminActionsMenu({
  isAdmin = false,
  features,
  defaultOpen = false,
}: {
  isAdmin?: boolean;
  /** Áreas liberadas pra quem está logado — ver lib/features.ts. */
  features: FeatureKey[];
  /** Aberto no desktop, recolhido no mobile pra não empurrar as tarefas. */
  defaultOpen?: boolean;
}) {
  const actions = visibleNavItems(features, isAdmin);

  return (
    <Accordion
      summary={
        <span className="text-sm font-semibold text-neutral-900">Atalhos</span>
      }
      defaultOpen={defaultOpen}
      className="rounded-lg border border-neutral-200 bg-white"
      buttonClassName="p-4"
    >
      <nav aria-label="Atalhos" className="border-t border-neutral-100 p-2">
        <ul className="space-y-0.5">
          {actions.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-neutral-700 transition-transform hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.99] pointer-coarse:min-h-11"
              >
                <action.icon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-neutral-500"
                />
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Accordion>
  );
}
