"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { reducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Card que "abre" conforme entra na tela: a janela recortada cresce até
 * preencher o quadro (clip-path) e o conteúdo assenta de leve (scale).
 *
 * Preso ao scroll (scrub) em vez de disparar uma vez, então voltar a rolar
 * desfaz o efeito na mesma velocidade.
 */
export function ClipReveal({
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
      const inner = box.current.firstElementChild;
      const scroll = {
        trigger: box.current,
        start: "top 92%",
        end: "top 45%",
        scrub: 0.6,
      };
      gsap.fromTo(
        box.current,
        { clipPath: "inset(14% 9% 14% 9% round 2.5rem)" },
        { clipPath: "inset(0% 0% 0% 0% round 1.75rem)", ease: "none", scrollTrigger: scroll }
      );
      if (inner) {
        gsap.fromTo(
          inner,
          { scale: 1.25 },
          { scale: 1, ease: "none", scrollTrigger: scroll }
        );
      }
      // Saída: ao subir para fora da tela o card escurece e recua.
      gsap.to(box.current, {
        opacity: 0.2,
        scale: 0.94,
        ease: "none",
        scrollTrigger: {
          trigger: box.current,
          start: "bottom 35%",
          end: "bottom -5%",
          scrub: 0.6,
        },
      });
    },
    { scope: box }
  );

  return (
    <div ref={box} className={`overflow-hidden rounded-[1.75rem] ${className}`}>
      {children}
    </div>
  );
}
