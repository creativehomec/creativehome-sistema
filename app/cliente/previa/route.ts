import { NextResponse } from "next/server";
import { PREVIEW_COOKIE } from "@/lib/clientPortal";
import { getCurrentSession } from "@/lib/session";

/**
 * "Ver como o cliente": o admin escolhe um cliente e passa a ver o portal
 * dele, só leitura, sem trocar de login. `?sair=1` volta pro calendário.
 *
 * Esta rota grava e apaga cookie, então pré-carga não pode chegar aqui: o
 * Next pré-carrega sozinho os <Link> que aparecem na tela, e cada pré-carga
 * da lista de clientes gravava um cliente (valia o último da lista) e a do
 * botão Voltar apagava a escolha. Por isso a pré-carga sai antes de tudo, sem
 * efeito, e os links pra cá são <a> comuns.
 */
function isPrefetch(request: Request) {
  const h = request.headers;
  return (
    h.has("next-router-prefetch") ||
    h.get("purpose") === "prefetch" ||
    (h.get("sec-purpose") ?? "").includes("prefetch")
  );
}

export async function GET(request: Request) {
  if (isPrefetch(request)) {
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }
  const url = new URL(request.url);
  const session = await getCurrentSession();
  // Equipe toda (admin e membro).
  if (!session || session.role === "client") {
    return NextResponse.redirect(new URL("/admin/login", url));
  }

  if (url.searchParams.get("sair")) {
    const was = request.headers.get("cookie")?.match(/portal_preview=([^;]+)/)?.[1];
    const response = NextResponse.redirect(
      new URL(was ? `/admin/area-do-cliente/${was}` : "/admin/area-do-cliente", url)
    );
    response.cookies.delete(PREVIEW_COOKIE);
    return response;
  }

  const clientId = url.searchParams.get("cliente") ?? "";
  if (!clientId) {
    return NextResponse.redirect(new URL("/cliente/escolher", url));
  }
  const response = NextResponse.redirect(new URL("/cliente", url));
  response.cookies.set(PREVIEW_COOKIE, clientId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // 30 dias: reabrir o app instalado volta pro mesmo cliente, sem escolher de novo.
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
