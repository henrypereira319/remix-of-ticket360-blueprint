import { ArrowUpRight, MapPinned } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrganizerEventSnapshot } from "@/server/organizer.service";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

const statusMeta = {
  published: { label: "Sem operacao", variant: "outline" as const },
  selling: { label: "Com vendas", variant: "default" as const },
  attention: { label: "Em atencao", variant: "secondary" as const },
};

const publicationMeta = {
  published: { label: "Publicado", variant: "default" as const },
  draft: { label: "Rascunho", variant: "secondary" as const },
  cancelled: { label: "Cancelado", variant: "secondary" as const },
  archived: { label: "Arquivado", variant: "outline" as const },
};

export const OrganizerEventPerformanceTable = ({
  events,
  eventMetaBySlug,
}: {
  events: OrganizerEventSnapshot[];
  eventMetaBySlug: Map<string, { dateLabel: string; totalSeats: number | null }>;
}) => (
  <div className="rounded-3xl border border-border bg-card">
    <div className="space-y-2 border-b border-border p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Leitura por evento</p>
      <h3 className="text-2xl font-semibold text-foreground">Cockpit detalhado do produtor</h3>
      <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
        Tabela executiva para decidir onde atuar primeiro: eventos com melhor repasse, gargalos de revisao, comunicacao,
        ocupacao e links rapidos para preview da vitrine e mapa.
      </p>
    </div>

    <ScrollArea className="w-full">
      <Table className="min-w-[1180px]">
        <TableHeader>
          <TableRow>
            <TableHead>Evento</TableHead>
            <TableHead>Agenda</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Pedidos</TableHead>
            <TableHead className="text-right">Bruto</TableHead>
            <TableHead className="text-right">Repasse</TableHead>
            <TableHead className="text-right">Taxa</TableHead>
            <TableHead>Ocupacao</TableHead>
            <TableHead className="text-right">Comunicacao</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((eventSnapshot) => {
            const status = statusMeta[eventSnapshot.status];
            const publication = publicationMeta[eventSnapshot.publicationStatus];
            const eventMeta = eventMetaBySlug.get(eventSnapshot.event.slug);
            const totalSeats = eventMeta?.totalSeats ?? null;
            const occupancy = totalSeats ? Math.min((eventSnapshot.issuedTickets / totalSeats) * 100, 100) : null;
            const payoutReady = Math.max(eventSnapshot.authorizedRevenue - eventSnapshot.platformFeeRevenue, 0);

            return (
              <TableRow key={eventSnapshot.event.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{eventSnapshot.event.title}</p>
                      <Badge variant="outline">{eventSnapshot.event.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {eventSnapshot.event.venueName} - {eventSnapshot.event.city}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{eventMeta?.dateLabel ?? "Data a confirmar"}</p>
                    <p className="text-xs text-muted-foreground">
                      A partir de {currencyFormatter.format(eventSnapshot.event.priceFrom)}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <Badge variant={publication.variant}>{publication.label}</Badge>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{eventSnapshot.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">
                      {eventSnapshot.approvedOrders} aprov. - {eventSnapshot.underReviewOrders} revisao
                    </p>
                  </div>
                </TableCell>

                <TableCell className="text-right font-semibold text-foreground">
                  {currencyFormatter.format(eventSnapshot.grossRevenue)}
                </TableCell>

                <TableCell className="text-right">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{currencyFormatter.format(payoutReady)}</p>
                    <p className="text-xs text-muted-foreground">
                      Autorizado {currencyFormatter.format(eventSnapshot.authorizedRevenue)}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{currencyFormatter.format(eventSnapshot.platformFeeRevenue)}</p>
                    <p className="text-xs text-muted-foreground">
                      Fila {currencyFormatter.format(eventSnapshot.pendingPlatformFeeRevenue)}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  {occupancy !== null ? (
                    <div className="min-w-44 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{eventSnapshot.issuedTickets}/{totalSeats} emitidos</span>
                        <span className="font-medium text-foreground">{percentFormatter.format(occupancy)}%</span>
                      </div>
                      <Progress value={occupancy} className="h-2.5 bg-muted" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Capacidade fora do seed local</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{eventSnapshot.sentNotifications}</p>
                    <p className="text-xs text-muted-foreground">
                      {eventSnapshot.failedNotifications} falhas - {eventSnapshot.analyticsEvents} analytics
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/eventos/${eventSnapshot.event.slug}`}>
                        <ArrowUpRight className="h-4 w-4" />
                        Preview
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/eventos/${eventSnapshot.event.slug}/assentos`}>
                        <MapPinned className="h-4 w-4" />
                        Mapa
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  </div>
);
