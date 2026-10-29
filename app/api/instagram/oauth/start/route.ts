import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { assertClientAllowed, getCurrentClientScope } from "@/lib/clientAccess";
import { buildInstagramAuthUrl } from "@/lib/instagram";

/** Abre o login do Instagram pra conectar a conta de um cliente. */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role === "client") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const clientId = request.nextUrl.searchParams.get("cliente");
  if (!clientId) {
    return NextResponse.redirect(new URL("/admin/clientes/instagram", request.url));
  }
  assertClientAllowed(await getCurrentClientScope(), clientId);
  return NextResponse.redirect(buildInstagramAuthUrl(clientId));
}
