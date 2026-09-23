"use server";

import { revalidatePath } from "next/cache";
import { createUser, deleteUser, updateUser, type UserRole } from "@/lib/users";
import { createInvite, deleteInvite } from "@/lib/invites";
import { requireAdmin } from "@/lib/session";
import { FEATURES } from "@/lib/features";

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "member") === "admin" ? "admin" : "member";

  if (!username || !password) return;

  await createUser({ username, email, password, role });
  revalidatePath("/admin/usuarios");
}

export async function updateUserAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "member") === "admin" ? "admin" : "member";

  if (!id || !username) return;

  // Checkbox desmarcado não vai no form: o que não veio marcado é o que foi
  // desligado.
  const enabled = new Set(formData.getAll("features").map(String));
  const disabledFeatures = FEATURES.map((feature) => feature.key).filter(
    (key) => !enabled.has(key)
  );

  await updateUser(id, {
    username,
    email,
    role,
    disabledFeatures,
    password: password || undefined,
  });
  revalidatePath("/admin/usuarios");
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id || id === session.userId) return;

  await deleteUser(id);
  revalidatePath("/admin/usuarios");
}

export async function createInviteAction(formData: FormData) {
  const session = await requireAdmin();

  const role: UserRole =
    String(formData.get("role") ?? "member") === "admin" ? "admin" : "member";

  await createInvite({ role, createdBy: session.userId });
  revalidatePath("/admin/usuarios");
}

export async function deleteInviteAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteInvite(id);
  revalidatePath("/admin/usuarios");
}
