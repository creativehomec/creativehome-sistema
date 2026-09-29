import { brand } from "@/lib/brand";

/**
 * Tela de abertura do app no iPhone. O `AdminLayout` espera a sessão do
 * Supabase antes de desenhar qualquer coisa, e o `loading.tsx` do segmento
 * `/admin` fica *dentro* desse layout — então só um boundary na raiz aparece
 * antes dessa espera. Sem ele o app aberto pela Tela de Início fica em branco
 * até a página inteira chegar.
 *
 * Mesmas cores do ícone e do `background_color` do manifest, pra transição
 * ícone → splash → painel não piscar.
 */
export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-[#a44a2b] text-white">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-white/10 text-5xl font-bold motion-safe:animate-pulse">
        {brand.name.charAt(0).toUpperCase()}
      </div>
      <p className="text-sm font-medium tracking-wide text-white/80">
        {brand.name}
      </p>
      <span className="sr-only" role="status">
        Carregando…
      </span>
    </div>
  );
}
