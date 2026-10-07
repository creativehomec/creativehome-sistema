import { ClipReveal } from "@/components/budget/motion/ClipReveal";
import { LightboxImage, type GalleryItem } from "@/components/LightboxImage";
import { SectionBlock, SectionHeading } from "@/components/budget/SectionShell";
import type { BlockTone, SectionData } from "@/lib/budgetSections";

/**
 * Os trabalhos já entregues. Cada projeto é uma imagem ou um vídeo, na
 * orientação que o material pede; as imagens abrem em lightbox e navegam entre
 * si, os vídeos tocam mudos em loop, como um portfólio de parede.
 */
export function PortfolioSection({
  data,
  tone,
  number,
}: {
  data: SectionData["portfolio"];
  tone: BlockTone;
  number: string;
}) {
  const images = data.projects.filter((p) => p.mediaType === "image");
  const gallery: GalleryItem[] = images.map((p, index) => ({
    id: `${p.url}-${index}`,
    src: p.url,
    alt: p.name || "Projeto",
    sourceUrl: null,
  }));

  return (
    <SectionBlock tone={tone}>
      {/* Mobile: título e cards empilhados. Do lg em diante o título fica
          preso à esquerda enquanto os cards rolam à direita. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            number={number}
            eyebrow={data.eyebrow}
            title={data.title}
            subtitle={data.subtitle}
            tone={tone}
          />
        </div>
        <div className="flex flex-col gap-14">
          {data.projects.map((project, index) => {
            const ratio =
              project.orientation === "vertical"
                ? "aspect-[9/16] max-w-sm"
                : "aspect-video";
            const imageIndex = images.indexOf(project);

            return (
              <div key={`${project.url}-${index}`} className="group">
                <ClipReveal className={ratio}>
                  {project.mediaType === "video" ? (
                    <video
                      className="h-full w-full object-cover"
                      src={project.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <LightboxImage
                      id={`${project.url}-${index}`}
                      src={project.url}
                      alt={project.name || "Projeto"}
                      sourceUrl={null}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      gallery={gallery}
                      index={imageIndex}
                    />
                  )}
                </ClipReveal>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <p className="flex items-baseline gap-2 text-lg font-bold">
                    <span className={`text-xs tabular-nums ${tone.textMuted}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {project.name || "Sem título"}
                  </p>
                  {project.tag ? (
                    <span className="rounded-full border border-current/30 px-3 py-1 text-xs uppercase tracking-widest">
                      {project.tag}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionBlock>
  );
}
