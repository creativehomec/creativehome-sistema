import { NextResponse } from "next/server";
import { applyReading, type ReadVolume } from "@/lib/armazenamento";
import { getAllowedFeatures, getCurrentSession } from "@/lib/session";

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);

/** O app do Mac manda o que leu dos discos conectados; a sessão é a do WebView logado. */
export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "login" }, { status: 401 });
  // Quem não tem a área liberada em /admin/usuarios não grava nela por aqui também.
  if (!(await getAllowedFeatures()).includes("armazenamento")) {
    return NextResponse.json({ error: "sem acesso" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { volumes?: unknown } | null;
  if (!body || !Array.isArray(body.volumes)) return NextResponse.json({ error: "corpo" }, { status: 400 });

  const volumes: ReadVolume[] = [];
  for (const raw of body.volumes as Record<string, unknown>[]) {
    if (!raw || typeof raw !== "object") continue;
    const capacityGb = num(raw.capacityGb);
    const usedGb = num(raw.usedGb);
    const key = String(raw.key ?? "").trim();
    const name = String(raw.name ?? "").trim();
    if (!key || !name || !capacityGb || usedGb === null) continue;
    const folders = Array.isArray(raw.folders)
      ? (raw.folders as Record<string, unknown>[])
          .filter((f) => f && typeof f === "object")
          .map((f) => ({
            name: String(f.name ?? "").trim(),
            sizeGb: num(f.sizeGb) ?? 0,
            subfolders: Array.isArray(f.subfolders)
              ? (f.subfolders as Record<string, unknown>[])
                  .filter((x) => x && typeof x === "object")
                  .map((x) => ({ name: String(x.name ?? "").trim(), sizeGb: num(x.sizeGb) ?? 0 }))
                  .filter((x) => x.name)
                  .slice(0, 40)
              : [],
          }))
          .filter((f) => f.name)
      : undefined;
    volumes.push({ key, name, capacityGb, usedGb, folders });
  }

  try {
    await applyReading(volumes);
  } catch {
    return NextResponse.json({ error: "servidor" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, volumes: volumes.length });
}
