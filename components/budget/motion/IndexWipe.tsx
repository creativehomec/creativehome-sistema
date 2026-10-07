/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { reducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface Item {
  name: string;
  url: string;
  photo?: string;
}

/**
 * Índice de nomes: o item ativo "varre" sua foto de fundo (ou o logo, sem foto), vindo
 * da direção em que o leitor está se movendo, e o contador rola como um
 * odômetro.
 *
 * Entrada: com mouse, é o hover; no toque não existe hover, então o item que
 * cruza o meio da tela ao rolar vira o ativo.
 *
 * O recorte nunca anima `clip-path` como string: o navegador colapsa o
 * `inset()` quando dois lados coincidem e o GSAP não interpola. Um número
 * (`p`, de 0 a 1) é animado e o polígono é reescrito a cada quadro, com a
 * borda da frente adiantada em relação à de trás para o corte sair inclinado.
 */
function polygon(p: number, fromTop: boolean) {
  const lead = Math.min(p * 125, 100);
  const trail = Math.min(Math.max(p * 125 - 25, 0), 100);
  return fromTop
    ? `polygon(0% 0%, 100% 0%, 100% ${lead}%, 0% ${trail}%)`
    : `polygon(0% ${100 - trail}%, 100% ${100 - lead}%, 100% 100%, 0% 100%)`;
}

/**
 * `initial` é só o ponto de partida: depois o GSAP é quem move a coluna. Se o
 * transform dependesse do estado, cada render do React desfaria a animação.
 */
function Digit({ initial }: { initial: number }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-bottom">
      <span
        data-digit
        className="absolute left-0 top-0 flex flex-col"
        style={{ transform: `translateY(${-initial}em)` }}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} className="block h-[1em] leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Fundo de uma marca: foto, vídeo de arquivo, YouTube ou Vimeo, sempre mudo.
 *
 * O iframe do YouTube é 16:9 e não tem object-fit, então é esticado até a maior
 * das duas medidas e centralizado; o excesso é cortado pelo overflow da camada.
 * Vídeo só é montado quando `live` (seção na tela e camada ativa ou a anterior,
 * que ainda está sendo coberta pela varredura): com várias marcas, tocar tudo ao mesmo tempo
 * pesaria a página inteira.
 */
function BackgroundMedia({ url, live }: { url: string; live: boolean }) {
  const yt = url.match(
    /(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]+)/
  );
  const vm = url.match(/vimeo\.com\/(\d+)/);
  const isFile = /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);

  if (yt || vm || isFile) {
    if (!live) return null;
    if (isFile) {
      return (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={url}
          autoPlay
          muted
          loop
          playsInline
        />
      );
    }
    const src = yt
      ? `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&loop=1&playlist=${yt[1]}&controls=0&playsinline=1&modestbranding=1&rel=0&disablekb=1&iv_load_policy=3`
      : `https://player.vimeo.com/video/${vm![1]}?autoplay=1&muted=1&loop=1&background=1`;
    return (
      <iframe
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-video min-h-full min-w-full -translate-x-1/2 -translate-y-1/2"
        src={src}
        frameBorder={0}
        allow="autoplay; encrypted-media"
        title=""
        aria-hidden
        tabIndex={-1}
      />
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

/**
 * Em desenvolvimento, marca sem foto ganha uma foto aleatória para dar para
 * testar o efeito. Em produção nunca: o cliente veria uma foto que ninguém
 * escolheu.
 */
function photoOf(item: Item, i: number): string {
  if (item.photo) return item.photo;
  return process.env.NODE_ENV === "production"
    ? ""
    : `https://picsum.photos/seed/creative-${i + 1}/1600/900`;
}

export function IndexWipe({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  // Camadas com vídeo montado: a ativa e a anterior (ainda sendo coberta).
  const [history, setHistory] = useState([0]);
  const choose = (i: number) => {
    setActive(i);
    setHistory((h) => [i, ...h.filter((x) => x !== i)].slice(0, 2));
  };
  const root = useRef<HTMLDivElement>(null);
  // O vídeo só toca com a seção na tela: fora dela o iframe nem é criado, então
  // a página não baixa nem decodifica vídeo que ninguém está vendo.
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const prev = useRef(0);
  const z = useRef(1);

  // Rola o odômetro e varre a camada nova toda vez que o ativo muda.
  useGSAP(
    () => {
      if (!root.current || prev.current === active) return;
      const reduced = reducedMotion();
      const fromTop = active > prev.current; // descendo na lista: entra por cima
      const layer = root.current.querySelector<HTMLElement>(
        `[data-layer="${active}"]`
      );
      if (layer) {
        layer.style.zIndex = String(++z.current);
        const proxy = { p: reduced ? 1 : 0 };
        gsap.to(proxy, {
          p: 1,
          duration: reduced ? 0 : 0.9,
          ease: "power4.inOut",
          onUpdate: () => {
            layer.style.clipPath = polygon(proxy.p, fromTop);
          },
        });
        layer.style.clipPath = polygon(proxy.p, fromTop);
      }

      const tens = Math.floor((active + 1) / 10);
      const ones = (active + 1) % 10;
      const cols = root.current.querySelectorAll("[data-digit]");
      gsap.to(cols[0], { y: `${-tens}em`, duration: reduced ? 0 : 0.7, ease: "power3.inOut" });
      gsap.to(cols[1], { y: `${-ones}em`, duration: reduced ? 0 : 0.7, ease: "power3.inOut" });
      prev.current = active;
    },
    { scope: root, dependencies: [active] }
  );

  // No toque o ativo segue o scroll.
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = gsap.matchMedia();
      mm.add("(hover: none)", () => {
        root.current
          ?.querySelectorAll<HTMLElement>("[data-row]")
          .forEach((row, i) => {
            ScrollTrigger.create({
              trigger: row,
              start: "top 60%",
              end: "bottom 60%",
              onToggle: (self) => self.isActive && choose(i),
            });
          });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [items.length] }
  );

  if (items.length === 0) return null;

  return (
    <div
      ref={root}
      className="relative mt-20 ml-[calc(50%-50vw)] h-svh min-h-[32rem] w-screen overflow-hidden bg-[var(--brand-ink)] text-[var(--brand-cream)]"
    >
      {items.map((item, i) => (
        <div
          key={`${item.url}-${i}`}
          data-layer={i}
          aria-hidden
          className={`absolute inset-0 flex items-center justify-end overflow-hidden p-[max(1.5rem,calc((100vw-64rem)/2))] ${
            i % 2 === 0 ? "bg-[var(--brand-olive)]" : "bg-[var(--brand-ink)]"
          }`}
          style={{
            zIndex: i === 0 ? 1 : 0,
            clipPath: i === 0 ? "none" : polygon(0, true),
          }}
        >
          {photoOf(item, i) ? (
            <>
              <BackgroundMedia
                url={photoOf(item, i)}
                live={inView && history.includes(i)}
              />
              {/* Véu para o nome em creme ler sobre qualquer foto. */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
            </>
          ) : (
            // Sem foto o fundo é a cor da marca e o logo entra em branco.
            <img
              src={item.url}
              alt=""
              className="relative max-h-40 w-2/5 object-contain brightness-0 invert sm:max-h-64"
            />
          )}
        </div>
      ))}

      <ul className="relative z-[100] flex h-full max-w-[70%] flex-col justify-center gap-4 px-[max(1.5rem,calc((100vw-64rem)/2))] py-16 sm:max-w-[55%] sm:gap-8">
        {items.map((item, i) => (
          <li
            key={`${item.url}-${i}`}
            data-row
            onPointerEnter={(e) => e.pointerType === "mouse" && choose(i)}
          >
            <button
              type="button"
              onClick={() => choose(i)}
              className={`block text-left transition-opacity duration-300 ${
                i === active ? "opacity-100" : "opacity-35"
              }`}
            >
              {/* O logo é o rótulo: o nome cadastrado costuma ser o nome do
                  arquivo e não deve aparecer para o cliente. */}
              <img
                src={item.url}
                alt={item.name || `Cliente ${i + 1}`}
                className="h-14 w-auto max-w-full object-contain object-left brightness-0 invert sm:h-24"
              />
            </button>
          </li>
        ))}
      </ul>

      <p
        aria-label={`${active + 1} de ${items.length}`}
        className="absolute bottom-6 left-[max(1.5rem,calc((100vw-64rem)/2))] z-[100] text-sm font-bold tabular-nums"
      >
        <Digit initial={0} />
        <Digit initial={1} />
        <span className="opacity-50"> / {String(items.length).padStart(2, "0")}</span>
      </p>
    </div>
  );
}
