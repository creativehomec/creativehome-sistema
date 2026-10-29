"use client";

import { useTransition } from "react";
import { confirmar } from "@/components/ConfirmHost";
import { disconnectInstagramAction } from "./actions";

export function DisconnectButton({ clientId, username }: { clientId: string; username: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!(await confirmar(`Desconectar @${username}? Posts agendados desse cliente vão dar erro.`, "Desconectar"))) return;
        startTransition(() => disconnectInstagramAction(clientId));
      }}
      className="min-h-9 rounded-md px-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      Desconectar
    </button>
  );
}
