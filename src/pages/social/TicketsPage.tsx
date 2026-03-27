import { useMemo } from "react";
import { ExternalLink, MapPin, QrCode, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SocialPageHero from "@/components/social/SocialPageHero";
import { GlassButton } from "@/components/ui/glass-button";
import { useAuth } from "@/hooks/use-auth";
import { useAccountTickets } from "@/hooks/use-account-tickets";
import { useCatalogEvents } from "@/hooks/use-catalog-events";
import { getEventDateLabel } from "@/lib/social-backend";

const TicketsPage = () => {
  const { currentAccount } = useAuth();
  const navigate = useNavigate();
  const accountId = currentAccount?.id;
  const { tickets } = useAccountTickets(accountId);
  const { events } = useCatalogEvents();

  const eventLookup = useMemo(() => new Map(events.map((event) => [event.slug, event])), [events]);
  const sortedTickets = useMemo(
    () => [...tickets].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    [tickets],
  );
  const uniqueEventCount = useMemo(() => new Set(sortedTickets.map((ticket) => ticket.eventSlug)).size, [sortedTickets]);

  return (
    <div className="space-y-5 safe-top lg:px-6 lg:pb-6">
      <div className="px-4 pt-4 lg:px-0 lg:pt-6">
        <SocialPageHero
          eyebrow="Acesso rapido"
          title="Wallet, QR e entrada no mesmo fluxo"
          subtitle="Seus tickets ficam organizados com a mesma linguagem premium da home, sem mudar as acoes que voce ja usa para abrir o evento e acessar a wallet."
          action={
            <div className="hidden h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/10 bg-black/55 text-white md:flex">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
          }
          footer={
            <div className="grid gap-3 md:grid-cols-3">
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Ingressos ativos</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">{sortedTickets.length}</p>
                <p className="mt-1 text-xs text-white/45">Emitidos para sua conta conectada.</p>
              </div>
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">Eventos no wallet</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">{uniqueEventCount}</p>
                <p className="mt-1 text-xs text-white/45">Eventos sincronizados no catalogo e na conta.</p>
              </div>
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Status do acesso</p>
                <p className="mt-3 text-lg font-bold text-white">{sortedTickets.length > 0 ? "Pronto para entrar" : "Aguardando emissao"}</p>
                <p className="mt-1 text-xs text-white/45">QR code, titular e pedido ficam agrupados em cada card.</p>
              </div>
            </div>
          }
        />
      </div>

      {sortedTickets.length > 0 ? (
        <>
          <div className="space-y-4 px-4 lg:px-0">
            {sortedTickets.map((ticket) => {
              const event = eventLookup.get(ticket.eventSlug);

              return (
                <div
                  key={ticket.id}
                  className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-black/60 shadow-[0_28px_80px_-48px_rgba(0,0,0,1)] backdrop-blur-2xl"
                >
                  <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:h-full">
                      <img
                        src={event?.image ?? event?.bannerImage ?? "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=600&fit=crop"}
                        alt={event?.title ?? ticket.eventSlug}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent md:bg-gradient-to-r" />
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
                          <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary md:inline-flex">
                            {ticket.status}
                          </span>
                          <h2 className="mt-2 truncate text-lg font-semibold text-white md:text-xl">
                            {event?.title ?? ticket.eventSlug}
                          </h2>
                          <p className="mt-1 text-xs text-white/45">{getEventDateLabel(event)}</p>
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-white/50">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">{event ? `${event.venueName} - ${event.city}` : "Evento conectado ao backend"}</span>
                          </p>
                        </div>

                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] md:flex">
                          <QrCode className="h-6 w-6 text-primary" />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3 text-xs text-white/50 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Titular</p>
                          <p className="mt-1 truncate text-sm font-medium text-white">{ticket.holderName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Setor</p>
                          <p className="mt-1 truncate text-sm font-medium text-white">{ticket.sectionName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Assento</p>
                          <p className="mt-1 truncate text-sm font-medium text-white">{ticket.label}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Pedido</p>
                          <p className="mt-1 truncate text-sm font-medium text-white">{ticket.orderReference}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <GlassButton
                          onClick={() => navigate(`/eventos/${ticket.eventSlug}`)}
                          size="sm"
                          className="text-primary"
                          contentClassName="flex items-center gap-2 px-4 py-2 text-xs font-semibold"
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          Ver evento
                        </GlassButton>
                        <GlassButton
                          onClick={() => navigate(ticket.walletUrl)}
                          size="sm"
                          contentClassName="flex items-center gap-2 px-4 py-2 text-xs font-semibold"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir wallet
                        </GlassButton>
                      </div>

                      <p className="mt-4 text-[11px] text-white/40">
                        Barcode {ticket.barcode} - atualizacao {new Date(ticket.updatedAt).toLocaleString("pt-BR")}
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
          <div className="nocturne-empty-state flex min-h-[24rem] flex-col items-center justify-center gap-3 px-4 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Ticket className="h-8 w-8 text-white/25" />
            </div>
            <p className="text-sm font-medium text-white/60">Seus ingressos vao aparecer aqui assim que forem emitidos</p>
            <p className="max-w-xs text-[11px] text-white/40">
              Assim que o backend gerar tickets para sua conta, esta tela passa a mostrar status, wallet e acesso ao evento.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
