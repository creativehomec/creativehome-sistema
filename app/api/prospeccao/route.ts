import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import cidadesBr from "@/public/cidades-br.json";
import { CATEGORIAS_GMB } from "@/lib/categoriasGmb";
import { normalizarCidade, normalizarNicho } from "@/lib/normalizar";
import { salvarBusca } from "@/lib/prospeccao";
import { getAllowedFeatures, getCurrentSession } from "@/lib/session";

const run = promisify(execFile);

/** Pasta do google-maps-scraper-kit; só existe no Mac onde ele foi instalado. */
const KIT = process.env.GMAPS_KIT_DIR ?? join(homedir(), ".agents", "google-maps-scraper-kit");

const texto = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 80) : "");

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "login" }, { status: 401 });
  if (!(await getAllowedFeatures()).includes("prospeccao")) {
    return NextResponse.json({ error: "sem acesso" }, { status: 403 });
  }
  if (!existsSync(join(KIT, "scripts", "scrape.py"))) {
    return NextResponse.json({ error: "Scraper não instalado neste servidor. Use o sistema rodando no Mac." }, { status: 503 });
  }

  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const nichoBruto = texto(b?.nicho);
  const cidadeBruta = texto(b?.cidade);
  // Começar com "-" viraria flag do scrape.py.
  if (!nichoBruto || !cidadeBruta || nichoBruto.startsWith("-") || cidadeBruta.startsWith("-")) {
    return NextResponse.json({ error: "Preencha o quê e onde." }, { status: 400 });
  }
  // Corrige acento e erro de digitação antes de buscar e de guardar no histórico.
  const nicho = normalizarNicho(nichoBruto, CATEGORIAS_GMB);
  const cidade = normalizarCidade(cidadeBruta, cidadesBr);
  if (nicho.startsWith("-") || cidade.startsWith("-")) {
    return NextResponse.json({ error: "Preencha o quê e onde." }, { status: 400 });
  }
  const profundidade = [1, 3, 5].includes(Number(b?.profundidade)) ? Number(b?.profundidade) : 3;

  const dir = await mkdtemp(join(tmpdir(), "prospeccao-"));
  const out = join(dir, "leads.csv");
  const args = ["scripts/scrape.py", `${nicho} em ${cidade}`, "--city", cidade, "--lang", "pt", "--country", "br", "--out", out];
  args.push(...(b?.cidadeInteira ? ["--grid", "3", "--depth", "6"] : ["--depth", String(profundidade)]));
  const nota = Number(b?.minNota);
  if (nota >= 4 && nota <= 5) args.push("--min-rating", String(nota));
  if (b?.semSite) args.push("--no-website");
  if (b?.comTelefone) args.push("--has-phone");
  if (b?.comEmail) args.push("--has-email");

  try {
    await run("python3", ["scripts/engine.py", "start"], { cwd: KIT, timeout: 120_000 }).catch(() => {});
    await run("python3", args, { cwd: KIT, timeout: 580_000 });
    const csv = await readFile(out, "utf8");
    // Sem a migration 0075 aplicada o histórico falha, mas o resultado da busca não se perde.
    const total = Math.max(0, csv.trim().split("\n").length - 1);
    const id = await salvarBusca(session.userId, { nicho, cidade, total, csv }).catch(() => null);
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "X-Nicho": encodeURIComponent(nicho), "X-Cidade": encodeURIComponent(cidade), ...(id ? { "X-Busca-Id": id } : {}) } });
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : "falha";
    return NextResponse.json({ error: `A busca falhou: ${msg}` }, { status: 500 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
