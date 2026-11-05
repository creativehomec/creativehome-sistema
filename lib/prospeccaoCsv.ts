export type Lead = {
  nome: string;
  telefone: string;
  email: string;
  site: string | null;
  categoria: string;
  endereco: string;
  nota: string;
  avaliacoes: string;
  instagram: { url: string; usuario: string } | null;
  facebook: string | null;
};

/** Lê CSV com aspas (vírgula e quebra de linha dentro de campo). */
export function parseCsv(texto: string): string[][] {
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      if (linha.some(Boolean)) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some(Boolean)) linhas.push(linha);
  return linhas;
}

/** O valor vem de sites de terceiros: só aceita http(s) do host esperado. */
function urlDe(valor: string, hosts: string[]): URL | null {
  try {
    const u = new URL(valor);
    const host = u.hostname.replace(/^www\./, "");
    return /^https?:$/.test(u.protocol) && hosts.includes(host) ? u : null;
  } catch {
    return null;
  }
}

export function toLeads(texto: string): Lead[] {
  const [cab, ...linhas] = parseCsv(texto.replace(/^﻿/, ""));
  if (!cab) return [];
  const col = (l: string[], nome: string) => (l[cab.indexOf(nome)] ?? "").trim();
  return linhas.map((l) => {
    const ig = urlDe(col(l, "instagram"), ["instagram.com"]);
    const usuario = ig?.pathname.split("/").filter(Boolean)[0];
    const site = col(l, "website");
    let siteOk: string | null = null;
    try {
      const u = new URL(/^https?:\/\//.test(site) ? site : `https://${site}`);
      if (site && /^https?:$/.test(u.protocol)) siteOk = u.href;
    } catch {}
    const fb = urlDe(col(l, "facebook"), ["facebook.com", "fb.com"]);
    return {
      nome: col(l, "title"),
      telefone: col(l, "phone"),
      email: col(l, "emails").split(/[;,\s]+/)[0] ?? "",
      site: siteOk,
      categoria: col(l, "category"),
      endereco: col(l, "address"),
      nota: col(l, "review_rating"),
      avaliacoes: col(l, "review_count"),
      instagram: ig && usuario ? { url: ig.href, usuario } : null,
      facebook: fb?.href ?? null,
    };
  });
}
