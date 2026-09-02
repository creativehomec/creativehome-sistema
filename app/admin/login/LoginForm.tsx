"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { login } from "./actions";

const INPUT_CLASS =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";
const LABEL_CLASS = "mb-1 block text-sm font-medium text-neutral-700";
const LEMBRAR_KEY = "admin-login-username";

function usuarioLembrado() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LEMBRAR_KEY);
}

export default function LoginForm({
  next,
  errorMessage,
}: {
  next: string;
  errorMessage: string | null;
}) {
  const [username, setUsername] = useState(() => usuarioLembrado() ?? "");
  const [lembrar, setLembrar] = useState(() => usuarioLembrado() !== null);
  const [verSenha, setVerSenha] = useState(false);

  function aoEnviar() {
    if (lembrar) localStorage.setItem(LEMBRAR_KEY, username);
    else localStorage.removeItem(LEMBRAR_KEY);
  }

  return (
    <form action={login} onSubmit={aoEnviar} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="username" className={LABEL_CLASS}>
          Usuário
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label htmlFor="password" className={LABEL_CLASS}>
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={verSenha ? "text" : "password"}
            required
            className={`${INPUT_CLASS} pr-10`}
          />
          <button
            type="button"
            aria-label={verSenha ? "Esconder senha" : "Mostrar senha"}
            onClick={() => setVerSenha((v) => !v)}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-neutral-400 hover:text-neutral-600"
          >
            {verSenha ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={lembrar}
          onChange={(e) => setLembrar(e.target.checked)}
          className="size-4 accent-neutral-900"
        />
        Lembrar meu usuário
      </label>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Entrar
      </button>

      <p className="text-center text-sm text-neutral-500">
        Não tem conta?{" "}
        <Link
          href={`/admin/login?mode=signup&next=${encodeURIComponent(next)}`}
          className="font-medium text-neutral-900 underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
