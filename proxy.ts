import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, getSession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const secret = process.env.ADMIN_PASSWORD;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const session = secret ? await getSession(cookie, secret) : null;

  // O manifesto é buscado pelo navegador sem sessão, para instalar o portal.
  if (request.nextUrl.pathname === "/cliente/manifest.webmanifest") {
    return NextResponse.next();
  }

  const isPortal = request.nextUrl.pathname.startsWith("/cliente");
  const home = session?.role === "client" ? "/cliente" : "/admin";

  if (isLoginPage) {
    if (session) {
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    // Com a busca: `/previa?cliente=X` sem ela voltava do login sem cliente.
    loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Cliente só existe no portal; o resto do sistema é interno.
  if (session.role === "client" && !isPortal) {
    return NextResponse.redirect(new URL("/cliente", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cliente/:path*"],
};
