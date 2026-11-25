"use client";

import { useState } from "react";

export function CopyLinkButton({
  text,
  className = "border-neutral-300 text-neutral-700 hover:border-neutral-500",
}: {
  text: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      // Safari restrito pode recusar a escrita na área de transferência.
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`rounded-md border px-3 py-1.5 text-sm ${className}`}
    >
      {status === "copied" ? "Copiado" : status === "failed" ? "Copie à mão" : "Copiar link"}
    </button>
  );
}
