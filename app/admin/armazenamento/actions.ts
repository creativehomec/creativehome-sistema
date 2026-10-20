"use server";

import { revalidatePath } from "next/cache";
import {
  addItem,
  addLocation,
  deleteItem,
  deleteLocation,
  listStorage,
  setItemLocations,
  updateLocationDetails,
  updateLocationUsed,
} from "@/lib/armazenamento";
import { normalizeStorageRole, parseGb, parseTags } from "@/lib/storageTypes";
import { requireFeature } from "@/lib/session";

const done = () => revalidatePath("/admin/armazenamento");

export async function addLocationAction(formData: FormData) {
  await requireFeature("armazenamento");
  const name = String(formData.get("nome") ?? "").trim();
  const capacityGb = parseGb(formData.get("capacidade")) * (formData.get("unidade") === "TB" ? 1000 : 1);
  if (!name || !capacityGb) return;
  const usedGb = parseGb(formData.get("usado")) * (formData.get("unidade") === "TB" ? 1000 : 1);
  const limit = Math.round(parseGb(formData.get("limite"))) || 80;
  await addLocation({
    name,
    role: normalizeStorageRole(formData.get("papel")),
    capacityGb,
    usedGb,
    limitPercent: Math.min(100, limit),
  });
  done();
}

export async function updateUsedAction(formData: FormData) {
  await requireFeature("armazenamento");
  const unit = formData.get("unidade") === "TB" ? 1000 : 1;
  await updateLocationUsed(String(formData.get("id")), parseGb(formData.get("usado")) * unit);
  done();
}

/** Renomeia o espaço e troca as etiquetas. Vale também pra disco lido pelo app: a leitura só define o nome na criação. */
export async function updateLocationAction(formData: FormData) {
  await requireFeature("armazenamento");
  const name = String(formData.get("nome") ?? "").trim().slice(0, 80);
  if (!name) return;
  await updateLocationDetails(String(formData.get("id")), { name, tags: parseTags(formData.get("tags")) });
  done();
}

export async function deleteLocationAction(formData: FormData) {
  await requireFeature("armazenamento");
  await deleteLocation(String(formData.get("id")));
  done();
}

export async function addItemAction(formData: FormData) {
  await requireFeature("armazenamento");
  const name = String(formData.get("nome") ?? "").trim();
  if (!name) return;
  await addItem({
    name,
    sizeGb: parseGb(formData.get("tamanho")),
    locationIds: formData.getAll("lugares").map(String),
  });
  done();
}

/** Marca "tem cópia aqui" num material, direto da lista de avisos. */
export async function addCopyAction(formData: FormData) {
  await requireFeature("armazenamento");
  const id = String(formData.get("id"));
  const where = String(formData.get("lugar"));
  const { items, locations } = await listStorage();
  const item = items.find((i) => i.id === id);
  const lugar = locations.find((l) => l.id === where);
  // Disco lido pelo app é a verdade: a próxima leitura desfaria a marcação à mão.
  if (!item || !lugar || lugar.deviceKey || item.locationIds.includes(where)) return;
  await setItemLocations(id, [...item.locationIds, where]);
  done();
}

export async function deleteItemAction(formData: FormData) {
  await requireFeature("armazenamento");
  await deleteItem(String(formData.get("id")));
  done();
}
