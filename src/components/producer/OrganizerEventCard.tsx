import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Globe2,
  LoaderCircle,
  Mail,
  MapPinned,
  Ticket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OrganizerEventSnapshot } from "@/server/organizer.service";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatDateTime = (value?: string | null) => (value ? dateFormatter.format(new Date(value)) : "--");

const statusMeta = {
  published: {
    label: "Sem operacao",
    variant: "outline" as const,
    helper: "Evento pronto, mas ainda sem pedidos relevantes nesta base.",
  },
  selling: {
    label: "Com vendas",
    variant: "default" as const,
    helper: "Evento com pedidos, emissao ou historico financeiro.",
  },
  attention: {
    label: "Em atencao",
    variant: "secondary" as const,
    helper: "Existem pendencias manuais ou sinais de revisao.",
  },
};

const publicationMeta = {
  published: {
    label: "Publicado",
    variant: "default" as const,
  },
  draft: {
    label: "Rascunho",
    variant: "secondary" as const,
  },
  cancelled: {
    label: "Cancelado",
    variant: "secondary" as const,
  },
  archived: {
    label: "Arquivado",
    variant: "outline" as const,
  },
};

export const OrganizerEventCard = ({
  snapshot,
  canManagePublication = false,
  canEdit = false,
  canArchive = false,
  publicationBusy = false,
  archiveBusy = false,
  onPublicationToggle,
  onEdit,
  onArchive,
}: {
  snapshot: OrganizerEventSnapshot;
  canManagePublication?: boolean;
  canEdit?: boolean;
  canArchive?: boolean;
  publicationBusy?: boolean;
  archiveBusy?: boolean;
  onPublicationToggle?: (snapshot: OrganizerEventSnapshot) => void;
  onEdit?: (snapshot: OrganizerEventSnapshot) => void;
  onArchive?: (snapshot: OrganizerEventSnapshot) => void;
}) => {
  const status = statusMeta[snapshot.status];
  const publication = publicationMeta[snapshot.publicationStatus];
  const publicEventHref = `/eventos/${snapshot.event.slug}`;
  const seatMapHref = `/eventos/${snapshot.event.slug}/assentos`;
  const publicationActionLabel = snapshot.publicationStatus === "published" ? "Despublicar" : "Publicar";

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={publication.variant}>{publication.label}</Badge>
              <Badge variant="outline">{snapshot.event.category}</Badge>
              {snapshot.underReviewOrders > 0 ? <Badge variant="secondary">{snapshot.underReviewOrders} em revisao</Badge> : null}
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-2xl font-semibold text-foreground">{snapshot.event.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{status.helper}</p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-2.5 py-1">
                {snapshot.event.details.organizer}
              </span>
              <span className="rounded-full border border-border bg-background px-2.5 py-1">
                {snapshot.event.venueName}
              </span>
              <span className="rounded-full border border-border bg-background px-2.5 py-1">
                {snapshot.event.city}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button asChild size="sm" variant="outline">
              <Link to={publicEventHref}>
                <ArrowRight className="h-4 w-4" />
                Pagina publica
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={seatMapHref}>
                <MapPinned className="h-4 w-4" />
                Mapa e checkout
              </Link>
            </Button>
            {canManagePublication ? (
              <Button
                size="sm"
                variant={snapshot.publicationStatus === "published" ? "secondary" : "default"}
                onClick={() => onPublicationToggle?.(snapshot)}
                disabled={publicationBusy}
              >
                {publicationBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
                {publicationActionLabel}
              </Button>
            ) : null}
            {canEdit ? (
              <Button size="sm" variant="outline" onClick={() => onEdit?.(snapshot)} disabled={publicationBusy || archiveBusy}>
                <CalendarClock className="h-4 w-4" />
                Editar
              </Button>
            ) : null}
            {canArchive ? (
              <Button size="sm" variant="outline" onClick={() => onArchive?.(snapshot)} disabled={archiveBusy || publicationBusy}>
                {archiveBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleAlert className="h-4 w-4" />}
                Arquivar
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pedidos</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{snapshot.totalOrders}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {snapshot.approvedOrders} aprovados - {snapshot.cancelledOrders} cancelados
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Receita bruta</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{currencyFormatter.format(snapshot.grossRevenue)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Autorizado {currencyFormatter.format(snapshot.authorizedRevenue)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ingressos</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{snapshot.issuedTickets}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cancelados {snapshot.cancelledTickets} - Fee {currencyFormatter.format(snapshot.platformFeeRevenue)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Comunicacao</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{snapshot.sentNotifications}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Falhas {snapshot.failedNotifications} - Analytics {snapshot.analyticsEvents}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sinais do modulo</p>
            <div className="grid gap-2">
              {snapshot.diagnostics.map((diagnostic) => (
                <div key={diagnostic} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  {diagnostic}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground lg:min-w-72">
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <div className="inline-flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Ultima atividade
              </div>
              <p className="mt-2 font-medium text-foreground">{formatDateTime(snapshot.lastActivityAt)}</p>
            </div>

            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <div className="inline-flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                Ultimo pedido
              </div>
              <p className="mt-2 font-medium text-foreground">{formatDateTime(snapshot.latestOrderAt)}</p>
            </div>

            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <div className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Pendencia imediata
              </div>
              <p className="mt-2 font-medium text-foreground">
                {snapshot.status === "attention" ? "Revisar fila manual e comunicacao." : "Sem bloqueio operacional aberto."}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <div className="inline-flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-primary" />
                Publicacao
              </div>
              <p className="mt-2 font-medium text-foreground">
                {snapshot.publicationStatus === "published"
                  ? `No ar${snapshot.publishedAt ? ` desde ${formatDateTime(snapshot.publishedAt)}` : "."}`
                  : "Fora do catalogo publico neste ambiente."}
              </p>
            </div>

            {snapshot.pendingPlatformFeeRevenue > 0 ? (
              <div className="rounded-xl border border-border bg-background px-3 py-2">
                <div className="inline-flex items-center gap-2">
                  <CircleAlert className="h-4 w-4 text-primary" />
                  Fee na fila
                </div>
                <p className="mt-2 font-medium text-foreground">
                  {currencyFormatter.format(snapshot.pendingPlatformFeeRevenue)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
