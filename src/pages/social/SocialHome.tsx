import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPinned,
  MessageCircle,
  Percent,
  Search,
  ShoppingBag,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import FeedCard from "@/components/social/FeedCard";
import SocialEventCard from "@/components/social/SocialEventCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  mockHeroEvent,
  mockNotificationCounts,
  mockFeedItems,
  mockFriends,
  mockSocialEvents,
  mockSplitRequests,
} from "@/data/social-mock";
import { useAuth } from "@/hooks/use-auth";
import { useAccountNotifications } from "@/hooks/use-account-notifications";
import { useAccountOrders } from "@/hooks/use-account-orders";
import { useAccountTickets } from "@/hooks/use-account-tickets";
import { useCatalogEvents } from "@/hooks/use-catalog-events";
import {
  buildFeedItemsFromBackend,
  buildHeroEventFromBackend,
  buildSocialEventsFromBackend,
} from "@/lib/social-backend";

const formatCapacity = (seats: number | undefined) => {
  if (!seats) {
    return "INGRESSOS LIMITADOS";
  }

  return `${new Intl.NumberFormat("pt-BR").format(seats)} LUGARES`;
};

const ActionPill = ({
  icon: Icon,
  label,
  to,
  badge,
}: {
  icon: typeof MessageCircle;
  label: string;
  to: string;
  badge?: number;
}) => (
  <Link to={to} className="flex flex-col items-center gap-2">
    <div className="action-button">
      <Icon className="h-6 w-6 text-white" strokeWidth={2} />
      {badge ? <span className="action-badge">{badge}</span> : null}
    </div>
    <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">{label}</span>
  </Link>
);

const InfoCard = ({
  title,
  subtitle,
  icon: Icon,
  tone,
  to,
}: {
  title: string;
  subtitle: string;
  icon: typeof Users;
  tone: "primary" | "secondary" | "tertiary" | "neutral";
  to: string;
}) => (
  <Link
    to={to}
    className="glass-panel group flex items-center justify-between rounded-2xl border border-white/10 p-4 transition-colors hover:bg-white/5"
  >
    <div>
      <p className="text-xs font-bold text-white">{title}</p>
      <p className="text-[10px] text-white/40">{subtitle}</p>
    </div>
    <Icon
      className={
        tone === "primary"
          ? "h-4 w-4 text-primary"
          : tone === "secondary"
            ? "h-4 w-4 text-secondary"
            : tone === "tertiary"
              ? "h-4 w-4 text-cyan-300"
              : "h-4 w-4 text-white/40"
      }
    />
  </Link>
);

const OfficialAlertCard = ({ eventName }: { eventName: string }) => (
  <Link
    to="/app/tickets"
    className="group relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground transition-transform hover:scale-[1.01]"
  >
    <div className="absolute -bottom-4 -right-4 opacity-15 transition-transform duration-500 group-hover:scale-110">
      <Ticket className="h-24 w-24" />
    </div>
    <div className="relative z-10">
      <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground/60">
        ALERTA OFICIAL
      </span>
      <p className="mt-2 font-headline text-2xl font-extrabold leading-tight">Acesso ao after</p>
      <p className="mt-2 text-[11px] leading-5 text-primary-foreground/80">
        Convite exclusivo liberado para a sessão premium de {eventName}. Entrada pela porta lateral após o headliner.
      </p>
      <span className="mt-8 inline-flex rounded-full bg-black px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white">
        Liberar acesso
      </span>
    </div>
  </Link>
);

const MapPreviewCard = ({ image }: { image: string }) => (
  <Link
    to="/app/mapa"
    className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/60"
  >
    <img src={image} alt="Mapa do evento" className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6" />
    <div className="relative flex h-full flex-col justify-end p-6">
      <p className="text-sm font-bold text-white">Pulso do evento</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">MAPA AO VIVO</p>
      <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60 transition-colors group-hover:text-white">
        Abrir mapa interativo
        <MapPinned className="h-4 w-4" />
      </span>
    </div>
  </Link>
);

