import { NextResponse, type NextRequest } from "next/server";
import { runInstagramQueue } from "@/lib/instagram";

export const maxDuration = 300;

/** Chamado pelo cron da Vercel (vercel.json). A Vercel manda o CRON_SECRET. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const handled = await runInstagramQueue();
  return NextResponse.json({ handled });
}
