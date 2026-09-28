import { MobileOnboarding } from "@/components/admin/MobileOnboarding";
import { getCurrentSession } from "@/lib/session";

/**
 * Moldura única do painel. Antes cada página do admin montava o próprio
 * container e as três medidas que importam no celular — gutter lateral,
 * altura mínima e safe-area — divergiam de tela pra tela.
 *
 * Aqui ficam só as duas que valem pra todas: o gutter (`px-painel`, que já
 * respeita o notch) e a altura (`min-h-svh`, a altura *visível* no iOS, não
 * os 100vh que ficam por baixo da barra do Safari). A largura máxima continua
 * na página, porque um calendário de mês e um formulário de cadastro não têm
 * por que caber na mesma medida.
 *
 * É também o `<main>` do admin: antes daqui as páginas tinham HEADER e NAV e
 * nenhum landmark de conteúdo, então leitor de tela não achava o miolo e quem
 * usa teclado atravessava os treze links do menu de atalhos em toda
 * navegação. O link de pulo é o primeiro focável da página e só aparece
 * quando recebe foco.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getCurrentSession();
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-white focus:px-4 focus:text-sm focus:font-medium focus:text-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
      >
        Pular para o conteúdo
      </a>
      <main id="conteudo" className="flex min-h-svh flex-1 flex-col px-painel">
        {children}
        {/* Passo a passo da primeira vez no celular: instalar na Tela de Início
            e ligar as notificações. Sem sessão não há pra quem notificar. */}
        {session ? <MobileOnboarding /> : null}
      </main>
    </>
  );
}
