"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, createSessionCookieValue } from "@/lib/auth";
import { createUser, getUserByUsername, verifyPassword } from "@/lib/users";

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const secret = process.env.ADMIN_PASSWORD;

  if (!secret) {
    redirect(`/admin/login?error=config&next=${encodeURIComponent(next)}`);
  }

  const user = await getUserByUsername(username);
  const valid = user ? await verifyPassword(password, user.password_hash) : false;

  if (!user || !valid) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieValue = await createSessionCookieValue(
    { userId: user.id, role: user.role },
    secret
  );
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(next || "/admin");
}

export async function signup(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const secret = process.env.ADMIN_PASSWORD;

  function fail(error: string): never {
    redirect(
      `/admin/login?mode=signup&signupError=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`
    );
  }

  if (!secret) return fail("config");
  if (!username || !password) return fail("campos");
  if (password !== passwordConfirm) return fail("senha");

  const existing = await getUserByUsername(username);
  if (existing) return fail("usuario_existe");

  // Cadastro aberto: quem cria a própria conta nunca vira admin por essa
  // via — role de admin só é atribuída por outro admin em /admin/usuarios.
  const user = await createUser({ username, email, password, role: "member" });

  const cookieValue = await createSessionCookieValue(
    { userId: user.id, role: user.role },
    secret
  );
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(next || "/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}
