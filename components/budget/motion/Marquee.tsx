"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { reducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Velocidade em pixels por segundo: rápido o bastante para se mover, lento o bastante para ler o logo. */
const SPEED = 90;

/**
 * Faixa infinita, sempre no mesmo sentido e sem parar.
 *
 * A velocidade é fixa em px/s, não em "voltas por segundo": com 4 logos ou
 * com 20 a faixa anda igual. O conteúdo é repetido até a trilha cobrir a tela
 * mais uma volta, e a animação anda exatamente a largura de uma volta, o que
 * fecha o loop sem salto. Rolar a página dá só um empurrão extra de velocidade.
 */
export function Marquee({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLDivElement>(null);
  // Largura de uma volta. Medida com ResizeObserver e não uma vez só: no
  // primeiro quadro a largura pode ser 0 (fonte e imagem ainda chegando), e
  // medir só ali deixava a faixa parada para sempre.
  const [period, setPeriod] = useState(0);
  const copies = period > 0 ? Math.max(2, Math.ceil((typeof window === "undefined" ? 1440 : window.innerWidth) / period) + 1) : 2;

  useEffect(() => {
    const el = first.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setPeriod(el.getBoundingClientRect().width)
    );
    observer.observe(el);
    setPeriod(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      if (!period || !track.current || reducedMotion()) return;
      const loop = gsap.to(track.current, {
        x: -period,
        duration: period / SPEED,
        ease: "none",
        repeat: -1,
      });
      ScrollTrigger.create({
        trigger: track.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const boost = Math.min(Math.abs(self.getVelocity()) / 600, 2);
          gsap.to(loop, { timeScale: 1 + boost, duration: 0.2, overwrite: true });
          gsap.to(loop, { timeScale: 1, duration: 0.8, delay: 0.2 });
        },
      });
    },
    { scope: track, dependencies: [period] }
  );

  return (
    <div className="overflow-hidden">
      <div ref={track} className="flex w-max will-change-transform">
        {Array.from({ length: copies }, (_, i) => (
          <div
            key={i}
            ref={i === 0 ? first : undefined}
            className={`flex shrink-0 items-center ${className}`}
            aria-hidden={i > 0}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
