import { NextResponse } from "next/server";
import cidadesBr from "@/public/cidades-br.json";
import { CATEGORIAS_GMB } from "@/lib/categoriasGmb";
import { normalizarCidade, normalizarNicho } from "@/lib/normalizar";
import { salvarBusca, usuarioProspeccao } from "@/lib/prospeccao";
import { toLeads } from "@/lib/prospeccaoCsv";

/** O app do Mac roda o scraper e a página entrega o CSV aqui, pra entrar no histórico do usuário. */
export async function POST(request: Request) {
  const userId = await usuarioProspeccao();
  if (!userId) return NextResponse.json({ error: "sem acesso" }, { status: 401 });

  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const csv = typeof b?.csv === "string" ? b.csv : "";
  const nichoBruto = typeof b?.nicho === "string" ? b.nicho.trim().slice(0, 80) : "";
  const cidadeBruta = typeof b?.cidade === "string" ? b.cidade.trim().slice(0, 80) : "";
  if (!csv || csv.length > 3_000_000 || !nichoBruto || !cidadeBruta) {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  }
  const nicho = normalizarNicho(nichoBruto, CATEGORIAS_GMB);
  const cidade = normalizarCidade(cidadeBruta, cidadesBr);
  try {
    const id = await salvarBusca(userId, { nicho, cidade, total: toLeads(csv).length, csv });
    return NextResponse.json({ id });
  } catch {
    // Sem a migration 0075 o histórico falha, mas o resultado já está na tela.
    return NextResponse.json({ id: null });
  }
}
