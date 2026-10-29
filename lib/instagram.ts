import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDriveFileMeta,
  isDriveFolderMimeType,
  listDriveFolderMediaRecursive,
} from "@/lib/googleDrive";
import type { BacklogFormat } from "@/lib/backlogTypes";

/**
 * Postagem no Instagram pela API com login do Instagram (graph.instagram.com).
 * Não precisa de Página do Facebook: a conta só tem que ser profissional
 * (Empresa ou Criador de conteúdo).
 *
 * O Instagram não recebe arquivo: ele baixa de uma URL pública. A mídia sai
 * do Drive do estúdio por `/api/instagram/midia/[fileId]`, assinada, então só
 * quem tem a assinatura consegue baixar.
 */
const GRAPH = "https://graph.instagram.com/v23.0";
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
];
/** O token novo vale 60 dias; renova quando faltar menos que isto. */
const REFRESH_BEFORE_MS = 10 * 24 * 60 * 60 * 1000;

function getEnv() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) {
    throw new Error(
      "Instagram não configurado: defina INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET e INSTAGRAM_REDIRECT_URI",
    );
  }
  return { appId, appSecret, redirectUri, origin: new URL(redirectUri).origin };
}

export function isInstagramConfigured() {
  return Boolean(
    process.env.INSTAGRAM_APP_ID &&
    process.env.INSTAGRAM_APP_SECRET &&
    process.env.INSTAGRAM_REDIRECT_URI,
  );
}

function sign(value: string) {
  return createHmac("sha256", getEnv().appSecret).update(value).digest("hex");
}

