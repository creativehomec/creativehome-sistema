import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone da Tela de Início no iPhone: a inicial da marca em branco sobre o terracota. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#a44a2b",
          color: "#ffffff",
          fontSize: 120,
          fontWeight: 700,
        }}
      >
        {brand.name.charAt(0).toUpperCase()}
      </div>
    ),
    size
  );
}
