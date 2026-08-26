import { brand, brandDisplayFontFamily } from "@/lib/brand";

/**
 * Logo da instalação. O padrão é o nome da marca em texto — troque o corpo
 * deste componente por um `<svg>` (ou um `<Image>` apontando pra
 * `public/logo.svg`) quando o cliente entregar o wordmark definitivo.
 *
 * A cor vem de `currentColor` e o tamanho do container, então as chamadas
 * existentes (`className="h-9 w-auto text-black"`) continuam valendo.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center text-2xl font-bold tracking-tight leading-none ${className ?? ""}`}
      style={{ fontFamily: brandDisplayFontFamily }}
      role="img"
      aria-label={brand.name}
    >
      {brand.name}
    </span>
  );
}
