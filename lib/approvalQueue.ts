import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isApprovalColumn, type BacklogFormat } from "@/lib/backlogTypes";

/** Quem vê o painel de aprovação no Painel. */
// ponytail: usernames fixos, como APPROVAL_REVIEWERS em lib/backlog.ts.
export const APPROVAL_DASHBOARD_USERS = [
  "vitxreduardo",
  "nicoly caroliny",
  "marcussantos",
];

export type ApprovalStatus = "waiting" | "changes" | "approved";

export interface ApprovalItem {
  id: string;
  title: string;
  format: BacklogFormat;
  post_date: string | null;
  client_name: string | null;
  drive_url: string | null;
  /** O que o cliente pediu pra mudar, quando pediu ajuste. */
  feedback: string;
  status: ApprovalStatus;
}

/** Tudo que está parado na coluna de aprovação, com a resposta do cliente. */
export async function listApprovalQueue(
  clientScope: string[] | null = null
): Promise<ApprovalItem[]> {
  const supabase = getSupabaseServerClient();

  const { data: columns, error: columnsError } = await supabase
    .from("backlog_columns")
    .select("id, name");
  if (columnsError) throw columnsError;
  const ids = (columns ?? [])
    .filter((c) => isApprovalColumn(c.name as string))
    .map((c) => c.id as string);
  if (!ids.length) return [];

  const [cardsResult, clientsResult] = await Promise.all([
    supabase
      .from("backlog_cards")
      .select("id, title, format, post_date, client_id, drive_url, client_feedback, approved_at, changes_requested_at")
      .in("column_id", ids)
      .order("post_date", { nullsFirst: false }),
    supabase.from("gallery_clients").select("id, name"),
  ]);
  if (cardsResult.error) throw cardsResult.error;
  if (clientsResult.error) throw clientsResult.error;

  const nameById = new Map(
    (clientsResult.data ?? []).map((c) => [c.id as string, c.name as string])
  );

  return (cardsResult.data ?? [])
    .filter((c) => !clientScope || !c.client_id || clientScope.includes(c.client_id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      format: c.format,
      post_date: c.post_date,
      client_name: c.client_id ? nameById.get(c.client_id) ?? null : null,
      drive_url: c.drive_url,
      feedback: c.client_feedback ?? "",
      status: c.approved_at ? "approved" : c.changes_requested_at ? "changes" : "waiting",
    }));
}
