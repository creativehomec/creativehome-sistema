import Link from "next/link";
import { listEntregasColumnsWithCounts } from "@/lib/backlog";
import { getPortalSession, listMediaForCards, listPortalCards } from "@/lib/clientPortal";
import { toPickerImages, getGalleryClientWithImages } from "@/lib/galleries";
import { AttachMediaProvider } from "./AttachMedia";
import { MaterialItem } from "./MaterialItem";
import { PortalBoard } from "./PortalBoard";
import { shortDate } from "./shortDate";
import { pCard, pLead, pSeg, pSegWrap, pTitle } from "../portalUi";

export const dynamic = "force-dynamic";

function Wrapper({
  images,
  children,
}: {
  images: ReturnType<typeof toPickerImages> | null;
  children: React.ReactNode;
}) {
  return images ? <AttachMediaProvider images={images}>{children}</AttachMediaProvider> : <>{children}</>;
}

export default async function MateriaisPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; abrir?: string }>;
}) {
  const { clientId, preview } = await getPortalSession();
  const query = await searchParams;
  const showApproved = query.v === "aprovados";
  const showBoard = query.v === "quadro";
  const open = query.abrir;
  const all = await listPortalCards(clientId);
  const cards = all.filter((c) => c.in_review);
  const media = showBoard ? {} : await listMediaForCards(clientId, cards);
  // Só a equipe (prévia) conecta arquivos; o cliente nem recebe a lista.
  const pickerImages = preview && !showBoard ? toPickerImages((await getGalleryClientWithImages(clientId))?.images ?? []) : null;
  const waiting = cards.filter((c) => !c.approved_at);
  const done = cards.filter((c) => c.approved_at);
  const list = showApproved ? done : waiting;

  return (
    <div className="space-y-6">
      <header>
        <h1 className={pTitle}>Materiais</h1>
        <p className={pLead}>Abra cada material para conferir e registrar a sua aprovação.</p>
      </header>

      <div role="group" aria-label="Filtrar materiais" className={pSegWrap}>
        {[
          { label: `Aguardando (${waiting.length})`, href: "/cliente/materiais", on: !showApproved && !showBoard },
          { label: `Aprovados (${done.length})`, href: "/cliente/materiais?v=aprovados", on: showApproved },
          { label: "Quadro", href: "/cliente/materiais?v=quadro", on: showBoard },
        ].map((t) => (
          <Link key={t.label} href={t.href} aria-current={t.on ? "true" : undefined} className={pSeg(t.on)}>
            {t.label}
          </Link>
        ))}
      </div>

      {showBoard ? (
        <PortalBoard
          columns={(await listEntregasColumnsWithCounts()).filter((c) => c.clientVisible)}
          cards={all}
        />
      ) : list.length ? (
        <Wrapper images={pickerImages}>
          <ul className={`${pCard} p-0`}>
            {list.map((card) => (
              <MaterialItem
                key={card.id}
                defaultOpen={card.id === open}
                material={{
                  id: card.id,
                  title: card.title,
                  format: card.format,
                  dateLabel: card.post_date ? shortDate(card.post_date) : null,
                  cover_url: card.cover_url,
                  drive_url: card.drive_url,
                  caption: card.caption,
                  approved: Boolean(card.approved_at),
                  changesRequested: Boolean(card.changes_requested_at),
                  feedback: card.client_feedback,
                  approvedByTeam: Boolean(card.approver && card.approver.role !== "client"),
                  mediaIds: card.media_image_ids ?? [],
                  guide: card.guide,
                  items: media[card.id] ?? [],
                }}
              />
            ))}
          </ul>
        </Wrapper>
      ) : (
        <p className={`${pCard} text-[var(--p-muted)]`}>
          {showApproved ? "Nenhum material aprovado até o momento." : "Nenhum material aguardando aprovação."}
        </p>
      )}
    </div>
  );
}
