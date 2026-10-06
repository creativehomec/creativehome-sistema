export type CenaImportada = {
  script: string;
  description?: string;
  hooks_alternativos: string[];
  ctas_alternativos: string[];
};
export type VideoImportado = { titulo: string; cenas: CenaImportada[]; notas_producao: string };

function cena(script: string, extra: Partial<CenaImportada> = {}): CenaImportada {
  return { script, hooks_alternativos: [], ctas_alternativos: [], ...extra };
}

/**
 * Roteiro colado e organizado pela IA ("Colar roteiro" no editor do guia).
 * Descrição e notas vêm em trechos separados porque cada trecho precisa ser
 * cópia literal de um pedaço do original: juntar dois trechos numa string
 * faria a checagem acusar alteração.
 */
export type RoteiroOrganizado = {
  videos: {
    titulo: string;
    cenas: {
      script: string;
      descricao: string[];
      hooks_alternativos: string[];
      ctas_alternativos: string[];
    }[];
    notas_producao: string[];
  }[];
};

export function organizadoParaVideos(r: RoteiroOrganizado): VideoImportado[] {
  return r.videos.map((v) => ({
    titulo: v.titulo,
    cenas: v.cenas.map((c) =>
      cena(c.script, {
        description: c.descricao.join("\n"),
        hooks_alternativos: c.hooks_alternativos,
        ctas_alternativos: c.ctas_alternativos,
      })
    ),
    notas_producao: v.notas_producao.join("\n"),
  }));
}

const espacos = (t: string) => t.replace(/\s+/g, " ").trim();

/**
 * Confere se a IA só recortou o texto do cliente. Cada trecho tem que existir
 * igual no original (só espaço e quebra de linha são ignorados); o que não
 * existe vai em `alterados`. O que do original não entrou em trecho nenhum
 * vai em `deFora`, pra conferir que só sobraram marcadores ("CENA 1:").
 * Títulos não entram: são rótulo, não texto do cliente.
 */
export function verificarIntocado(original: string, r: RoteiroOrganizado) {
  const base = espacos(original);
  const coberto = new Array<boolean>(base.length).fill(false);
  const alterados: string[] = [];

  const trechos = r.videos.flatMap((v) => [
    ...v.cenas.flatMap((c) => [
      c.script,
      ...c.descricao,
      ...c.hooks_alternativos,
      ...c.ctas_alternativos,
    ]),
    ...v.notas_producao,
  ]);

  for (const bruto of trechos) {
    const trecho = espacos(bruto);
    if (!trecho) continue;
    // Frase repetida no original: usa a primeira ocorrência ainda livre.
    let i = base.indexOf(trecho);
    while (i !== -1 && coberto[i]) i = base.indexOf(trecho, i + 1);
    if (i === -1) i = base.indexOf(trecho);
    if (i === -1) {
      alterados.push(trecho);
      continue;
    }
    coberto.fill(true, i, i + trecho.length);
  }

  const deFora: string[] = [];
  let atual = "";
  for (let i = 0; i <= base.length; i++) {
    if (i < base.length && !coberto[i]) atual += base[i];
    else {
      // Sobra sem letra nem número (aspas, travessão, pontuação) não conta.
      if (/[\p{L}\p{N}]/u.test(atual)) {
        deFora.push(atual.replace(/^[^\p{L}\p{N}]+|[\s"'“”‘’([{-]+$/gu, ""));
      }
      atual = "";
    }
  }

  return { alterados, deFora };
}
