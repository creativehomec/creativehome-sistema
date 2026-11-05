"use client";

import { History, Loader2, Search, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { abrirBuscaAction, apagarBuscaAction, marcarContatadoAction } from "@/app/admin/prospeccao/actions";
import { ProspeccaoResultados, idDe } from "@/components/admin/ProspeccaoResultados";
import type { BuscaResumo } from "@/lib/prospeccao";
import { toLeads, type Lead } from "@/lib/prospeccaoCsv";

const controle =
  "min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base focus:border-neutral-500 focus:outline-none";
const foco =
  "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none";

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Resultado = { csv: Blob; nome: string; leads: Lead[] };

const quando = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function ProspeccaoForm({ historico, contatados: iniciais }: { historico: BuscaResumo[]; contatados: string[] }) {
  const router = useRouter();
  const [contatados, setContatados] = useState(() => new Set(iniciais));
  const [cidades, setCidades] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    fetch("/cidades-br.json").then((r) => r.json()).then(setCidades).catch(() => {});
  }, []);

  async function buscar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErro(null);
    setResultado(null);
    try {
      const res = await fetch("/api/prospeccao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nicho: f.get("nicho"),
          cidade: f.get("cidade"),
          profundidade: Number(f.get("profundidade")),
          minNota: Number(f.get("minNota")) || 0,
          semSite: f.get("semSite") === "on",
          comTelefone: f.get("comTelefone") === "on",
          comEmail: f.get("comEmail") === "on",
          cidadeInteira: f.get("cidadeInteira") === "on",
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `Erro ${res.status}`);
      }
      const csv = await res.blob();
      router.refresh(); // recarrega o histórico, que o servidor acabou de gravar
      setResultado({
        csv,
        nome: `${slug(String(f.get("nicho")))}-${slug(String(f.get("cidade")))}.csv`,
        leads: toLeads(await csv.text()),
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha na busca");
    } finally {
      setBusy(false);
    }
  }

  async function abrir(b: BuscaResumo) {
    setErro(null);
    const texto = await abrirBuscaAction(b.id);
    if (texto === null) return setErro("Não consegui abrir essa busca.");
    setResultado({ csv: new Blob([texto], { type: "text/csv" }), nome: `${slug(b.nicho)}-${slug(b.cidade)}.csv`, leads: toLeads(texto) });
  }

  async function apagar(b: BuscaResumo) {
    if (await apagarBuscaAction(b.id)) router.refresh();
    else setErro("Não consegui apagar essa busca.");
  }

  async function marcar(l: Lead) {
    const id = idDe(l);
    const marcar = !contatados.has(id);
    const aplicar = (on: boolean) =>
      setContatados((atual) => {
        const novo = new Set(atual);
        if (on) novo.add(id);
        else novo.delete(id);
        return novo;
      });
    aplicar(marcar);
    if (!(await marcarContatadoAction(id, marcar))) {
      aplicar(!marcar);
      setErro("Não consegui salvar a marcação. Tente de novo.");
    }
  }

  function baixar() {
    if (!resultado) return;
    const url = URL.createObjectURL(resultado.csv);
    const a = Object.assign(document.createElement("a"), { href: url, download: resultado.nome });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={buscar} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-neutral-800">
            O quê
            <input name="nicho" required maxLength={80} placeholder="dentistas, academias, restaurantes…" className={controle} />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-neutral-800">
            Onde
            <input
              name="cidade"
              required
              maxLength={80}
              list="cidades-br"
              autoComplete="off"
              placeholder="Curitiba, PR"
              className={controle}
            />
            <datalist id="cidades-br">
              {cidades.map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-neutral-800">
            Quantidade
            <select name="profundidade" defaultValue="3" className={controle}>
              <option value="1">~20 empresas</option>
              <option value="3">~60 empresas</option>
              <option value="5">~100 empresas</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-neutral-800">
            Nota mínima
            <select name="minNota" defaultValue="0" className={controle}>
              <option value="0">Qualquer</option>
              <option value="4">4,0 ou mais</option>
              <option value="4.5">4,5 ou mais</option>
            </select>
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-neutral-800">Filtros</legend>
          <div className="flex flex-wrap gap-2">
            {[
              ["semSite", "Só quem não tem site"],
              ["comTelefone", "Só com telefone"],
              ["comEmail", "Só com e-mail"],
              ["cidadeInteira", "Cidade inteira (mais lento)"],
            ].map(([nome, rotulo]) => (
              <label
                key={nome}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 text-base has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-900 has-[:focus-visible]:ring-offset-2"
              >
                <input type="checkbox" name={nome} className="size-4 accent-neutral-900 focus:outline-none" />
                {rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={busy}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-neutral-900 px-5 text-base font-medium text-white transition-transform active:scale-[0.97] disabled:opacity-60 ${foco}`}
          >
            {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Search aria-hidden="true" className="size-4" />}
            {busy ? "Buscando…" : "Buscar"}
          </button>
          <p role="status" className="text-sm text-neutral-600">
            {busy && "Pode levar de 1 a 5 minutos. Não feche esta página."}
          </p>
        </div>

        {erro && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {erro}
          </p>
        )}
      </form>

            {historico.length > 0 && (
        <section aria-label="Buscas recentes" className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-800">
            <History aria-hidden="true" className="size-4" /> Buscas recentes
            <span className="font-normal text-neutral-500">· ficam guardadas por 30 dias</span>
          </h2>
          <ul className="divide-y divide-neutral-100">
            {historico.map((b) => (
              <li key={b.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => abrir(b)}
                  className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 rounded px-1 text-left text-base hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none"
                >
                  <span className="truncate">{b.nicho} · {b.cidade}</span>
                  <span className="shrink-0 text-sm text-neutral-500 tabular-nums">{b.total} · {quando(b.criadaEm)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => apagar(b)}
                  aria-label={`Apagar busca ${b.nicho} em ${b.cidade}`}
                  className="grid size-11 shrink-0 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resultado && <ProspeccaoResultados leads={resultado.leads} contatados={contatados} onMarcar={marcar} onBaixar={baixar} />}
    </div>
  );
}

