/**
 * Áreas do admin que um admin pode ligar e desligar por usuário, em
 * /admin/usuarios. O banco guarda só o que foi DESLIGADO
 * (`users.disabled_features`), então área nova nasce liberada pra todo mundo
 * e ninguém perde acesso por esquecimento. Admin vê tudo, sempre.
 *
 * Sem "server-only": o menu de atalhos e as abas de Clientes são componentes
 * de cliente e precisam da mesma lista.
 */
export const FEATURES = [
  { key: "guias", label: "Guia de Captação" },
  { key: "orcamentos", label: "Orçamento" },
  { key: "biblioteca", label: "Biblioteca" },
  { key: "galerias", label: "Galeria do cliente" },
  { key: "backlog", label: "Entregas" },
  { key: "clientes", label: "Cadastro de clientes" },
  { key: "financeiro", label: "Financeiro (faturamento e resumo)" },
  { key: "agenda", label: "Minha Agenda" },
  { key: "lettering", label: "Lettering" },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];

const KEYS = new Set<string>(FEATURES.map((feature) => feature.key));

export function isFeatureKey(value: string): value is FeatureKey {
  return KEYS.has(value);
}
