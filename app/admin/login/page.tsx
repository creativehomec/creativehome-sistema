import Link from "next/link";
import { signup } from "./actions";
import { BrandLogo } from "@/components/BrandLogo";
import LoginForm from "./LoginForm";

type SearchParams = Promise<{
  error?: string;
  signupError?: string;
  next?: string;
  mode?: string;
}>;

const INPUT_CLASS =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";
const LABEL_CLASS = "mb-1 block text-sm font-medium text-neutral-700";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const next = params.next ?? "/admin";
  const isSignup = params.mode === "signup";

  const errorMessage =
    params.error === "config"
      ? "ADMIN_PASSWORD não está configurado no servidor."
      : params.error
      ? "Usuário ou senha incorretos."
      : null;

  const signupErrorMessage =
    params.signupError === "config"
      ? "ADMIN_PASSWORD não está configurado no servidor."
      : params.signupError === "campos"
      ? "Preencha usuário e senha."
      : params.signupError === "senha"
      ? "As senhas não são iguais."
      : params.signupError === "usuario_existe"
      ? "Esse usuário já existe."
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <BrandLogo className="mb-4 block h-9 w-auto text-[#a44a2b]" />
        <p className="mb-6 text-sm text-neutral-500">
          {isSignup ? "Criar conta" : "Acesso administrativo"}
        </p>

        {isSignup ? (
          <form action={signup} className="space-y-4">
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
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="email" className={LABEL_CLASS}>
                E-mail
              </label>
              <input id="email" name="email" type="email" className={INPUT_CLASS} />
            </div>
            <div>
              <label htmlFor="password" className={LABEL_CLASS}>
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="password_confirm" className={LABEL_CLASS}>
                Confirmar senha
              </label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                required
                className={INPUT_CLASS}
              />
            </div>

            {signupErrorMessage ? (
              <p className="text-sm text-red-600">{signupErrorMessage}</p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Criar conta
            </button>

            <p className="text-center text-sm text-neutral-500">
              Já tem conta?{" "}
              <Link
                href={`/admin/login?next=${encodeURIComponent(next)}`}
                className="font-medium text-neutral-900 underline"
              >
                Entrar
              </Link>
            </p>
          </form>
        ) : (
          <LoginForm next={next} errorMessage={errorMessage} />
        )}
      </div>
    </div>
  );
}