function verify(value: string, signature: string) {
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const verifyMediaSignature = verify;

// --- Conexão da conta ---------------------------------------------------

/** O `state` carrega o cliente, assinado: ninguém troca o cliente no meio. */
export function buildInstagramAuthUrl(clientId: string) {
  const { appId, redirectUri } = getEnv();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(","),
    state: `${clientId}.${sign(clientId)}`,
    force_reauth: "true",
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export function readInstagramState(state: string | null): string | null {
  const [clientId, signature] = (state ?? "").split(".");
  return clientId && signature && verify(clientId, signature) ? clientId : null;
}

async function graphJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const message =
      data.error?.error_user_msg ??
      data.error?.message ??
      data.error_message ??
      `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function connectInstagramAccount(
  clientId: string,
  code: string,
  userId: string,
) {
  const { appId, appSecret, redirectUri } = getEnv();

  const short = await graphJson<{ access_token: string }>(
    await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    }),
  );

  const long = await graphJson<{ access_token: string; expires_in: number }>(
    await fetch(
      `https://graph.instagram.com/access_token?${new URLSearchParams({
        grant_type: "ig_exchange_token",
        client_secret: appSecret,
        access_token: short.access_token,
      })}`,
    ),
  );

  const me = await graphJson<{ user_id: string; username: string }>(
    await fetch(
      `${GRAPH}/me?fields=user_id,username&access_token=${long.access_token}`,
    ),
  );

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("instagram_accounts").upsert({
    client_id: clientId,
    ig_user_id: me.user_id,
    username: me.username,
    access_token: long.access_token,
    expires_at: new Date(Date.now() + long.expires_in * 1000).toISOString(),
    connected_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return me.username;
}

export async function disconnectInstagramAccount(clientId: string) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("instagram_accounts")
    .delete()
    .eq("client_id", clientId);
  if (error) throw error;
}

export async function listInstagramAccounts(): Promise<
  { client_id: string; username: string; expires_at: string }[]
> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instagram_accounts")
    .select("client_id, username, expires_at");
  if (error) throw error;
  return data ?? [];
}

/** Renova os tokens perto de vencer. O Instagram só renova token com mais de
 * 24h de vida e ainda válido — por isso roda no cron, bem antes do fim. */
export async function refreshExpiringTokens() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instagram_accounts")
    .select("client_id, access_token")
    .lt("expires_at", new Date(Date.now() + REFRESH_BEFORE_MS).toISOString());
  if (error) throw error;

  for (const account of data ?? []) {
    try {
      const fresh = await graphJson<{
        access_token: string;
        expires_in: number;
      }>(
        await fetch(
          `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.access_token}`,
        ),
      );
      await supabase
        .from("instagram_accounts")
        .update({
          access_token: fresh.access_token,
          expires_at: new Date(
            Date.now() + fresh.expires_in * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("client_id", account.client_id);
    } catch (refreshError) {
      console.error("[instagram refresh]", account.client_id, refreshError);
    }
  }
}

// --- Mídia ---------------------------------------------------------------

type Media = { url: string; video: boolean };

function extractDriveId(url: string): string | null {
  const match =
    url.match(/\/(?:file\/d|folders)\/([a-zA-Z0-9_-]+)/) ??
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

function mediaUrl(fileId: string) {
  return `${getEnv().origin}/api/instagram/midia/${fileId}?sig=${sign(fileId)}`;
}

/** O que está no link do Drive do card: um arquivo ou os arquivos da pasta,
 * em ordem de nome. */
async function resolveCardMedia(driveUrl: string | null): Promise<Media[]> {
  const id = driveUrl ? extractDriveId(driveUrl) : null;
  if (!id)
    throw new Error("O card não tem link do Drive com o arquivo ou a pasta.");

  const meta = await getDriveFileMeta(id);
  if (!meta)
    throw new Error("A conta do Drive do estúdio não acessa esse link.");

  const files = isDriveFolderMimeType(meta.mimeType)
    ? (await listDriveFolderMediaRecursive(id)).sort((a, b) =>
        `${a.relativePath}/${a.name}`.localeCompare(
          `${b.relativePath}/${b.name}`,
          "pt-BR",
          {
            numeric: true,
          },
        ),
      )
    : [meta];

  return files
    .filter((f) => /^(image|video)\//.test(f.mimeType))
    .map((f) => ({
      url: mediaUrl(f.id),
      video: f.mimeType.startsWith("video/"),
    }));
}

// --- Publicação ----------------------------------------------------------

export type InstagramPostStatus =
  "agendado" | "processando" | "publicado" | "erro";

export interface InstagramPost {
  card_id: string;
  status: InstagramPostStatus;
  container_id: string | null;
  children_ids: string[];
  media_id: string | null;
  permalink: string | null;
  error: string | null;
}

async function getAccountForCard(cardId: string) {
  const supabase = getSupabaseServerClient();
  const { data: card, error } = await supabase
    .from("backlog_cards")
    .select("id, client_id, format, caption, drive_url, post_date, post_time")
    .eq("id", cardId)
    .single();
  if (error) throw error;
  if (!card.client_id) throw new Error("O card não tem cliente.");

  const { data: account } = await supabase
    .from("instagram_accounts")
    .select("ig_user_id, access_token")
    .eq("client_id", card.client_id)
    .maybeSingle();
  if (!account)
    throw new Error("O Instagram desse cliente não está conectado.");

  return { card, account };
}

async function createContainer(
  igUserId: string,
  token: string,
  fields: Record<string, string>,
) {
  const { id } = await graphJson<{ id: string }>(
    await fetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      body: new URLSearchParams({ ...fields, access_token: token }),
    }),
  );
  return id;
}

async function savePost(
  cardId: string,
  patch: Partial<InstagramPost> & { published_at?: string },
) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("instagram_posts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("card_id", cardId);
  if (error) throw error;
}

/** Manda a mídia pro Instagram. Vídeo ainda vai processar lá; quem publica
 * de fato é `advancePost`, quando o container fica pronto. */
async function startPost(cardId: string) {
  const { card, account } = await getAccountForCard(cardId);
  const media = await resolveCardMedia(card.drive_url);
  const format = card.format as BacklogFormat;
  const token = account.access_token;
  const igUser = account.ig_user_id;
  const caption = card.caption ?? "";
  const asField = (m: Media): Record<string, string> =>
    m.video ? { video_url: m.url } : { image_url: m.url };

  if (format === "carrossel") {
    if (media.length < 2)
      throw new Error("Carrossel precisa de pelo menos 2 arquivos na pasta.");
    const children: string[] = [];
    for (const m of media.slice(0, 10)) {
      children.push(
        await createContainer(igUser, token, {
          ...asField(m),
          ...(m.video ? { media_type: "VIDEO" } : {}),
          is_carousel_item: "true",
        }),
      );
    }
    await savePost(cardId, {
      status: "processando",
      children_ids: children,
      container_id: null,
      error: null,
    });
    return;
  }

  const first =
    format === "reel"
      ? media.find((m) => m.video)
      : format === "foto"
        ? media.find((m) => !m.video)
        : media[0];
  if (!first) {
    throw new Error(
      format === "reel"
        ? "Não achei vídeo no link do Drive."
        : format === "foto"
          ? "Não achei imagem no link do Drive."
          : "Não achei mídia no link do Drive.",
    );
  }

  const fields: Record<string, string> =
    format === "story"
      ? { ...asField(first), media_type: "STORIES" }
      : format === "reel"
        ? { video_url: first.url, media_type: "REELS", caption }
        : { image_url: first.url, caption };

  const container = await createContainer(igUser, token, fields);
  await savePost(cardId, {
    status: "processando",
    container_id: container,
    children_ids: [],
    error: null,
  });
}

async function containerStatus(id: string, token: string) {
  const data = await graphJson<{ status_code: string; status?: string }>(
    await fetch(
      `${GRAPH}/${id}?fields=status_code,status&access_token=${token}`,
    ),
  );
  return data;
}

/** Um passo: espera o processamento, monta o carrossel e publica. */
async function advancePost(post: InstagramPost) {
  const { card, account } = await getAccountForCard(post.card_id);
  const token = account.access_token;

  if (!post.container_id) {
    const statuses = await Promise.all(
      post.children_ids.map((id) => containerStatus(id, token)),
    );
    const failed = statuses.find(
      (s) => s.status_code === "ERROR" || s.status_code === "EXPIRED",
    );
    if (failed)
      throw new Error(
        `Um item do carrossel falhou no Instagram: ${failed.status ?? failed.status_code}`,
      );
    if (!statuses.every((s) => s.status_code === "FINISHED")) return;

    const parent = await createContainer(account.ig_user_id, token, {
      media_type: "CAROUSEL",
      children: post.children_ids.join(","),
      caption: card.caption ?? "",
    });
    await savePost(post.card_id, { container_id: parent });
    post = { ...post, container_id: parent };
  }

  const status = await containerStatus(post.container_id!, token);
  if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
    throw new Error(
      `O Instagram recusou a mídia: ${status.status ?? status.status_code}`,
    );
  }
  if (status.status_code !== "FINISHED") return;

  const { id: mediaId } = await graphJson<{ id: string }>(
    await fetch(`${GRAPH}/${account.ig_user_id}/media_publish`, {
      method: "POST",
      body: new URLSearchParams({
        creation_id: post.container_id!,
        access_token: token,
      }),
    }),
  );
  const { permalink } = await graphJson<{ permalink?: string }>(
    await fetch(`${GRAPH}/${mediaId}?fields=permalink&access_token=${token}`),
  ).catch(() => ({ permalink: undefined }));

  await savePost(post.card_id, {
    status: "publicado",
    media_id: mediaId,
    permalink: permalink ?? null,
    published_at: new Date().toISOString(),
  });
}

async function step(post: InstagramPost) {
  const supabase = getSupabaseServerClient();
  try {
    if (post.status === "agendado") {
      // Cron e botão podem pegar o mesmo card juntos: só segue quem virar o
      // status primeiro, senão o Instagram recebe a mídia duas vezes.
      const { data } = await supabase
        .from("instagram_posts")
        .update({ status: "processando", updated_at: new Date().toISOString() })
        .eq("card_id", post.card_id)
        .eq("status", "agendado")
        .select("card_id");
      if (!data?.length) return;
      await startPost(post.card_id);
    } else if (post.status === "processando") {
      // Ainda criando os containers (o outro lado está no startPost).
      if (!post.container_id && post.children_ids.length === 0) return;
      await advancePost(post);
    }
  } catch (stepError) {
    // Erro de uma segunda tentativa não apaga um post que já saiu.
    await supabase
      .from("instagram_posts")
      .update({
        status: "erro",
        error:
          stepError instanceof Error ? stepError.message : String(stepError),
        updated_at: new Date().toISOString(),
      })
      .eq("card_id", post.card_id)
      .neq("status", "publicado");
  }
}

async function getPost(cardId: string): Promise<InstagramPost | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instagram_posts")
    .select(
      "card_id, status, container_id, children_ids, media_id, permalink, error",
    )
    .eq("card_id", cardId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getInstagramCardState(cardId: string) {
  if (!isInstagramConfigured())
    return { configured: false, username: null, post: null };
  const supabase = getSupabaseServerClient();
  const { data: card } = await supabase
    .from("backlog_cards")
    .select("client_id")
    .eq("id", cardId)
    .maybeSingle();
  const { data: account } = card?.client_id
    ? await supabase
        .from("instagram_accounts")
        .select("username")
        .eq("client_id", card.client_id)
        .maybeSingle()
    : { data: null };
  return {
    configured: isInstagramConfigured(),
    username: (account?.username as string | undefined) ?? null,
    post: await getPost(cardId),
  };
}

/** Agenda (ou reagenda depois de erro) o post do card. */
export async function scheduleInstagramPost(cardId: string, userId: string) {
  await getAccountForCard(cardId);
  const current = await getPost(cardId);
  // Sem isso, clicar de novo num card já postado publicava duas vezes.
  if (current?.status === "publicado")
    throw new Error("Esse card já foi publicado no Instagram.");
  if (current?.status === "processando")
    throw new Error("O Instagram ainda está processando esse post.");
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("instagram_posts").upsert({
    card_id: cardId,
    status: "agendado",
    container_id: null,
    children_ids: [],
    error: null,
    requested_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function cancelInstagramPost(cardId: string) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("instagram_posts")
    .delete()
    .eq("card_id", cardId)
    .in("status", ["agendado", "erro"]);
  if (error) throw error;
}

/** "Publicar agora": manda a mídia e espera um pouco. Foto costuma ficar
 * pronta em segundos; vídeo longo termina no próximo cron. */
export async function publishInstagramNow(cardId: string, userId: string) {
  await scheduleInstagramPost(cardId, userId);
  for (let i = 0; i < 6; i++) {
    const post = await getPost(cardId);
    if (!post || post.status === "publicado" || post.status === "erro") return;
    if (post.status === "processando")
      await new Promise((resolve) => setTimeout(resolve, 4000));
    await step(post);
  }
}

/** Dia e hora do card no horário de Brasília (sem horário de verão desde 2019). */
function dueAt(postDate: string | null, postTime: string | null) {
  if (!postDate) return null;
  // ponytail: sem hora marcada, posta às 9h. Campo próprio se precisar.
  return new Date(`${postDate}T${(postTime ?? "09:00").slice(0, 5)}:00-03:00`);
}

/** Roda no cron: renova tokens, publica o que venceu, avança o que processa. */
export async function runInstagramQueue() {
  await refreshExpiringTokens();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instagram_posts")
    .select(
      "card_id, status, container_id, children_ids, media_id, permalink, error, backlog_cards(post_date, post_time)",
    )
    .in("status", ["agendado", "processando"]);
  if (error) throw error;

  const now = Date.now();
  let handled = 0;
  for (const row of data ?? []) {
    const card = (
      Array.isArray(row.backlog_cards)
        ? row.backlog_cards[0]
        : row.backlog_cards
    ) as { post_date: string | null; post_time: string | null } | null;
    if (row.status === "agendado") {
      const due = dueAt(card?.post_date ?? null, card?.post_time ?? null);
      if (!due || due.getTime() > now) continue;
    }
    await step(row as InstagramPost);
    handled++;
  }
  return handled;
}
