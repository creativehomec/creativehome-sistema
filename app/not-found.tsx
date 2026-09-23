import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Sem esta rota o Next serve a 404 padrão dele: tela preta, texto em inglês
 * e nenhum caminho de volta. Quem cai aqui veio de um link velho ou de um
 * registro apagado, então o botão aponta pro Painel, que é de onde todo o
 * resto do sistema nasce.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <BrandLogo className="block h-[30px] w-auto text-white" />

      <div className="w-full rounded-lg bg-white/90 px-6 py-8 backdrop-blur-sm">
        <p className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
          Erro 404
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-900">
          Esta página não existe
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          O endereço pode ter mudado, ou o item que estava aqui foi apagado.
        </p>

        <Link
          href="/admin"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-terra-600 px-4 text-sm font-medium text-white transition-transform hover:bg-terra-700 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Voltar ao Painel
        </Link>
      </div>
    </main>
  );
}
