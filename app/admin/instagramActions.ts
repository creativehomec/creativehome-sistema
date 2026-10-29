"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import {
  cancelInstagramPost,
  getInstagramCardState,
  publishInstagramNow,
  scheduleInstagramPost,
} from "@/lib/instagram";

async function requireTeam() {
  const session = await getCurrentSession();
  if (!session || session.role === "client") throw new Error("Sem acesso.");
  return session;
}

export async function getInstagramCardStateAction(cardId: string) {
  await requireTeam();
  return getInstagramCardState(cardId);
}

/** Devolve a mensagem em vez de lançar: o erro de server action chega ao
 * navegador sem o texto em produção, e aqui o texto é o que importa. */
async function run(fn: () => Promise<void>) {
  try {
    await fn();
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function publishInstagramNowAction(cardId: string) {
  const session = await requireTeam();
  const result = await run(() => publishInstagramNow(cardId, session.userId));
  revalidatePath("/admin/backlog");
  return result;
}

export async function scheduleInstagramPostAction(cardId: string) {
  const session = await requireTeam();
  return run(() => scheduleInstagramPost(cardId, session.userId));
}

export async function cancelInstagramPostAction(cardId: string) {
  await requireTeam();
  return run(() => cancelInstagramPost(cardId));
}
