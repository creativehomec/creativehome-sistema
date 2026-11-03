/**
 * Para onde voltar depois do login. Só aceita caminho interno: sem isso,
 * `/admin/login?next=https://outro-site` levava quem acabou de entrar para
 * fora do sistema. "//site" e "/\site" o navegador lê como outro domínio.
 * Voltar para `/cliente/sair` desfaria o login na hora, então também cai no padrão.
 */
export function safeNext(next: string | null | undefined, fallback = "/admin"): string {
  const path = (next ?? "").trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path === "/cliente/sair" || path.startsWith("/cliente/sair?") || path.startsWith("/cliente/sair/")) return fallback;
  return path;
}
