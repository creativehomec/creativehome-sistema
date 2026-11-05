"use client";

import { Download, Loader2, Search } from "lucide-react";
import { useState } from "react";

const campo = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm";

export function ProspeccaoForm() {
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ url: string; nome: string; linhas: number } | null>(null);

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
      const blob = await res.blob();
      const texto = await blob.text();
      const linhas = Math.max(0, texto.trim().split("\n").length - 1);
      const nome = `${String(f.get("nicho")).trim()}-${String(f.get("cidade")).trim()}.csv`.replace(/\s+/g, "-");
      setResultado({ url: URL.createObjectURL(blob), nome, linhas });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha na busca");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={buscar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          O quê
          <input name="nicho" required maxLength={80} placeholder="dentistas, academias, restaurantes…" className={campo} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Onde
          <input name="cidade" required maxLength={80} placeholder="Curitiba, PR" className={campo} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Quantidade
          <select name="profundidade" defaultValue="3" className={campo}>
            <option value="1">~20 empresas</option>
            <option value="3">~60 empresas</option>
            <option value="5">~100 empresas</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Nota mínima
          <select name="minNota" defaultValue="0" className={campo}>
            <option value="0">Qualquer</option>
            <option value="4">4,0 ou mais</option>
            <option value="4.5">4,5 ou mais</option>
          </select>
        </label>
      </div>
      <fieldset className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="semSite" /> Só quem não tem site</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="comTelefone" /> Só com telefone</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="comEmail" /> Só com e-mail</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="cidadeInteira" /> Cidade inteira (mais lento)</label>
      </fieldset>
      <button
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Search aria-hidden="true" className="size-4" />}
        {busy ? "Buscando… pode levar alguns minutos" : "Buscar"}
      </button>
      {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}
      {resultado && (
        <a
          href={resultado.url}
          download={resultado.nome}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium"
        >
          <Download aria-hidden="true" className="size-4" /> Baixar planilha ({resultado.linhas} empresas)
        </a>
      )}
    </form>
  );
}
