/**
 * Landmark único do admin.
 *
 * Antes daqui as páginas tinham HEADER e NAV mas nenhum `<main>`: leitor de
 * tela não achava o conteúdo e quem usa teclado atravessava os treze links
 * do menu de atalhos em toda navegação. O link de pulo é o primeiro
 * focável da página e só aparece quando recebe foco.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-white focus:px-4 focus:text-sm focus:font-medium focus:text-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
      >
        Pular para o conteúdo
      </a>
      <main id="conteudo" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
    </>
  );
}
