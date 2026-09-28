import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

/**
 * Existe pro iPhone: só com o painel adicionado à Tela de Início, aberto como
 * app (`standalone`), o iOS entrega notificações push.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.productName,
    short_name: brand.name,
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#a44a2b",
    theme_color: "#a44a2b",
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
