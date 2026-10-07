"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { reducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** Título de seção: cada linha sobe de dentro de uma máscara ao entrar na tela. */
export function SplitTitle({
  children,
  className = "",
  style,
}: {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (
        reducedMotion() ||
        !ref.current
      ) {
        return;
      }
      // A divisão em linhas depende da fonte já carregada; dividir antes
      // mede a largura errada e a máscara corta o texto.
      let dead = false;
      let split: SplitText | undefined;
      let trigger: ScrollTrigger | undefined;
      let failsafe = 0;
      document.fonts.ready.then(() => {
        const el = ref.current;
        if (dead || !el) return;
        split = SplitText.create(el, { type: "lines", mask: "lines" });
        const lines = split.lines;
        gsap.set(lines, { yPercent: 110 });
        let shown = false;
        const reveal = () => {
          if (shown) return;
          shown = true;
          gsap.to(lines, {
            yPercent: 0,
            duration: 1,
            ease: "power4.out",
            stagger: 0.1,
          });
          // Trava de segurança: termina inteiro mesmo se a animação parar.
          failsafe = window.setTimeout(() => gsap.set(lines, { yPercent: 0 }), 2500);
        };
        trigger = ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          onEnter: reveal,
          onLeave: reveal,
        });
        // Já passou do ponto de entrada (recarregou no meio da página).
        if (trigger.progress > 0) reveal();
      });
      return () => {
        dead = true;
        window.clearTimeout(failsafe);
        trigger?.kill();
        split?.revert();
      };
    },
    { scope: ref, dependencies: [children] }
  );

  return (
    <h2 ref={ref} className={className} style={style}>
      {children}
    </h2>
  );
}
