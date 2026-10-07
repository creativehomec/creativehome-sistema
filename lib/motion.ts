/**
 * Se a página deve ficar parada.
 *
 * Decisão do estúdio: a proposta anima por padrão, mesmo com "Reduzir
 * movimento" ligado no aparelho, porque o movimento é parte do que se vende.
 * Quem quiser o comportamento acessível padrão abre o link com `?movimento=0`,
 * e aí a opção do aparelho é respeitada.
 *
 * Só roda no navegador (lê `window`).
 */
export function reducedMotion(): boolean {
  if (new URLSearchParams(window.location.search).get("movimento") === "0") {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
}
