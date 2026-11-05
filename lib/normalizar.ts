/** Minúsculas, sem acento, sem pontuação: "Luís  Eduardo-Magalhães" -> "luis eduardo magalhaes". */
export const semAcento = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function distancia(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Acha o candidato que a pessoa quis digitar: igual sem acento, ou a até ~20% de
 * letras de distância ("dentisa" -> "Dentista"). Empate entre candidatos diferentes
 * devolve null, pra não trocar por palpite.
 */
export function melhorMatch(entrada: string, candidatos: string[], chave = (c: string) => c): string | null {
  const alvo = semAcento(entrada);
  if (!alvo) return null;
  const limite = Math.min(3, Math.floor(alvo.length * 0.2));
  let melhor: string[] = [];
  let menor = limite + 1;
  for (const c of candidatos) {
    const d = distancia(alvo, semAcento(chave(c)));
    if (d < menor) {
      menor = d;
      melhor = [c];
    } else if (d === menor && d <= limite) melhor.push(c);
  }
  return melhor.length === 1 ? melhor[0] : null;
}

/** "luis eduardo magalhaes - ba" / "Luis Eduardo Magalhaes BA" -> "Luís Eduardo Magalhães, BA". */
export function normalizarCidade(entrada: string, cidades: string[]): string {
  const limpa = entrada.trim().replace(/\s+/g, " ");
  const m = limpa.match(/^(.*?)[\s,/-]+([a-zA-Z]{2})$/);
  const uf = m && cidades.some((c) => c.endsWith(`, ${m[2].toUpperCase()}`)) ? m[2].toUpperCase() : null;
  const nome = uf && m ? m[1] : limpa;
  const pool = uf ? cidades.filter((c) => c.endsWith(`, ${uf}`)) : cidades;
  const alvo = semAcento(nome);
  const exatas = pool.filter((c) => semAcento(c.slice(0, c.lastIndexOf(","))) === alvo);
  if (exatas.length === 1) return exatas[0];
  if (exatas.length > 1) return limpa; // "Boa Vista" existe em vários estados: não adivinha
  return melhorMatch(nome, pool, (c) => c.slice(0, c.lastIndexOf(","))) ?? limpa;
}

export function normalizarNicho(entrada: string, categorias: string[]): string {
  const limpa = entrada.trim().replace(/\s+/g, " ");
  return melhorMatch(limpa, categorias) ?? limpa;
}
