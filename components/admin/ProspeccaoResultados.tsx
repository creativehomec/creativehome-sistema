"use client";

import { ArrowUpDown, AtSign, ChevronDown, ChevronUp, Download, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Lead } from "@/lib/prospeccaoCsv";

const LOTE = 20;
const foco =
  "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none";
const link = `rounded text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 ${foco}`;

type Contatados = Set<string>;
const FILTROS = {
  instagram: { campo: "Tem", rotulo: "Instagram", ok: (l: Lead) => !!l.instagram },
  email: { campo: "Tem", rotulo: "E-mail", ok: (l: Lead) => !!l.email },
  telefone: { campo: "Tem", rotulo: "Telefone", ok: (l: Lead) => !!l.telefone },
  semSite: { campo: "Site", rotulo: "Não tem", ok: (l: Lead) => !l.site },
  naoContatado: { campo: "Contato", rotulo: "Ainda não", ok: (l: Lead, c: Contatados) => !c.has(idDe(l)) },
} as const;

type FiltroKey = keyof typeof FILTROS;

/** Mesma empresa em buscas diferentes tem o mesmo nome e endereço. */
export const idDe = (l: Lead) => `${l.nome}|${l.endereco}`;

type Ordem = "nome" | "nota" | "avaliacoes";
const num = (s: string) => Number(s.replace(",", ".")) || 0;

/** Verde/âmbar/vermelho pela nota, como o selo de status da referência. */
function Selo({ nota }: { nota: string }) {
  if (!nota) return <span className="text-neutral-400">—</span>;
  const n = num(nota);
  const cor = n >= 4.5 ? "bg-emerald-500" : n >= 4 ? "bg-amber-500" : "bg-red-500";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium tabular-nums text-neutral-800">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${cor}`} />
      {nota}
    </span>
  );
}

