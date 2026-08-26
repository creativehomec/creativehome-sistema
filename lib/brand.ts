/**
 * Ponto único de identidade da instalação (white label).
 *
 * Tudo que muda de cliente pra cliente mora aqui ou nas variáveis
 * `--brand-*` em `app/globals.css`. Nenhum outro arquivo deve escrever o
 * nome da marca, o link de contato ou as cores direto no código.
 *
 * Valores podem vir do ambiente pra permitir a mesma build servir marcas
 * diferentes; o fallback é o que está escrito aqui.
 */
function withProtocol(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const brand = {
  /** Nome curto, usado no logo, cabeçalhos e rodapés. */
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "CreativeHome",
  /** Razão social ou nome por extenso, usado em documentos gerados. */
  legalName: process.env.NEXT_PUBLIC_BRAND_LEGAL_NAME ?? "CreativeHome",
  /** Título do produto (aba do navegador, metadata). */
  productName:
    process.env.NEXT_PUBLIC_BRAND_PRODUCT_NAME ?? "Guia de Captação",
  /** Descrição usada na metadata das páginas. */
  description:
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ??
    "Guias de gravação: roteiros, referências e checklist por projeto.",
  /**
   * Link de contato exibido no orçamento público e no PDF. Sem protocolo o
   * href vira relativo e o link quebra, então normaliza aqui.
   */
  contactUrl: withProtocol(process.env.NEXT_PUBLIC_BRAND_CONTACT_URL ?? ""),
  /**
   * Fonte de display da página pública de orçamento. Deixe vazio pra usar a
   * fonte padrão do sistema; pra usar uma fonte própria, coloque o arquivo em
   * `public/fonts/` e declare o `@font-face` em `app/globals.css`.
   */
  displayFont: process.env.NEXT_PUBLIC_BRAND_DISPLAY_FONT ?? "",
} as const;

/** Família CSS pronta pro `style={{ fontFamily }}` do título de display. */
export const brandDisplayFontFamily = brand.displayFont
  ? `${brand.displayFont}, sans-serif`
  : "inherit";

/** Frase de autoria nos documentos gerados (orçamento web e PDF). */
export const brandGeneratedBy = `Proposta gerada por ${brand.legalName}`;
