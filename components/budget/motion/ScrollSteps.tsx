"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { reducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Etapas verticais: cada linha fica apagada e acende quando chega perto do
 * centro da tela, e apaga de novo ao sair — o leitor sempre sabe em que etapa
 * está.
 */
export function ScrollSteps({
  items,
  dividerClass,
  mutedClass,
}: {
  items: string[];
  dividerClass: string;
  mutedClass: string;
}) {
  const box = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      if (
        reducedMotion() ||
        !box.current
      ) {
        return;
      }
      for (const row of Array.from(box.current.children)) {
        gsap.fromTo(
          row,
          { opacity: 0.25 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top 85%",
              end: "top 55%",
              scrub: true,
              toggleActions: "play reverse play reverse",
            },
          }
        );
      }
    },
    { scope: box, dependencies: [items.join("|")] }
  );

  return (
    <ol ref={box}>
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className={`flex items-baseline gap-5 border-t py-6 sm:gap-8 sm:py-8 ${dividerClass}`}
        >
          <span className={`text-sm tabular-nums ${mutedClass}`}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-2xl font-medium leading-tight sm:text-4xl">
            {item}
          </span>
        </li>
      ))}
    </ol>
  );
}
