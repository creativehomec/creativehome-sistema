import { brand } from "@/lib/brand";

/**
 * Manifesto do portal: é o que faz o ícone da Tela de Início abrir direto no
 * portal do cliente (e o que o iPhone exige para entregar notificações).
 */
export function GET() {
  return Response.json(
    {
      name: `Portal do cliente — ${brand.name}`,
      short_name: brand.name,
      start_url: "/cliente",
      scope: "/",
      display: "standalone",
      // Topo do degradê do portal: a abertura e a barra do app instalado
      // ficam escuras como a tela, sem piscar creme.
      background_color: "#1d0f0a",
      theme_color: "#1d0f0a",
      icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}
