"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { reducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Os filhos diretos sobem e aparecem em cascata quando o grupo entra na tela.
 * `batch` agrupa os que entram juntos, então a cascata acompanha as linhas da
 * grade em vez de contar o grupo inteiro de uma vez.
 */
export function StaggerIn({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (
        reducedMotion() ||
        !box.current
      ) {
        return;
      }
      const items = Array.from(box.current.children);
      gsap.set(items, { y: 40, opacity: 0 });
      ScrollTrigger.batch(items, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
          }),
      });
    },
    { scope: box }
  );

  return (
    <div ref={box} className={className}>
      {children}
    </div>
  );
}
