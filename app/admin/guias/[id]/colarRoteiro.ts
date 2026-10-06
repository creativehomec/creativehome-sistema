"use server";

import { revalidatePath } from "next/cache";
import { addScene, addVideo } from "@/lib/guides";
import { chatJson, MODELO_ROTEIRO } from "@/lib/roteiroAi";
import { PROMPT_ORGANIZAR } from "@/lib/roteiroPrompts";
import { schemaOrganizar } from "@/lib/roteiroSchemas";
import {
  type RoteiroOrganizado,
  type VideoImportado,
  organizadoParaVideos,
  verificarIntocado,
} from "@/lib/roteiroTypes";
import { getCurrentSession } from "@/lib/session";

// Erros voltam como valor: exceção de server action chega mascarada no
// cliente em produção, e a mensagem da IA é o que explica o que deu errado.
type Resultado<T> = { ok: true; data: T } | { ok: false; error: string };

const mensagem = (err: unknown) => (err instanceof Error ? err.message : "Erro desconhecido.");

const MAX_ROTEIRO_COLADO = 20000;

/**
 * "Colar roteiro": a IA recorta o texto do cliente em vídeos e cenas sem
 * mudar palavra. Só devolve a prévia, com o resultado da checagem; nada é
 * gravado até a pessoa confirmar.
 */
export async function organizarRoteiroAction(texto: string): Promise<
  Resultado<{ videos: VideoImportado[]; alterados: string[]; deFora: string[] }>
> {
  if (!(await getCurrentSession())) return { ok: false, error: "Sessão expirada." };
  const original = typeof texto === "string" ? texto.trim() : "";
  if (!original) return { ok: false, error: "Cole o roteiro antes de organizar." };
  if (original.length > MAX_ROTEIRO_COLADO) {
    return { ok: false, error: "Roteiro longo demais: separe em partes de até 20 mil caracteres." };
  }
  try {
    const organizado = await chatJson<RoteiroOrganizado>({
      model: MODELO_ROTEIRO,
      system: PROMPT_ORGANIZAR,
      user: original,
      schema: schemaOrganizar,
      temperature: 0,
    });
    const videos = organizadoParaVideos(organizado).filter((v) => v.cenas.length > 0);
    if (videos.length === 0) {
      return { ok: false, error: "A IA não encontrou cenas nesse texto." };
    }
    return { ok: true, data: { videos, ...verificarIntocado(original, organizado) } };
  } catch (err) {
    return { ok: false, error: mensagem(err) };
  }
}

const textos = (v: unknown) =>
  Array.isArray(v) ? v.filter((t): t is string => typeof t === "string" && t.trim() !== "") : [];
const texto = (v: unknown) => (typeof v === "string" ? v : "");

/** Grava no guia a prévia confirmada. Os vídeos vêm do navegador: só passa o formato esperado. */
export async function salvarVideosNoGuiaAction(
  guiaId: string,
  videos: VideoImportado[]
): Promise<Resultado<{ videos: number }>> {
  if (!(await getCurrentSession())) return { ok: false, error: "Sessão expirada." };
  if (typeof guiaId !== "string" || !guiaId) return { ok: false, error: "Guia inválido." };

  const limpos: VideoImportado[] = (Array.isArray(videos) ? videos : [])
    .slice(0, 20)
    .map((v) => ({
      titulo: texto(v?.titulo).trim() || "Sem título",
      notas_producao: texto(v?.notas_producao),
      cenas: (Array.isArray(v?.cenas) ? v.cenas : []).slice(0, 60).map((c) => ({
        script: texto(c?.script),
        description: texto(c?.description),
        hooks_alternativos: textos(c?.hooks_alternativos),
        ctas_alternativos: textos(c?.ctas_alternativos),
      })),
    }))
    .filter((v) => v.cenas.length > 0);
  if (limpos.length === 0) return { ok: false, error: "Nada para adicionar." };

  try {
    // ponytail: vídeos e cenas entram um a um, sem transação; se cair no meio
    // o vídeo fica pela metade no guia e dá pra apagar pelo editor.
    for (const video of limpos) {
      const criado = await addVideo(guiaId, video.titulo, video.notas_producao);
      for (const cena of video.cenas) {
        await addScene(criado.id, { ...cena, description: cena.description ?? "" });
      }
    }
    revalidatePath(`/admin/guias/${guiaId}`);
    return { ok: true, data: { videos: limpos.length } };
  } catch (err) {
    return { ok: false, error: mensagem(err) };
  }
}
