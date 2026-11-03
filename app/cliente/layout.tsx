import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { cookies } from "next/headers";
import { BrandLogo } from "@/components/BrandLogo";
import { logout } from "@/app/admin/login/actions";
import { PREVIEW_COOKIE } from "@/lib/clientPortal";
import { getCurrentSession, getCurrentUsername } from "@/lib/session";
import { PortalNav } from "./PortalNav";
import { PortalTransition } from "./PortalTransition";
import { pContainer } from "./portalUi";
import { brand } from "@/lib/brand";

export const metadata = {
  title: `Portal do cliente — ${brand.name}`,
  manifest: "/cliente/manifest.webmanifest",
};

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  // Cookie sozinho não basta: um cliente que entra num navegador onde o admin
  // usou a prévia veria o botão Voltar da equipe e ficaria sem o botão Sair.
  const session = await getCurrentSession();
  const role = session?.role;
  const preview = Boolean(role && role !== "client" && (await cookies()).get(PREVIEW_COOKIE)?.value);
  const username = session ? await getCurrentUsername() : null;

  return (
    <div
      // Gutter único do portal: 1,25rem, ou a área segura do iPhone (notch,
      // laterais em paisagem) quando ela for maior. O carrossel de arquivos
      // usa a mesma variável pra sangrar até a borda sem passar dela.
      //
      // Tokens do portal: o degradê da marca de fundo inteiro, texto creme e
      // as superfícies de vidro. Ficam aqui, e não no globals, para não vazar
      // pro admin.
      style={
        {
          "--gutter": "max(1.25rem, env(safe-area-inset-left), env(safe-area-inset-right))",
          "--portal-grad": "linear-gradient(170deg, #1d0f0a 0%, var(--brand-ink) 45%, var(--brand-olive) 100%)",
          "--p-text": "var(--brand-cream)",
          "--p-muted": "rgb(251 241 230 / 0.82)",
          "--p-line": "rgb(251 241 230 / 0.2)",
          "--p-glass": "rgb(58 31 20 / 0.5)",
        } as React.CSSProperties
      }
      className="relative isolate min-h-svh bg-[var(--brand-ink)] text-[var(--p-text)] selection:bg-[var(--brand-olive)] selection:text-[var(--brand-cream)]"
    >
      {/* O degradê vive numa camada fixa do tamanho da tela. Antes ele era o
          fundo da página inteira: ao abrir um dropdown a página crescia, o
          degradê esticava junto e a cor de fundo parecia mudar. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[image:var(--portal-grad)]" />
      {/* Celular: logo e conta. Tela média pra cima: logo | abas no centro | conta. */}
      <header className={`${pContainer} flex items-center justify-between gap-3 pt-[max(1rem,env(safe-area-inset-top))] md:pt-8 lg:grid lg:grid-cols-[1fr_auto_1fr]`}>
        <div className="flex items-center gap-2">
          {preview ? (
            // Voltar ao painel: ícone de seta ao lado do logo, sem texto.
            <Link
              href="/cliente/previa?sair=1"
              aria-label="Voltar ao painel"
              className="grid size-10 place-items-center text-[var(--p-text)] active:opacity-70"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
          ) : null}
          {/* Logo creme direto no degradê, sem chip: a cor vem de currentColor. */}
          <BrandLogo className="h-5 w-auto text-[var(--brand-cream)]" />
        </div>
        <div className="hidden lg:block">
          <PortalNav />
        </div>
        <div className="flex min-w-0 items-center gap-3 lg:justify-self-end">
          {username ? (
            <span className="min-w-0 truncate text-xs text-[var(--p-muted)]" title={username}>
              {username}
            </span>
          ) : null}
          {preview ? null : (
            <form action={logout}>
              <button className="min-h-11 px-1 text-xs text-[var(--p-muted)] underline-offset-4 hover:text-[var(--p-text)] hover:underline">
                Sair
              </button>
            </form>
          )}
        </div>
      </header>

      <main className={`${pContainer} pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 md:pt-10 lg:pb-16`}>{children}</main>

      <div className="lg:hidden">
        <PortalNav floating />
      </div>

      <Suspense fallback={null}>
        <PortalTransition />
      </Suspense>
    </div>
  );
}
