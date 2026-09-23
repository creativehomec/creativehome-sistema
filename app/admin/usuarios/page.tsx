import { headers } from "next/headers";
import { listUsers } from "@/lib/users";
import { listPendingInvites } from "@/lib/invites";
import { requireAdmin } from "@/lib/session";
import { FEATURES } from "@/lib/features";
import { Accordion } from "@/components/Accordion";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  createInviteAction,
  createUserAction,
  deleteInviteAction,
  deleteUserAction,
  updateUserAction,
} from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

async function getSiteOrigin() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

const INPUT =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";
const LABEL = "mb-1 block text-xs font-medium text-neutral-600";
const PRIMARY =
  "rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none";

function RoleSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="role" defaultValue={defaultValue} className={INPUT}>
      <option value="member">Membro</option>
      <option value="admin">Admin</option>
    </select>
  );
}

export default async function UsersPage() {
  const session = await requireAdmin();
  const [users, invites, origin] = await Promise.all([
    listUsers(),
    listPendingInvites(),
    getSiteOrigin(),
  ]);

  const currentUsername = users.find((user) => user.id === session.userId)?.username;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminHeader
        title="Usuários"
        trail={[{ label: "Admin", href: "/admin" }, { label: "Usuários" }]}
        username={currentUsername}
      />

      <section
        aria-labelledby="pessoas-titulo"
        className="rounded-lg border border-neutral-200 bg-white"
      >
        <header className="flex items-baseline justify-between px-4 pt-4 pb-3">
          <h2 id="pessoas-titulo" className="text-sm font-semibold text-neutral-900">
            Pessoas
          </h2>
          <span className="text-xs text-neutral-500 tabular-nums">
            {users.length} {users.length === 1 ? "acesso" : "acessos"}
          </span>
        </header>

        <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
          {users.map((user) => {
            const isSelf = user.id === session.userId;
            const disabled = user.disabled_features ?? [];
            const enabledCount = FEATURES.filter(
              (feature) => !disabled.includes(feature.key)
            ).length;
            const access =
              user.role === "admin" || enabledCount === FEATURES.length
                ? "Acesso total"
                : `${enabledCount} de ${FEATURES.length} áreas`;

            return (
              <li key={user.id}>
                <Accordion
                  buttonClassName="gap-3 px-4 py-3 hover:bg-neutral-50"
                  summary={
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-800 uppercase"
                      >
                        {user.username.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-neutral-900">
                          {user.username}
                          {isSelf ? (
                            <span className="ml-1.5 font-normal text-neutral-400">
                              (você)
                            </span>
                          ) : null}
                        </span>
                        <span className="block truncate text-xs text-neutral-500">
                          {user.email || "sem e-mail"}
                        </span>
                      </span>
                      <span className="hidden text-xs text-neutral-500 sm:block">
                        {access}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Membro"}
                      </span>
                    </span>
                  }
                >
                  <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-4">
                    {/* `group` + :has() no select: as áreas somem assim que o
                        acesso vira Admin, sem JS — admin vê tudo mesmo. */}
                    <form action={updateUserAction} className="group space-y-4">
                      <input type="hidden" name="id" value={user.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className={LABEL}>Usuário</label>
                          <input
                            name="username"
                            type="text"
                            defaultValue={user.username}
                            required
                            className={INPUT}
                          />
                        </div>
                        <div>
                          <label className={LABEL}>E-mail</label>
                          <input
                            name="email"
                            type="email"
                            defaultValue={user.email}
                            className={INPUT}
                          />
                        </div>
                        <div>
                          <label className={LABEL}>Nova senha</label>
                          <input
                            name="password"
                            type="password"
                            placeholder="Em branco mantém a atual"
                            className={INPUT}
                          />
                        </div>
                        <div>
                          <label className={LABEL}>Acesso</label>
                          <RoleSelect defaultValue={user.role} />
                        </div>
                      </div>

                      <fieldset className="group-has-[option[value=admin]:checked]:hidden">
                        <legend className="mb-2 text-xs font-medium text-neutral-600">
                          Áreas que pode ver
                        </legend>
                        <div className="flex flex-wrap gap-2">
                          {FEATURES.map((feature) => (
                            <label
                              key={feature.key}
                              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-500 transition-colors select-none has-[:checked]:border-neutral-400 has-[:checked]:bg-neutral-100 has-[:checked]:text-neutral-900 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-900 pointer-coarse:min-h-11"
                            >
                              <input
                                type="checkbox"
                                name="features"
                                value={feature.key}
                                defaultChecked={!disabled.includes(feature.key)}
                                className="size-3.5 accent-neutral-900"
                              />
                              {feature.label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <p className="hidden text-xs text-neutral-500 group-has-[option[value=admin]:checked]:block">
                        Admin vê todas as áreas e gerencia usuários.
                      </p>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-xs text-neutral-400">
                          Desde {formatDate(user.created_at)}
                        </span>
                        <button type="submit" className={PRIMARY}>
                          Salvar
                        </button>
                      </div>
                    </form>
                    {isSelf ? null : (
                      <form
                        action={deleteUserAction}
                        className="mt-3 border-t border-neutral-200 pt-3"
                      >
                        <input type="hidden" name="id" value={user.id} />
                        <DeleteButton
                          label="Remover acesso"
                          confirmMessage={`Remover o acesso de "${user.username}"?`}
                        />
                      </form>
                    )}
                  </div>
                </Accordion>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-labelledby="adicionar-titulo"
        className="mt-6 rounded-lg border border-neutral-200 bg-white"
      >
        <div className="p-4">
          <h2 id="adicionar-titulo" className="text-sm font-semibold text-neutral-900">
            Adicionar pessoa
          </h2>
          <p className="mt-1 mb-3 text-sm text-neutral-500">
            Gere um link de convite: a pessoa escolhe o próprio usuário e senha.
          </p>
          <form action={createInviteAction} className="flex flex-wrap items-end gap-2">
            <div className="w-36">
              <label className={LABEL}>Acesso</label>
              <RoleSelect defaultValue="member" />
            </div>
            <button type="submit" className={PRIMARY}>
              Gerar link de convite
            </button>
          </form>

          {invites.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-500">
                      Convite de {invite.role === "admin" ? "admin" : "membro"} ·{" "}
                      {formatDate(invite.created_at)}
                    </p>
                    <p className="truncate font-mono text-xs text-neutral-800 select-all">
                      {origin}/convite/{invite.token}
                    </p>
                  </div>
                  <form action={deleteInviteAction}>
                    <input type="hidden" name="id" value={invite.id} />
                    <DeleteButton
                      label="Cancelar"
                      confirmMessage="Cancelar este convite? O link deixa de funcionar."
                    />
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Accordion
          className="border-t border-neutral-100"
          buttonClassName="px-4 py-3 hover:bg-neutral-50"
          summary={
            <span className="text-sm text-neutral-700">
              Ou criar direto, definindo a senha
            </span>
          }
        >
          <form
            action={createUserAction}
            className="grid gap-3 border-t border-neutral-100 px-4 py-4 sm:grid-cols-2"
          >
            <div>
              <label className={LABEL}>Usuário</label>
              <input name="username" type="text" required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>E-mail</label>
              <input name="email" type="email" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Senha</label>
              <input name="password" type="password" required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Acesso</label>
              <RoleSelect defaultValue="member" />
            </div>
            <div className="flex justify-end sm:col-span-2">
              <button type="submit" className={PRIMARY}>
                Adicionar usuário
              </button>
            </div>
          </form>
        </Accordion>
      </section>
    </div>
  );
}
