"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { BrandLogo } from "@/components/BrandLogo";
import { brandDisplayFontFamily } from "@/lib/brand";
import { reducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

export interface MenuItem {
  id: string;
  label: string;
}

/**
 * Cabeçalho fixo e menu de tela cheia da proposta.
 *
 * O movimento que no Sadu segue o cursor aqui segue o scroll e o toque: enquanto
 * o menu está aberto, rolar ou arrastar empurra e inclina os links na direção do
 * gesto, e eles voltam ao lugar com mola. No celular não há cursor, então o
 * gesto é a única entrada que existe.
 */
export function BudgetMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      if (!panel.current || !list.current) return;
      const reduced = reducedMotion();
      const links = Array.from(list.current.children);

      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: "power4.inOut" } })
        .fromTo(
          panel.current,
          { clipPath: "circle(0% at 92% 4%)" },
          { clipPath: "circle(150% at 92% 4%)", duration: reduced ? 0 : 0.9 }
        )
        .fromTo(
          links,
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: reduced ? 0 : 0.7,
            ease: "power3.out",
            stagger: 0.07,
          },
          "-=0.4"
        );
      // Visível só enquanto a timeline está fora do zero: um .set() no início
      // dela rodava já na criação e deixava o menu aberto ao carregar a página.
      tl.current.eventCallback("onStart", () => {
        gsap.set(panel.current, { visibility: "visible" });
      });
      tl.current.eventCallback("onReverseComplete", () => {
        gsap.set(panel.current, { visibility: "hidden" });
      });

      if (reduced) return;

      // Gesto -> deslocamento. quickTo reaproveita um tween por propriedade,
      // então cada wheel/touchmove só atualiza o alvo em vez de criar animação.
      const x = gsap.quickTo(list.current, "x", { duration: 0.6, ease: "power3" });
      const skew = gsap.quickTo(list.current, "skewX", { duration: 0.6, ease: "power3" });
      const settle = gsap.delayedCall(0.12, () => {
        x(0);
        skew(0);
      });
      const push = (delta: number) => {
        const d = gsap.utils.clamp(-120, 120, delta);
        x(d * 0.6);
        skew(gsap.utils.clamp(-10, 10, -d * 0.12));
        settle.restart(true);
      };
      const el = panel.current;
      const onWheel = (e: WheelEvent) => push(e.deltaY);
      let lastY = 0;
      const onTouchStart = (e: TouchEvent) => (lastY = e.touches[0].clientY);
      const onTouchMove = (e: TouchEvent) => {
        const y = e.touches[0].clientY;
        push((lastY - y) * 2);
        lastY = y;
      };
      el.addEventListener("wheel", onWheel, { passive: true });
      el.addEventListener("touchstart", onTouchStart, { passive: true });
      el.addEventListener("touchmove", onTouchMove, { passive: true });
      return () => {
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("touchstart", onTouchStart);
        el.removeEventListener("touchmove", onTouchMove);
      };
    },
    { scope: panel, dependencies: [items.map((i) => i.id).join("|")] }
  );

  // O estado manda: abrir/fechar toca a timeline e trava o scroll da página.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) tl.current?.play();
    else tl.current?.reverse();
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const toggle = setOpen;

  const go = (id: string) => {
    toggle(false);
    // Espera o menu começar a fechar para o scroll não brigar com o overflow.
    window.setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
      350
    );
  };

  if (items.length === 0) return null;

  return (
    <>
      {/* Sem logo aqui: a capa já tem o dela, e os dois se sobrepunham. */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-end px-4 py-4 text-[var(--brand-cream)] mix-blend-difference sm:px-8">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => toggle(true)}
          className="pointer-events-auto rounded-full border border-current/60 px-5 py-2 text-xs font-bold uppercase tracking-widest"
        >
          Menu
        </button>
      </header>

      <div
        ref={panel}
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-label="Menu da proposta"
        style={{ visibility: "hidden" }}
        className="fixed inset-0 z-50 flex flex-col bg-[var(--brand-ink)] px-4 py-4 text-[var(--brand-cream)] sm:px-8"
      >
        <div className="flex items-center justify-between">
          <BrandLogo className="h-7 w-auto" />
          <button
            type="button"
            onClick={() => toggle(false)}
            className="rounded-full border border-current/60 px-5 py-2 text-xs font-bold uppercase tracking-widest"
          >
            Fechar
          </button>
        </div>
        <ul ref={list} className="my-auto space-y-1 sm:space-y-2">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden">
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.id);
                }}
                style={{ fontFamily: brandDisplayFontFamily }}
                className="flex items-baseline gap-4 py-1 text-5xl uppercase leading-none tracking-wide transition-colors hover:text-[var(--brand-taupe)] sm:text-7xl"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
