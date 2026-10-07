"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reducedMotion } from "@/lib/motion";

/**
 * Scroll suave da proposta pública, ligado ao ScrollTrigger.
 *
 * Só a página pública monta isto: no editor o preview rola dentro de um
 * painel, e o Lenis da janela brigaria com ele.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
