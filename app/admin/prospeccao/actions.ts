"use server";

import { apagarBusca, csvDaBusca, marcarContatado, usuarioProspeccao } from "@/lib/prospeccao";

export async function abrirBuscaAction(id: string): Promise<string | null> {
  const userId = await usuarioProspeccao();
  return userId ? csvDaBusca(userId, String(id)) : null;
}

export async function apagarBuscaAction(id: string): Promise<boolean> {
  const userId = await usuarioProspeccao();
  if (!userId) return false;
  await apagarBusca(userId, String(id));
  return true;
}

export async function marcarContatadoAction(leadId: string, contatado: boolean): Promise<boolean> {
  const userId = await usuarioProspeccao();
  const id = String(leadId).slice(0, 400);
  if (!userId || !id) return false;
  try {
    await marcarContatado(userId, id, !!contatado);
    return true;
  } catch {
    return false;
  }
}
