"use server";

import { revalidatePath } from "next/cache";
import {
  createReferencePin,
  deleteReferencePin,
  listReferenceTags,
  updateReferencePin,
  type ReferencePinFields,
} from "@/lib/referencePins";
import { resolveReferencePin } from "@/lib/references";
import { canonicalizeTags } from "@/lib/tags";
import { requireFeature } from "@/lib/session";

function parseTags(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeUrl(url: string) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
}

async function readFields(
  formData: FormData
): Promise<ReferencePinFields | null> {
  // Capa digitada à mão manda: é o conserto de quando a og:image do link
  // expirou ou nunca existiu, e refazer a descoberta apagaria o conserto.
  const manualThumb = String(formData.get("thumb_url") ?? "").trim();
  const comuns = {
    // Sem título, o domínio já identifica melhor que um card em branco.
    title: String(formData.get("title") ?? "").trim(),
    note: String(formData.get("note") ?? "").trim(),
    client: String(formData.get("client") ?? "").trim(),
    tags: canonicalizeTags(
      parseTags(formData.get("tags")),
      await listReferenceTags()
    ),
  };

  const rawUrl = String(formData.get("url") ?? "").trim();
  if (!rawUrl) return null;
  const url = normalizeUrl(rawUrl);

  const resolved = await resolveReferencePin(url);

  return {
    ...comuns,
    url,
    thumb_url: manualThumb || resolved.thumb_url,
    kind: resolved.kind,
  };
}

/**
 * Capa que o link tem hoje, sem gravar nada: o formulário mostra o resultado
 * e só o "Salvar" persiste. Serve de botão de reparo quando a miniatura
 * assinada (Instagram, Facebook) expira.
 */
export async function fetchReferenceCoverAction(
  rawUrl: string
): Promise<string> {
  await requireFeature("referencias");
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  const { thumb_url } = await resolveReferencePin(normalizeUrl(trimmed));
  return thumb_url;
}

export async function createReferencePinAction(formData: FormData) {
  await requireFeature("referencias");
  const fields = await readFields(formData);
  if (!fields) return;

  await createReferencePin(fields);
  revalidatePath("/admin/referencias");
}

export async function updateReferencePinAction(formData: FormData) {
  await requireFeature("referencias");
  const id = String(formData.get("id") ?? "");
  const fields = await readFields(formData);
  if (!id || !fields) return;

  await updateReferencePin(id, fields);
  revalidatePath("/admin/referencias");
}

export async function deleteReferencePinAction(formData: FormData) {
  await requireFeature("referencias");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteReferencePin(id);
  revalidatePath("/admin/referencias");
}
