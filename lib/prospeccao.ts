import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAllowedFeatures, getCurrentSession } from "@/lib/session";

export const RETENCAO_DIAS = 30;

export type BuscaResumo = { id: string; nicho: string; cidade: string; total: number; criadaEm: string };

/** Dono de tudo aqui é o usuário logado com a área liberada; null se não for. */
export async function usuarioProspeccao(): Promise<string | null> {
  const session = await getCurrentSession();
  if (!session || !(await getAllowedFeatures()).includes("prospeccao")) return null;
  return session.userId;
}

export async function salvarBusca(userId: string, b: { nicho: string; cidade: string; total: number; csv: string }) {
  const { data, error } = await getSupabaseServerClient()
    .from("prospeccao_buscas")
    .insert({ user_id: userId, ...b })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Apaga o que passou da retenção antes de listar: sem cron. */
export async function listarBuscas(userId: string): Promise<BuscaResumo[]> {
  const db = getSupabaseServerClient();
  const limite = new Date(Date.now() - RETENCAO_DIAS * 86_400_000).toISOString();
  await db.from("prospeccao_buscas").delete().eq("user_id", userId).lt("created_at", limite);
  const { data, error } = await db
    .from("prospeccao_buscas")
    .select("id, nicho, cidade, total, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    nicho: r.nicho as string,
    cidade: r.cidade as string,
    total: r.total as number,
    criadaEm: r.created_at as string,
  }));
}

export async function csvDaBusca(userId: string, id: string): Promise<string | null> {
  const { data } = await getSupabaseServerClient()
    .from("prospeccao_buscas")
    .select("csv")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.csv as string | undefined) ?? null;
}

export async function apagarBusca(userId: string, id: string) {
  await getSupabaseServerClient().from("prospeccao_buscas").delete().eq("id", id).eq("user_id", userId);
}

export async function listarContatados(userId: string): Promise<string[]> {
  const { data, error } = await getSupabaseServerClient().from("prospeccao_contatados").select("lead_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.lead_id as string);
}

export async function marcarContatado(userId: string, leadId: string, contatado: boolean) {
  const db = getSupabaseServerClient();
  const { error } = contatado
    ? await db.from("prospeccao_contatados").upsert({ user_id: userId, lead_id: leadId })
    : await db.from("prospeccao_contatados").delete().eq("user_id", userId).eq("lead_id", leadId);
  if (error) throw error;
}