export function ProspeccaoResultados({
  leads,
  contatados,
  onMarcar,
  onBaixar,
}: {
  leads: Lead[];
  contatados: Contatados;
  onMarcar: (l: Lead) => void;
  onBaixar: () => void;
}) {
  const [ativos, setAtivos] = useState<FiltroKey[]>([]);
  const [ordem, setOrdem] = useState<{ por: Ordem; desc: boolean }>({ por: "nota", desc: true });
  const [mostrar, setMostrar] = useState(LOTE);
  const fim = useRef<HTMLDivElement>(null);

  const linhas = useMemo(() => {
    const f = leads.filter((l) => ativos.every((k) => FILTROS[k].ok(l, contatados)));
    const valor = (l: Lead) => (ordem.por === "nome" ? l.nome.toLowerCase() : ordem.por === "nota" ? num(l.nota) : num(l.avaliacoes));
    return [...f].sort((a, b) => {
      const x = valor(a), y = valor(b);
      return (x < y ? -1 : x > y ? 1 : 0) * (ordem.desc ? -1 : 1);
    });
  }, [leads, ativos, ordem, contatados]);

  const visiveis = linhas.slice(0, mostrar);

  // Scroll infinito: ao chegar no fim da tabela, mostra mais um lote.
  useEffect(() => {
    const el = fim.current;
    if (!el) return;
    const obs = new IntersectionObserver((e) => e[0].isIntersecting && setMostrar((m) => m + LOTE), { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [linhas.length, mostrar]);
  const disponiveis = (Object.keys(FILTROS) as FiltroKey[]).filter((k) => !ativos.includes(k));

  function alternar(k: FiltroKey) {
    setAtivos((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
    setMostrar(LOTE);
  }
  function ordenar(por: Ordem) {
    setOrdem((o) => ({ por, desc: o.por === por ? !o.desc : por !== "nome" }));
    setMostrar(LOTE);
  }

  const cab = (por: Ordem, rotulo: string) => {
    const on = ordem.por === por;
    const Icone = !on ? ArrowUpDown : ordem.desc ? ChevronDown : ChevronUp;
    return (
      <th key={por} scope="col" aria-sort={on ? (ordem.desc ? "descending" : "ascending") : "none"} className="px-3 py-2 text-left font-medium">
        <button type="button" onClick={() => ordenar(por)} className={`inline-flex min-h-9 items-center gap-1 rounded hover:text-neutral-900 ${foco}`}>
          {rotulo} <Icone aria-hidden="true" className="size-3.5" />
        </button>
      </th>
    );
  };

  return (
    <section aria-label="Resultados" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-2 pl-3">
        <p className="mr-1 text-sm font-medium text-neutral-900" role="status">
          {linhas.length} de {leads.length} {leads.length === 1 ? "empresa" : "empresas"} · {leads.filter((l) => contatados.has(idDe(l))).length} contatadas
        </p>
        {ativos.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => alternar(k)}
            aria-label={`Remover filtro ${FILTROS[k].rotulo}`}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full bg-neutral-100 pr-2 pl-3 text-sm ${foco}`}
          >
            {FILTROS[k].campo} · <b className="font-semibold">{FILTROS[k].rotulo}</b>
            <X aria-hidden="true" className="size-3.5 text-neutral-500" />
          </button>
        ))}
        {disponiveis.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => alternar(k)}
            className={`inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-neutral-300 pr-3 pl-2 text-sm text-neutral-700 hover:bg-neutral-50 ${foco}`}
          >
            <Plus aria-hidden="true" className="size-3.5" /> {FILTROS[k].campo === "Tem" ? FILTROS[k].rotulo : `${FILTROS[k].campo}: ${FILTROS[k].rotulo.toLowerCase()}`}
          </button>
        ))}
        {ativos.length > 0 && (
          <button type="button" onClick={() => setAtivos([])} className={`min-h-9 rounded px-2 text-sm text-neutral-600 hover:text-neutral-900 ${foco}`}>
            Limpar
          </button>
        )}
        <button
          type="button"
          onClick={onBaixar}
          className={`ml-auto inline-flex min-h-9 items-center gap-2 rounded-full border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-50 ${foco}`}
        >
          <Download aria-hidden="true" className="size-4" /> Baixar planilha
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] border-collapse text-sm">
            <thead className="border-b border-neutral-200 text-xs text-neutral-500">
              <tr>
                <th scope="col" className="w-10 px-3 py-2"><span className="sr-only">Contatado</span></th>
                {cab("nome", "Empresa")}
                <th scope="col" className="px-3 py-2 text-left font-medium">Instagram</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Telefone</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">E-mail</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Site</th>
                {cab("nota", "Nota")}
                {cab("avaliacoes", "Avaliações")}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {visiveis.map((l, i) => (
                <tr key={`${l.nome}-${i}`} className={`align-top hover:bg-neutral-50 ${contatados.has(idDe(l)) ? "bg-neutral-50/60 text-neutral-500" : ""}`}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={contatados.has(idDe(l))}
                      onChange={() => onMarcar(l)}
                      aria-label={`Já entrei em contato com ${l.nome}`}
                      className="size-5 cursor-pointer accent-neutral-900"
                    />
                  </td>
                  <td className="w-64 max-w-64 px-3 py-3">
                    <div className="line-clamp-2 font-medium text-neutral-900" title={l.nome}>{l.nome}</div>
                    <div className="truncate text-xs text-neutral-500">{[l.categoria, l.endereco.split(" - ").slice(-2, -1)[0]].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td className="px-3 py-3">
                    {l.instagram ? (
                      <a href={l.instagram.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${link}`}>
                        <AtSign aria-hidden="true" className="size-3.5" />
                        {l.instagram.usuario}
                        <span className="sr-only"> no Instagram</span>
                      </a>
                    ) : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {l.telefone ? <a href={`tel:${l.telefone.replace(/[^\d+]/g, "")}`} className={link}>{l.telefone}</a> : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="max-w-48 truncate px-3 py-3">
                    {l.email ? <a href={`mailto:${l.email}`} className={link}>{l.email}</a> : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="max-w-40 truncate px-3 py-3">
                    {l.site ? (
                      <a href={l.site} target="_blank" rel="noopener noreferrer" className={link}>
                        {new URL(l.site).hostname.replace(/^www\./, "")}
                      </a>
                    ) : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-3 py-3"><Selo nota={l.nota} /></td>
                  <td className="px-3 py-3 tabular-nums text-neutral-700">{l.avaliacoes || "—"}</td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                    Nenhuma empresa com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div ref={fim} className="border-t border-neutral-100 px-3 py-2 text-sm text-neutral-600">
          Mostrando {visiveis.length} de {linhas.length}
        </div>
      </div>
    </section>
  );
}
