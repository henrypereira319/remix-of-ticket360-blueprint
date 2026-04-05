import { ArrowUpRight, CalendarClock, MapPinned, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OrganizerEventSnapshot } from "@/server/organizer.service";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const publicationMeta = {
  published: { label: "Publicado", variant: "default" as const },
  draft: { label: "Rascunho", variant: "secondary" as const },
  cancelled: { label: "Cancelado", variant: "secondary" as const },
  archived: { label: "Arquivado", variant: "outline" as const },
};

export const OrganizerAgendaPreviewPanel = ({
  events,
  eventMetaBySlug,
}: {
  events: OrganizerEventSnapshot[];
  eventMetaBySlug: Map<string, { dateLabel: string; totalSeats: number | null }>;
}) => {
  const featured = events.slice(0, 4);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Agenda e preview</p>
            <h3 className="text-2xl font-semibold text-foreground">Calendario comercial do produtor</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Recorte para checar o que esta no ar, o que pede revisao e o que merece mais distribuicao agora.
            </p>
          </div>

          <div className="grid gap-3">
            {featured.map((eventSnapshot) => {
              const publication = publicationMeta[eventSnapshot.publicationStatus];
              const eventMeta = eventMetaBySlug.get(eventSnapshot.event.slug);

              return (
                <div key={eventSnapshot.event.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={publication.variant}>{publication.label}</Badge>
                        {eventSnapshot.underReviewOrders > 0 ? (
                          <Badge variant="secondary">{eventSnapshot.underReviewOrders} em revisao</Badge>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-lg font-semibold text-foreground">{eventSnapshot.event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {eventMeta?.dateLabel ?? "Data a confirmar"} - {eventSnapshot.event.venueName}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border px-2.5 py-1">
                          Bruto {currencyFormatter.format(eventSnapshot.grossRevenue)}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1">
                          Tickets {eventSnapshot.issuedTickets}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1">
                          A partir de {currencyFormatter.format(eventSnapshot.event.priceFrom)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
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
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/eventos/${eventSnapshot.event.slug}/checkout`}>
                          <Ticket className="h-4 w-4" />
                          Checkout
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Prioridades do dia</p>
            <h3 className="text-2xl font-semibold text-foreground">Fila curta do produtor</h3>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <CalendarClock className="h-4 w-4 text-primary" />
                O que precisa agir agora
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                <p>{events.filter((event) => event.status === "attention").length} evento(s) com risco operacional imediato.</p>
                <p>{events.filter((event) => event.publicationStatus === "draft").length} evento(s) ainda em rascunho.</p>
                <p>{events.filter((event) => event.grossRevenue === 0 && event.publicationStatus === "published").length} evento(s) publicados sem venda.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Checklist comercial</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                <p>1. Validar preview e checkout dos eventos no ar.</p>
                <p>2. Revisar eventos com fila manual, falha de notificacao ou fee na fila.</p>
                <p>3. Confirmar repasse pronto, bruto e taxa antes do fechamento do periodo.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
