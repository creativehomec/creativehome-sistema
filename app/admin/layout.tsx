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
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getCurrentSession();
  return (
    <div className="flex min-h-svh flex-1 flex-col px-painel">
      {children}
      {/* Passo a passo da primeira vez no celular: instalar na Tela de Início
          e ligar as notificações. Sem sessão não há pra quem notificar. */}
      {session ? <MobileOnboarding /> : null}
    </div>
  );
}
