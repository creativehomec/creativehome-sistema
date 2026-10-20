"use client";

import { confirmar } from "@/components/ConfirmHost";

export function DeleteButton({
  label = "Excluir",
  confirmMessage,
}: {
  label?: string;
  confirmMessage: string;
}) {
  return (
    <button
      type="submit"
      className="text-sm text-red-500 hover:text-red-700"
      onClick={async (event) => {
        // Barra o envio, espera a resposta e reenvia pelo mesmo botão
        // (requestSubmit(botao) preserva o formAction e o name/value dele).
        event.preventDefault();
        const botao = event.currentTarget;
        const form = botao.form;
        if (form && (await confirmar(confirmMessage, label))) form.requestSubmit(botao);
      }}
    >
      {label}
    </button>
  );
}
