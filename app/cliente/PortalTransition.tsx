"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Véu de carregamento da tela inteira: aparece no toque num link do portal,
 * com blur e fade, e some com fade quando a tela nova chega. Some sozinho em
 * 8 segundos se a navegação não acontecer (link que não troca de tela).
 */
export function PortalTransition() {
  const pathname = usePathname();
  const search = useSearchParams();
  const key = `${pathname}?${search.toString()}`;
  // Tela de onde saiu o toque. O véu fica até a chave mudar: nova tela, sem efeito extra.
  const [from, setFrom] = useState<string | null>(null);
  const busy = from !== null && from === key;

  // Marca a saída no clique num link interno, antes da navegação começar.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Arquivo (download do Drive, PDF): o navegador baixa sem trocar de tela.
      if (url.pathname.startsWith("/api/")) return;
      if (url.pathname + url.search === window.location.pathname + window.location.search) return;
      setFrom(key);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [key]);

  // Rede lenta ou link que não navega: não deixa a tela presa.
  useEffect(() => {
    if (from === null) return;
    const timer = setTimeout(() => setFrom(null), 8000);
    return () => clearTimeout(timer);
  }, [from]);

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 bg-[rgb(29_15_10/0.4)] backdrop-blur-md transition-[opacity,visibility] duration-300 ease-in-out motion-reduce:backdrop-blur-none ${
        busy ? "visible opacity-100" : "invisible opacity-0"
      }`}
    />
  );
}