const SocialHome = () => {
  const { currentAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<"eventos" | "feed">("eventos");
  const accountId = currentAccount?.id;
  const { events } = useCatalogEvents();
  const { orders } = useAccountOrders(accountId);
  const { tickets } = useAccountTickets(accountId);
  const { notifications } = useAccountNotifications(accountId);

  const fullName = currentAccount?.fullName ?? "Visitante";
  const firstName = fullName.split(" ")[0];

  const heroEvent = useMemo(
    () => buildHeroEventFromBackend({ events, orders, tickets }) ?? mockHeroEvent,
    [events, orders, tickets],
  );

  const heroEventData = useMemo(
    () => events.find((event) => event.slug === heroEvent.slug) ?? events[0],
    [events, heroEvent.slug],
  );

  const socialEvents = useMemo(() => {
    const mappedEvents = buildSocialEventsFromBackend({ events, orders, tickets });
    return mappedEvents.length > 0 ? mappedEvents : mockSocialEvents;
  }, [events, orders, tickets]);

  const feedItems = useMemo(() => {
    const mappedFeed = buildFeedItemsFromBackend({
      accountId,
      accountName: fullName,
      events,
      orders,
      tickets,
    });

    return mappedFeed.length > 0 ? mappedFeed : mockFeedItems;
  }, [accountId, events, fullName, orders, tickets]);

  const acceptedFriends = mockFriends.filter((friend) => friend.status === "accepted").length;
  const pendingRequests = mockFriends.length - acceptedFriends;
  const activeOrders = orders.filter((order) => order.status === "submitted" || order.status === "under_review").length;
  const quickActionCounts = currentAccount
    ? {
        messages: 0,
        requests: notifications.length,
        splits: mockSplitRequests.length,
        orders: activeOrders,
      }
    : mockNotificationCounts;
  const avatarSeed = currentAccount?.id ?? currentAccount?.email ?? fullName;

  const recentMovement = feedItems[0];
  const venueLabel = heroEventData ? `${heroEventData.venueName}, ${heroEventData.city}` : heroEvent.tagline;
  const heroDateLabel = heroEventData
    ? `${heroEventData.weekday.toUpperCase()} • ${heroEventData.day.padStart(2, "0")}/${heroEventData.month.toUpperCase()} • ${heroEventData.time}`
    : heroEvent.date;

  const visibleEvents = socialEvents.slice(0, 3);
  const visibleFeed = feedItems.slice(0, 3);

  return (
    <div className="min-h-screen max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border border-white/10 bg-black/40">
            <AvatarImage src={`https://i.pravatar.cc/160?u=${encodeURIComponent(avatarSeed)}`} alt={fullName} />
            <AvatarFallback className="bg-black/40 text-xs font-bold text-primary">
              {fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-headline text-sm font-bold text-white">Olá, {firstName}</h2>
            <p className="text-[10px] text-white/40">Sua rede, seus pedidos e seus rolês do momento.</p>
          </div>
        </div>
        <button className="glass-panel flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition-colors hover:bg-white/10">
          <Search className="h-5 w-5" />
        </button>
      </header>

      <section className="relative mb-8 mt-4 flex min-h-[68vh] flex-col justify-end overflow-hidden rounded-[2.5rem] border border-white/5 p-8 shadow-2xl md:min-h-[74vh] md:p-16 lg:min-h-[calc(100vh-10rem)]">
        <img
          src={heroEvent.image}
          alt={heroEvent.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-gradient absolute inset-0" />

        <div className="relative z-10 w-full max-w-4xl">
          <div className="mb-4">
            <span className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              REDE EVENTHUB
            </span>
          </div>

          <h1 className="text-shadow-glow font-headline text-5xl font-extrabold leading-[0.9] tracking-tighter text-white md:text-7xl lg:text-8xl">
            {heroEvent.name}
          </h1>
          <p className="mb-8 mt-2 font-headline text-sm font-bold uppercase tracking-[0.3em] text-white/60 md:text-lg">
            {venueLabel}
          </p>

          <div className="mb-12 flex items-center gap-6 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            <span>{heroDateLabel}</span>
            <span>{formatCapacity(heroEventData?.seatMap.totalSeats)}</span>
          </div>

          <div className="mb-12 flex flex-wrap gap-8 md:gap-12">
            <ActionPill icon={MessageCircle} label="Mensagem" to="/app/amigos" badge={quickActionCounts.messages || undefined} />
            <ActionPill icon={UserPlus} label="Solicitações" to="/app/amigos" badge={quickActionCounts.requests || undefined} />
            <ActionPill icon={Percent} label="Divisão" to="/app/divisoes" badge={quickActionCounts.splits || undefined} />
            <ActionPill icon={ShoppingBag} label="Pedidos" to="/app/bar" badge={quickActionCounts.orders || undefined} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <InfoCard
              title={`${acceptedFriends} amigos ativos`}
              subtitle={pendingRequests > 0 ? `${pendingRequests} solicitações abertas` : "rede aquecida agora"}
              icon={Users}
              tone="primary"
              to="/app/amigos"
            />
            <InfoCard
              title={`${activeOrders} pedidos em curso`}
              subtitle="compras durante o evento"
              icon={ShoppingBag}
              tone="secondary"
              to="/app/bar"
            />
            <InfoCard
              title={`${mockSplitRequests.length} divisões abertas`}
              subtitle="rateios da sua galera"
              icon={Percent}
              tone="tertiary"
              to="/app/divisoes"
            />
            <InfoCard
              title={recentMovement?.eventName ?? "Pulso da rede"}
              subtitle={recentMovement ? `${recentMovement.friendName} ${recentMovement.description}` : "rede em movimento agora"}
              icon={MessageCircle}
              tone="neutral"
              to="/app/amigos"
            />
          </div>
        </div>
      </section>

      <div className="mb-8 flex gap-2">
        <button
          onClick={() => setActiveTab("eventos")}
          className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
            activeTab === "eventos" ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          Eventos
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
            activeTab === "feed" ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          Feed Social
        </button>
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {activeTab === "eventos" ? (
          <>
            {visibleEvents.map((event, index) => (
              <SocialEventCard key={event.id} event={event} index={index} />
            ))}
            <MapPreviewCard image={heroEvent.image} />
          </>
        ) : (
          <>
            {visibleFeed.map((item, index) => (
              <FeedCard key={item.id} item={item} index={index} />
            ))}
            <OfficialAlertCard eventName={heroEvent.name} />
          </>
        )}
      </section>
    </div>
  );
};

export default SocialHome;
