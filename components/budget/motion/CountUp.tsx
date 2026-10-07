"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { reducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Número de destaque que conta de zero até o valor ao entrar na tela.
 * Só anima o primeiro número do texto ("+120 marcas" conta o 120); sem número
 * no texto, aparece como veio.
 */
export function CountUp({
  value,
  className = "",
  style,
}: {
  value: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const match = value.match(/^(\D*)(\d+)(.*)$/);
      if (
        !match ||
        !ref.current ||
        reducedMotion()
      ) {
        return;
      }
      const [, prefix, digits, suffix] = match;
      const counter = { n: 0 };
      const el = ref.current;
      el.textContent = `${prefix}0${suffix}`;
      gsap.to(counter, {
        n: Number(digits),
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(counter.n)}${suffix}`;
        },
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    },
    { scope: ref, dependencies: [value] }
  );

  return (
    <p ref={ref} className={className} style={style}>
      {value}
    </p>
  );
}
