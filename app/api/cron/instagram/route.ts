import { NextResponse, type NextRequest } from "next/server";
import { runInstagramQueue } from "@/lib/instagram";

export const maxDuration = 60;

/** Chamado a cada 5 min pelo pg_cron do Supabase (Hobby da Vercel só roda
 * cron uma vez por dia). O pedido manda o CRON_SECRET no Authorization. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const handled = await runInstagramQueue();
  return NextResponse.json({ handled });
}
