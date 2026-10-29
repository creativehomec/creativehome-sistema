import { NextResponse, type NextRequest } from "next/server";
import { fetchDriveFileBytes } from "@/lib/googleDrive";
import { verifyMediaSignature } from "@/lib/instagram";

type Params = Promise<{ fileId: string }>;

/**
 * De onde o Instagram baixa a foto ou o vídeo do post. Público, mas só com a
 * assinatura que `lib/instagram.ts` gera pro arquivo: sem ela é 404.
 */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { fileId } = await params;
  const signature = request.nextUrl.searchParams.get("sig") ?? "";
  if (!verifyMediaSignature(fileId, signature)) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const file = await fetchDriveFileBytes(fileId, request.headers.get("range"), request.signal);
  if (!file) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const headers = new Headers({
    "Content-Type": file.contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  });
  if (file.contentLength) headers.set("Content-Length", file.contentLength);
  if (file.contentRange) headers.set("Content-Range", file.contentRange);
  return new NextResponse(file.body, { status: file.status, headers });
}
