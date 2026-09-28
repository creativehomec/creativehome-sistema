import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { connectUserCalendar, getUserCalendarAccount } from "@/lib/userCalendars";
import { clearCalendarCache, syncAllCardsToAccount } from "@/lib/googleCalendar";

const DESTINATION = "/admin/agenda";

/**
 * Callback da agenda pessoal.
 *
 * Nasceu separado do callback do Drive quando os dois fluxos passaram a ter
 * clients OAuth distintos: com URLs de redirecionamento próprias, o `state`
 * que dizia qual fluxo estava voltando perdeu a função.
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
        `${DESTINATION}?agenda_error=${encodeURIComponent(reason)}`,
        request.url
      )
    );

  // `access_denied` é a pessoa clicando "Cancelar" na tela do Google: não é
  // falha do sistema, e tratar junto com erro de token daria uma mensagem
  // assustadora pra uma desistência.
  if (oauthError) return fail(oauthError);
  if (!code) return fail("sem_codigo");

  try {
    await connectUserCalendar(session.userId, code);
    // Pode ser outra conta Google que acabou de entrar: a lista de agendas
    // guardada em memória é da anterior.
    clearCalendarCache(session.userId);
    const account = await getUserCalendarAccount(session.userId);
    // Agenda recém-conectada começa vazia; carrega de uma vez o que já tem
    // data pra pessoa não achar que não funcionou.
    if (account) await syncAllCardsToAccount(account);
  } catch (error) {
    console.error("[calendar oauth callback]", error);
    return fail(error instanceof Error ? error.message : "erro_desconhecido");
  }

  return NextResponse.redirect(
    new URL(`${DESTINATION}?agenda_conectada=1`, request.url)
  );
}
