"use client";

import { ChevronDown, Home } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { visibleNavItems } from "@/components/admin/adminNavItems";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FeatureKey } from "@/lib/features";

const ITEM =
  "flex items-center gap-3 rounded-md px-2 py-2 text-sm text-neutral-700 transition-transform hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none active:scale-[0.99] pointer-coarse:min-h-11";

/**
 * Menu do cabeçalho: o botão mostra a página atual e abre a lista de áreas,
 * agrupada. Fecha ao escolher, ao clicar fora e no Esc (base-ui).
 */
export function AdminNavMenu({
  current,
  features,
  isAdmin,
}: {
  current: string;
  features: FeatureKey[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const groups = new Map<string, ReturnType<typeof visibleNavItems>>();
  for (const item of visibleNavItems(features, isAdmin)) {
    groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Menu: ${current}`}
        className="flex min-w-0 items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-[13px] font-medium text-neutral-900 transition-transform hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97] pointer-coarse:min-h-11"
      >
        <span className="truncate">{current}</span>
        <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-neutral-500" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1 p-2">
        <nav aria-label="Áreas do admin" className="space-y-2">
          <Link href="/admin" onClick={() => setOpen(false)} className={ITEM}>
            <Home aria-hidden="true" className="size-4 shrink-0 text-neutral-500" />
            Painel
          </Link>
          {[...groups].map(([group, items]) => (
            <div key={group}>
              <p className="px-2 pb-0.5 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                {group}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={() => setOpen(false)} className={ITEM}>
                      <item.icon aria-hidden="true" className="size-4 shrink-0 text-neutral-500" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </PopoverContent>
    </Popover>
  );
}
