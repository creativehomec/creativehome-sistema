import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { brand } from "@/lib/brand";

/**
 * Moldura das páginas públicas de política e termos.
 *
 * Elas existem porque o Google exige os dois links para publicar o app OAuth,
 * e precisam abrir sem login: o revisor do Google não tem conta no sistema.
 * Nenhuma delas fica sob `/admin`, então o `<main>` de lá não as cobre — daí
 * o landmark próprio aqui.
 */
export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <Link
          href="/"
          aria-label={`Início — ${brand.name}`}
          className="inline-block rounded-lg px-4 py-2 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <BrandLogo className="block h-[30px] w-auto text-white" />
        </Link>
      </header>

      <main className="rounded-lg bg-white/90 px-6 py-8 backdrop-blur-sm sm:px-10 sm:py-10">
        {children}

        <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-200 pt-6 text-sm">
          <Link href="/privacidade" className="text-neutral-600 hover:text-neutral-900">
            Política de Privacidade
          </Link>
          <Link href="/termos" className="text-neutral-600 hover:text-neutral-900">
            Termos de Serviço
          </Link>
          {brand.contactUrl ? (
            <a
              href={brand.contactUrl}
              className="text-neutral-600 hover:text-neutral-900"
            >
              Contato
            </a>
          ) : null}
        </nav>
      </main>
    </div>
  );
}
