import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { connectInstagramAccount, readInstagramState } from "@/lib/instagram";

const DESTINATION = "/admin/clientes/instagram";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role === "client") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const back = (query: string) =>
    NextResponse.redirect(new URL(`${DESTINATION}?${query}`, request.url));

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const clientId = readInstagramState(params.get("state"));
  if (params.get("error") || !code) {
    return back(`ig_erro=${encodeURIComponent(params.get("error_description") ?? params.get("error") ?? "sem_codigo")}`);
  }
  if (!clientId) return back("ig_erro=estado_invalido");

  try {
    // O Instagram cola "#_" no fim do código; ele não faz parte.
    const username = await connectInstagramAccount(clientId, code.replace(/#_$/, ""), session.userId);
    return back(`ig_conectado=${encodeURIComponent(username)}`);
  } catch (error) {
    console.error("[instagram oauth callback]", error);
    return back(`ig_erro=${encodeURIComponent(error instanceof Error ? error.message : "erro_desconhecido")}`);
  }
}
