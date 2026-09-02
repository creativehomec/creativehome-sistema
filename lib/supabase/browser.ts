import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Client do navegador, com a chave anônima — só serve pra assinar canais do
 * Realtime. RLS restringe essa chave a `select` nas tabelas que alimentam
 * telas com sync ao vivo (ver supabase/migrations/0039_realtime_select.sql);
 * toda escrita continua passando pelas server actions com a service role.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local"
    );
  }

  cachedClient = createClient(url, anonKey);
  return cachedClient;
}
