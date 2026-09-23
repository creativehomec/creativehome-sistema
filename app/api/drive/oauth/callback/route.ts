import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { connectGoogleAccount } from "@/lib/googleDrive";

const DESTINATION = "/admin/galerias";

/**
 * Callback do Drive do estúdio — uma conta só, a que hospeda as galerias.
 *
 * A agenda pessoal saiu daqui e tem callback próprio: os dois fluxos agora
 * usam clients OAuth diferentes, cada um com sua URL de redirecionamento.
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(
        `${DESTINATION}?drive_error=${encodeURIComponent(reason)}`,
        request.url
      )
    );

  if (oauthError || !code) return fail(oauthError ?? "sem_codigo");

  try {
    await connectGoogleAccount(code);
  } catch (error) {
    console.error("[drive oauth callback]", error);
    return fail(error instanceof Error ? error.message : "erro_desconhecido");
  }

  return NextResponse.redirect(
    new URL(`${DESTINATION}?drive_connected=1`, request.url)
  );
}
