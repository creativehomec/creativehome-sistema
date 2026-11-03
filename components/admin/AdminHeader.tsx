import { ChevronLeft, Home } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/admin/login/actions";
import { AdminNavMenu } from "@/components/admin/AdminNavMenu";
import { LiveRefresh } from "@/components/admin/LiveRefresh";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { BrandLogo } from "@/components/BrandLogo";
import {
  countUnreadNotifications,
  listNotifications,
} from "@/lib/notifications";
import { getAllowedFeatures, getCurrentSession } from "@/lib/session";

export type BreadcrumbItem = {
  label: string;
  /** Sem href = página atual (último item da trilha). */
  href?: string;
};

const FOCUS_RING =
  "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none";

export async function AdminHeader({
  title,
  trail,
  username,
  dense = false,
}: {
  title: string;
  trail?: BreadcrumbItem[];
  username?: string | null;
  /**
   * Versão baixa do cabeçalho, pra tela que é ferramenta e não documento: o
   * título sai (a trilha já nomeia a página) e a folga encolhe, porque cada
   * faixa aqui em cima é faixa a menos pra área de trabalho no celular.
   */
  dense?: boolean;
}) {
  // A campainha é buscada aqui, e não em cada página, pra aparecer igual em
  // todo o admin sem repetir a consulta em dez lugares.
  const session = await getCurrentSession();
  const features = await getAllowedFeatures();
  const [notifications, unreadCount] = session
    ? await Promise.all([
        listNotifications(session.userId),
        countUnreadNotifications(session.userId),
      ])
    : [[], 0];

  if (dense) {
    return (
      <header className="mb-3">
        <LiveRefresh />
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/admin"
            aria-label="Ir para o Painel"
            className={`grid size-10 place-items-center rounded-md text-neutral-600 transition-transform hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 ${FOCUS_RING}`}
          >
            <Home aria-hidden="true" className="size-5" />
          </Link>

          <BrandLogo className="block h-[26px] w-auto text-black" />

          <form action={logout}>
            <button
              type="submit"
              className={`flex h-10 items-center rounded-md border border-neutral-300 px-3 text-sm text-neutral-600 transition-transform hover:bg-neutral-50 hover:text-neutral-900 active:scale-95 ${FOCUS_RING}`}
            >
              Sair
            </button>
          </form>
        </div>
        {/* O nome da tela continua para quem usa leitor de tela. */}
        <h1 className="sr-only">{title}</h1>
      </header>
    );
  }

  return (
    <header className="mb-8">
      {/* Todo o admin fica montado sob este header, então é daqui que sai a
          sincronização com o que os outros usuários estão fazendo. */}
      <LiveRefresh />
      {/* O logo é a volta pro Painel de qualquer página — é onde todo mundo
          clica esperando ir pra home. */}
      <Link
        href="/admin"
        aria-label="Ir para o Painel"
        className={`mx-auto mb-4 block w-fit rounded-lg px-4 py-2 ${FOCUS_RING}`}
      >
        <BrandLogo className="block h-[30px] w-auto text-white" />
      </Link>

      {/* Trilha, ações e título ficam sobre o gradiente marrom do body, então
          herdam a mesma superfície branca translúcida do logo acima — as
          cores neutral-* do resto do app assumem fundo branco (ver
          globals.css) e ficavam ilegíveis direto no gradiente. */}
      <div className="rounded-lg bg-white/90 px-4 py-3 backdrop-blur-sm">
        {/* Trilha (ou título, sem trilha) e ações na mesma linha, mesmo eixo
            Y — com trilha, ela já diz onde a pessoa está, então o h1
            repetindo o mesmo nome embaixo só ocupava espaço. */}
        <div className="flex items-center justify-between gap-4">
          {trail?.length ? (
            // O menu substitui a trilha: o botão nomeia a página atual e abre
            // as áreas. Só páginas fundas (Guias > um guia) ganham o "voltar"
            // para o nível de cima, que o menu não cobre.
            <div className="flex min-w-0 items-center gap-2">
              {trail.length > 2 && trail[trail.length - 2].href ? (
                <Link
                  href={trail[trail.length - 2].href!}
                  aria-label={`Voltar para ${trail[trail.length - 2].label}`}
                  className={`flex shrink-0 items-center gap-0.5 rounded-md bg-neutral-100 py-1 pr-2.5 pl-1.5 text-[13px] text-neutral-600 transition-transform hover:bg-neutral-200 active:scale-[0.97] pointer-coarse:min-h-11 ${FOCUS_RING}`}
                >
                  <ChevronLeft aria-hidden="true" className="size-3.5" />
                  {trail[trail.length - 2].label}
                </Link>
              ) : null}
              <AdminNavMenu
                current={trail[trail.length - 1].label}
                features={features}
                isAdmin={session?.role === "admin"}
              />
            </div>
          ) : (
            <h1 className="min-w-0 truncate text-xl leading-tight font-semibold tracking-tight text-neutral-900">
              {title}
            </h1>
          )}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {username ? (
              <span className="hidden text-sm text-neutral-500 sm:inline">
                {username}
              </span>
            ) : null}
            {session ? (
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
              />
            ) : null}
            {/* Borda pra separar do nome ao lado: sem ela os dois eram o mesmo
                cinza e nada dizia qual era clicável. Sem confirmação de
                propósito — deslogar é reversível, e diálogo em ação reversível
                treina a pessoa a clicar sem ler. */}
            <form action={logout}>
              <button
                type="submit"
                className={`flex items-center rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition-transform hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97] pointer-coarse:min-h-11 ${FOCUS_RING}`}
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
