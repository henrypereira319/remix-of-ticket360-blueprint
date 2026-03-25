import { useMemo } from "react";
import { ExternalLink, MapPin, QrCode, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useAccountTickets } from "@/hooks/use-account-tickets";
import { useCatalogEvents } from "@/hooks/use-catalog-events";
import { getEventDateLabel } from "@/lib/social-backend";

const TicketsPage = () => {
  const { currentAccount } = useAuth();
  const accountId = currentAccount?.id;
  const { tickets } = useAccountTickets(accountId);
  const { events } = useCatalogEvents();

  const eventLookup = useMemo(() => new Map(events.map((event) => [event.slug, event])), [events]);
  const sortedTickets = useMemo(
    () =>
      [...tickets].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    [tickets],
  );
  const uniqueEventCount = useMemo(
    () => new Set(sortedTickets.map((ticket) => ticket.eventSlug)).size,
    [sortedTickets],
  );

  return (
    <div className="space-y-4 safe-top lg:px-6 lg:pb-6">
      <div className="px-4 pt-4 lg:px-0 lg:pt-6">
        <h1 className="text-xl font-bold text-foreground font-display">Meus Tickets</h1>
        <p className="mt-1 text-xs text-muted-foreground">Ingressos emitidos, wallet e acesso rapido ao evento</p>
      </div>

      {sortedTickets.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 px-4 lg:px-0 xl:max-w-[34rem]">
            <div className="rounded-[1.5rem] border border-white/5 bg-surface/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-social">Ingressos ativos</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{sortedTickets.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Emitidos para sua conta conectada.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/5 bg-surface/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Eventos no wallet</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{uniqueEventCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Catalogo e tickets sincronizados pelo backend.</p>
            </div>
          </div>

          <div className="space-y-4 px-4 lg:px-0">
            {sortedTickets.map((ticket) => {
              const event = eventLookup.get(ticket.eventSlug);

              return (
                <div
                  key={ticket.id}
                  className="overflow-hidden rounded-[1.9rem] border border-white/5 bg-surface/70 shadow-[0_18px_44px_-30px_rgba(0,0,0,0.95)]"
                >
                  <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:h-full">
                      <img
                        src={event?.image ?? event?.bannerImage ?? "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=600&fit=crop"}
                        alt={event?.title ?? ticket.eventSlug}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:bg-gradient-to-r" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 md:hidden">
                        <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                          {ticket.status}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-semibold text-white/80">
                          {ticket.sectionName}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="hidden rounded-full border border-social/30 bg-social/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-social md:inline-flex">
                            {ticket.status}
                          </span>
                          <h2 className="mt-2 truncate text-lg font-semibold text-foreground md:text-xl">
                            {event?.title ?? ticket.eventSlug}
                          </h2>
                          <p className="mt-1 text-xs text-muted-foreground">{getEventDateLabel(event)}</p>
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-social" />
                            <span className="truncate">{event ? `${event.venueName} • ${event.city}` : "Evento conectado ao backend"}</span>
                          </p>
                        </div>

                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-background/50 md:flex">
                          <QrCode className="h-6 w-6 text-social" />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-[1.5rem] bg-background/45 p-3 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Titular</p>
                          <p className="mt-1 truncate text-sm font-medium text-foreground">{ticket.holderName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Setor</p>
                          <p className="mt-1 truncate text-sm font-medium text-foreground">{ticket.sectionName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Assento</p>
                          <p className="mt-1 truncate text-sm font-medium text-foreground">{ticket.label}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Pedido</p>
                          <p className="mt-1 truncate text-sm font-medium text-foreground">{ticket.orderReference}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to={`/eventos/${ticket.eventSlug}`}
                          className="inline-flex items-center gap-2 rounded-full border border-social/25 bg-social/10 px-4 py-2 text-xs font-semibold text-social transition-colors hover:bg-social/15"
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          Ver evento
                        </Link>
                        <Link
                          to={ticket.walletUrl}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/55 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-background/70"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir wallet
                        </Link>
                      </div>

                      <p className="mt-4 text-[11px] text-muted-foreground">
                        Barcode {ticket.barcode} • atualizacao {new Date(ticket.updatedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="px-4 lg:px-0">
          <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-border bg-surface/45 px-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
              <Ticket className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Seus ingressos vao aparecer aqui assim que forem emitidos
            </p>
            <p className="max-w-xs text-[11px] text-muted-foreground/70">
              Assim que o backend gerar tickets para sua conta, esta tela passa a mostrar status, wallet e acesso ao evento.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
