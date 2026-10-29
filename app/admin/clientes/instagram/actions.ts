"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { assertClientAllowed, getCurrentClientScope } from "@/lib/clientAccess";
import { disconnectInstagramAccount } from "@/lib/instagram";

export async function disconnectInstagramAction(clientId: string) {
  const session = await getCurrentSession();
  if (!session || session.role === "client") throw new Error("Sem acesso.");
  assertClientAllowed(await getCurrentClientScope(), clientId);
  await disconnectInstagramAccount(clientId);
  revalidatePath("/admin/clientes/instagram");
}
