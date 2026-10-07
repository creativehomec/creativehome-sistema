"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { reducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Frase que "acende" palavra por palavra enquanto a página rola — o fecho
 * "você traz o briefing, a gente dá vida". Sem movimento (ou com reduzir
 * movimento ligado) a frase aparece inteira.
 */
export function ScrollWords({
  children,
  className = "",
  style,
}: {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (
        reducedMotion() ||
        !ref.current
      ) {
        return;
      }
      // Sem autoSplit: ele reobserva o tamanho e redivide em laço quando a
      // divisão mexe no layout. Divide uma vez, com a fonte já carregada.
      let dead = false;
      let split: SplitText | undefined;
      let tween: gsap.core.Tween | undefined;
      document.fonts.ready.then(() => {
        if (dead || !ref.current) return;
        split = SplitText.create(ref.current, { type: "words" });
        tween = gsap.fromTo(
          split.words,
          { opacity: 0.15 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: {
              trigger: ref.current,
              start: "top 85%",
              end: "bottom 90%", // o rodapé não rola além disso: um fim mais alto nunca chegava a 100%
              scrub: true,
            },
          }
        );
      });
      return () => {
        dead = true;
        tween?.scrollTrigger?.kill();
        tween?.revert();
        split?.revert();
      };
    },
    { scope: ref, dependencies: [children] }
  );

  return (
    <p ref={ref} className={className} style={style}>
      {children}
    </p>
  );
}
