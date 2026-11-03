/**
 * Sistema visual do portal do cliente, numa linha só por papel. Tudo sobre o
 * degradê escuro da marca (ver `--portal-grad` no layout): texto creme, cartão
 * de vidro para o que é de apoio e cartão creme sólido para o que pede
 * atenção ou leitura longa.
 *
 * As cores vêm dos tokens `--p-*` definidos no layout do portal, então nada
 * aqui vale fora dele.
 */

/**
 * Largura do conteúdo: uma coluna no celular, mais ar no tablet e a largura
 * toda de um notebook em tela grande, onde as telas se dividem em colunas.
 */
export const pContainer = "mx-auto w-full max-w-xl px-[var(--gutter)] md:max-w-3xl lg:max-w-6xl";

/** Título de tela, grande e pesado; cresce em tela larga. */
export const pTitle =
  "text-[2.25rem] font-bold leading-[1.05] tracking-[-0.02em] text-balance text-[var(--p-text)] lg:text-5xl";

/** Frase de apoio logo abaixo do título. */
export const pLead = "mt-2 text-[var(--p-muted)]";

/** Título de bloco dentro da tela. */
export const pH2 = "text-xl font-semibold text-[var(--p-text)]";

/** Cartão de vidro: apoio, lista, bloco que não precisa chamar atenção. */
export const pCard =
  "rounded-[26px] border border-[var(--p-line)] bg-[var(--p-glass)] p-4 text-[var(--p-text)] shadow-lg shadow-black/10";

/** Cartão creme sólido: o que pede ação ou leitura longa. */
export const pCardSolid = "rounded-[26px] bg-[var(--brand-cream)] p-4 text-[var(--brand-ink)]";

/** Linha de lista dentro de um cartão ou de uma seção. */
export const pRow = "border-t border-[var(--p-line)] first:border-t-0";

/** Botão principal: creme, texto escuro. */
export const pPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand-cream)] px-5 font-semibold text-[var(--brand-ink)] transition-opacity disabled:opacity-60";

/** Botão secundário: vidro com borda. */
export const pGhost =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--p-line)] bg-[var(--p-glass)] px-5 font-semibold text-[var(--p-text)] transition-opacity hover:bg-white/10 disabled:opacity-60";

/** Trilho de abas (Ano/Mês, Aguardando/Aprovados, Semana/Formato). */
export const pSegWrap =
  "inline-flex rounded-full border border-[var(--p-line)] bg-[var(--p-glass)] p-1";

/** Uma aba do trilho, acesa ou apagada. */
export const pSeg = (on: boolean) =>
  `inline-flex min-h-10 items-center rounded-full px-4 text-sm transition-colors ${
    on ? "bg-[var(--brand-cream)] font-semibold text-[var(--brand-ink)]" : "text-[var(--p-muted)] hover:text-[var(--p-text)]"
  }`;

/** Botão redondo de seta (mês anterior/seguinte). */
export const pIconButton =
  "grid size-11 place-items-center rounded-full border border-[var(--p-line)] bg-[var(--p-glass)] text-[var(--p-text)] hover:bg-white/10";

/** Caixa de data à esquerda de um item (dia + mês). */
export const pDateChip =
  "grid w-14 shrink-0 place-items-center rounded-2xl bg-[var(--brand-cream)] py-1.5 text-[var(--brand-ink)]";

/** Contador pequeno em creme (ex.: "3 ideias"). */
export const pCount = "rounded-full bg-[var(--brand-cream)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand-ink)]";

/** Link de ação dentro da tela. */
export const pLink = "inline-flex min-h-11 items-center gap-1 font-medium text-[var(--p-text)] underline underline-offset-4";

/** Aviso de erro ou de estado, em creme. */
export const pAlert = "rounded-2xl bg-[var(--brand-cream)] px-4 py-3 text-sm font-semibold text-[var(--brand-ink)]";
