"use server";

import { revalidatePath } from "next/cache";
import {
  closeMonth,
  createService,
  deleteService,
  getInvoiceClientId,
  reopenInvoice,
  updateService,
} from "@/lib/billing";
import { getCurrentSession, requireFeature } from "@/lib/session";
import { assertClientAllowed, getCurrentClientScope } from "@/lib/clientAccess";
import {
  getBacklogCardClientId,
  readBacklogCardBilling,
  updateBacklogCardBilling,
} from "@/lib/backlog";

function revalidateBilling() {
  revalidatePath("/admin/clientes/faturamento");
  revalidatePath("/admin/backlog");
  revalidatePath("/admin/clientes/resumo");
}

// ------------------------------------------------------------- entregas

/** Valor, contrato e pagamento de uma entrega — o quadro não mexe nisso. */
export async function updateDeliveryBillingAction(formData: FormData) {
  await requireFeature("financeiro");
  const cardId = String(formData.get("card_id") ?? "");
  if (!cardId) return;
  const clientId = await getBacklogCardClientId(cardId);
  if (clientId) assertClientAllowed(await getCurrentClientScope(), clientId);
  await updateBacklogCardBilling(cardId, readBacklogCardBilling(formData));
  revalidateBilling();
}

// -------------------------------------------------------------- catálogo

export async function createServiceAction(formData: FormData) {
  await requireFeature("financeiro");
  await createService({
    name: String(formData.get("name") ?? ""),
    price: formData.get("price"),
  });
  revalidateBilling();
}

export async function updateServiceAction(formData: FormData) {
  await requireFeature("financeiro");
  await updateService(String(formData.get("id")), {
    name: String(formData.get("name") ?? ""),
    price: formData.get("price"),
    active: formData.get("active") === "on",
  });
  revalidateBilling();
}

export async function deleteServiceAction(formData: FormData) {
  await requireFeature("financeiro");
  await deleteService(String(formData.get("id")));
  revalidateBilling();
}

// ------------------------------------------------------------ fechamento

export async function closeMonthAction(formData: FormData) {
  await requireFeature("financeiro");
  const session = await getCurrentSession();
  const clientId = String(formData.get("client_id"));
  assertClientAllowed(await getCurrentClientScope(), clientId);

  await closeMonth({
    clientId,
    month: String(formData.get("month")),
    notes: String(formData.get("notes") ?? ""),
    userId: session?.userId ?? null,
  });
  revalidateBilling();
}

export async function reopenInvoiceAction(formData: FormData) {
  await requireFeature("financeiro");
  const id = String(formData.get("id"));
  const clientId = await getInvoiceClientId(id);
  if (clientId) assertClientAllowed(await getCurrentClientScope(), clientId);

  await reopenInvoice(id);
  revalidateBilling();
}
