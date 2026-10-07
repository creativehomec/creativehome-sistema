"use client";

import { useRef } from "react";

function embedUrl(url: string): string {
  const yt = url.match(
    /(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]+)/
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&playsinline=1`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
  return "";
}

/**
 * "Play reel": abre o reel completo, com som e controles, num diálogo.
 * O iframe só nasce ao abrir e morre ao fechar — assim o vídeo para de tocar
 * (e de gastar banda) quando o leitor fecha.
 */
export function ReelButton({
  url,
  className = "",
}: {
  url: string;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const embed = embedUrl(url);
  const isFile = !embed && /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);
  if (!embed && !isFile) return null;

  const open = () => {
    if (frame.current) {
      // DOM em vez de innerHTML: a URL do arquivo vem de campo de texto livre.
      const el = document.createElement(embed ? "iframe" : "video");
      el.className = "h-full w-full";
      if (el instanceof HTMLIFrameElement) {
        el.src = embed;
        el.allow = "autoplay; fullscreen; encrypted-media";
        el.allowFullscreen = true;
        el.title = "Reel";
      } else {
        el.src = url;
        el.controls = true;
        el.autoplay = true;
        el.playsInline = true;
      }
      frame.current.replaceChildren(el);
    }
    dialog.current?.showModal();
  };
  const onClose = () => {
    if (frame.current) frame.current.replaceChildren();
  };

  return (
    <>
      <button type="button" onClick={open} className={className}>
        ▶ Play reel
      </button>
      <dialog
        ref={dialog}
        onClose={onClose}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(92vw,1100px)] rounded-3xl bg-black p-0 backdrop:bg-black/80"
      >
        <div ref={frame} className="aspect-video w-full overflow-hidden rounded-3xl" />
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="absolute right-3 top-3 rounded-full bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
        >
          Fechar
        </button>
      </dialog>
    </>
  );
}
