import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, getSession, type Session } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { FEATURES, type FeatureKey } from "@/lib/features";

/**
 * Lê a sessão atual (userId + role) a partir do cookie, pra uso em Server
 * Components e server actions (fora do middleware, que já faz sua própria
 * checagem via request.cookies em proxy.ts).
 *
 * `cache()` deduplica chamadas repetidas dentro do mesmo request — cada
 * página do admin chama isso em mais de um componente (header, conteúdo),
 * e sem isso cada uma refazia a leitura do cookie e a verificação HMAC.
 */
export const getCurrentSession = cache(async (): Promise<Session | null> => {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  const cookieStore = await cookies();
  return getSession(cookieStore.get(COOKIE_NAME)?.value, secret);
});

/**
 * Nome de usuário de quem está logado, pra exibir no header — retorna null
 * se não houver sessão válida.
 */
export async function getCurrentUsername(): Promise<string | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  const user = await getUserById(session.userId);
  return user?.username ?? null;
}

/**
 * Bloqueia o acesso de quem não é admin — usado nas páginas/actions de
 * gerenciamento de usuários, a única área restrita a admin no sistema.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    redirect("/admin");
  }
  return session;
}

/**
 * Áreas liberadas pra quem está logado. Admin tem todas; membro tem todas
 * menos as que um admin desligou em /admin/usuarios. Lê o usuário do banco
 * (com o cache curto de `getUserById`), e não do cookie, pra que tirar um
 * acesso valha em até um minuto em vez de só no próximo login.
 */
export const getAllowedFeatures = cache(async (): Promise<FeatureKey[]> => {
  const session = await getCurrentSession();
  if (!session) return [];
  const all = FEATURES.map((feature) => feature.key);
  if (session.role === "admin") return all;
  const user = await getUserById(session.userId);
  const disabled = new Set(user?.disabled_features ?? []);
  return all.filter((key) => !disabled.has(key));
});

/**
 * Barra quem não tem a área liberada. Vai no layout da área (páginas) e no
 * topo das server actions dela — action é endpoint próprio e não passa pelo
 * layout.
 */
export async function requireFeature(key: FeatureKey): Promise<void> {
  const allowed = await getAllowedFeatures();
  if (!allowed.includes(key)) redirect("/admin");
}
