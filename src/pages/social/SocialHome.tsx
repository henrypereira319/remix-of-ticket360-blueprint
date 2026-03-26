import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  Megaphone,
  MessageSquare,
  Percent,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mockFeedItems,
  mockFriends,
  mockHeroEvent,
  mockNotificationCounts,
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
} from "@/lib/social-backend";

const badgeColorByIndex = [
  "ring-primary/20 text-primary",
  "ring-secondary/20 text-secondary",
] as const;

const splitHeadline = (value: string) => {
  const separators = [" - ", " – ", ": "];

  for (const separator of separators) {
    if (value.includes(separator)) {
      const [first, ...rest] = value.split(separator);
      return {
        first: first.trim(),
        second: rest.join(separator).trim(),
      };
    }
  }

  return { first: value, second: "" };
};

const formatHeroDate = (value: string) => value.replaceAll("â€¢", "•");

const ActionButton = ({
  icon: Icon,
  label,
  badge,
  to,
}: {
  icon: typeof MessageSquare;
  label: string;
  badge?: number;
  to: string;
}) => (
  <Link to={to} className="flex flex-col items-center gap-2">
    <button className="relative h-20 w-20 rounded-3xl bg-black/60 border border-white/10 transition-all group hover:bg-white/10">
      <span className="flex h-full w-full items-center justify-center">
        <Icon className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
      </span>
      {badge !== undefined ? (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-black text-white">
          {badge}
        </span>
      ) : null}
    </button>
    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label}</span>
  </Link>
);

const InfoCard = ({
  title,
  subtitle,
  icon: Icon,
  colorClass,
  to,
}: {
  title: string;
  subtitle: string;
  icon: typeof Users;
  colorClass: string;
  to: string;
}) => (
  <Link
    to={to}
    className="glass-panel group flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-white/5"
  >
    <div>
      <p className="text-xs font-bold text-white">{title}</p>
      <p className="text-[10px] text-white/40">{subtitle}</p>
    </div>
    <Icon className={cn("h-4 w-4", colorClass)} />
  </Link>
);

const NetworkFeedCard = ({
  avatar,
  name,
  role,
  content,
  actionLabel,
  roleColor,
}: {
  avatar: string;
  name: string;
  role: string;
  content: string;
  actionLabel: string;
  roleColor: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass-panel rounded-[2rem] p-6 transition-all hover:bg-white/5"
  >
    <div className="mb-4 flex items-center gap-4">
      <div className={cn("h-12 w-12 overflow-hidden rounded-full ring-2", roleColor)}>
        <img src={avatar} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">{name}</p>
        <p className={cn("text-[10px] font-bold uppercase tracking-tighter", roleColor.replace("ring-", "text-"))}>
          {role}
        </p>
      </div>
    </div>
    <p className="mb-6 text-xs leading-relaxed text-white/60">"{content}"</p>
    <button className="w-full rounded-full border border-white/5 bg-white/5 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
      {actionLabel}
    </button>
  </motion.div>
);

const OfficialAlertCard = ({ eventName }: { eventName: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className="group relative overflow-hidden rounded-[2rem] bg-primary p-6"
  >
    <div className="absolute -bottom-4 -right-4 opacity-20 transition-transform duration-500 group-hover:scale-125">
      <Megaphone className="h-32 w-32 text-primary-foreground" />
    </div>
    <div className="relative z-10">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60">
        OFFICIAL ALERT
      </span>
      <p className="mb-1 text-xl font-black leading-tight text-primary-foreground">Afterparty Access</p>
      <p className="mb-8 text-[10px] font-medium text-primary-foreground/80">
        Exclusive invite for session holders at {eventName}. Access through the side entrance after the headliner.
      </p>
      <button className="w-full rounded-full bg-black py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-95">
        Claim Ticket
      </button>
    </div>
  </motion.div>
);

const MapCard = ({ image }: { image: string }) => (
  <Link to="/app/mapa" className="glass-panel group relative overflow-hidden rounded-[2rem]">
    <img
      src={image}
      alt="Map Preview"
      className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-110"
      referrerPolicy="no-referrer"
    />
    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/20 to-transparent p-6">
      <p className="text-sm font-bold text-white">Crowd Density</p>
      <p className="mb-4 text-[10px] font-bold uppercase text-primary">LIVE HEATMAP</p>
      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-colors group-hover:text-white">
        Open Interactive Map
        <ArrowRight className="h-3 w-3" />
      </span>
    </div>
  </Link>
);

const SocialHome = () => {
  const { currentAccount } = useAuth();
  const [activeTab, setActiveTab] = useState("eventos");
  const accountId = currentAccount?.id;
  const { events } = useCatalogEvents();
  const { orders } = useAccountOrders(accountId);
  const { tickets } = useAccountTickets(accountId);
  const { notifications } = useAccountNotifications(accountId);

  const fullName = currentAccount?.fullName ?? "Visitante";
  const firstName = fullName.split(" ")[0];
  const initials = firstName.slice(0, 2).toUpperCase();

  const heroEvent = useMemo(
    () => buildHeroEventFromBackend({ events, orders, tickets }) ?? mockHeroEvent,
    [events, orders, tickets],
  );

  const feedItems = useMemo(() => {
    const mapped = buildFeedItemsFromBackend({
      accountId,
      accountName: fullName,
      events,
      orders,
      tickets,
    });

    return mapped.length > 0 ? mapped : mockFeedItems;
  }, [accountId, events, fullName, orders, tickets]);

  const acceptedFriends = mockFriends.filter((friend) => friend.status === "accepted").length;
  const pendingRequests = mockFriends.length - acceptedFriends;
  const activeOrders = orders.filter((order) => order.status === "submitted" || order.status === "under_review").length;
  const actionCounts = currentAccount
    ? {
        requests: notifications.length,
        splits: mockSplitRequests.length,
        orders: activeOrders,
      }
    : {
        requests: mockNotificationCounts.requests,
        splits: mockNotificationCounts.splits,
        orders: mockNotificationCounts.orders,
      };

  const heroHeadline = splitHeadline(heroEvent.name);
  const visibleFeed = feedItems.slice(0, 2);
  const recentItem = feedItems[0];

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-black/40" />

      <main className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-primary">
              <span className="text-xs font-bold">{initials}</span>
            </div>
            <div>
              <h2 className="font-headline text-sm font-bold text-white">Ola, {firstName}</h2>
              <p className="text-[10px] text-white/40">Sua rede, seus pedidos e seus roles do momento.</p>
            </div>
          </div>
          <button className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10">
            <Search className="h-5 w-5" />
          </button>
        </header>

        <section className="relative mt-4 mb-8 flex min-h-[500px] flex-col justify-end overflow-hidden rounded-[2.5rem] border border-white/5 p-8 shadow-2xl md:p-16">
          <div className="hero-gradient absolute inset-0" />
          <div className="relative z-10 w-full max-w-4xl">
            <div className="mb-4">
              <span className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                REDE EVENTHUB
              </span>
            </div>

            <h1 className="mb-2 font-headline text-5xl font-extrabold leading-[0.9] tracking-tighter text-white md:text-7xl lg:text-8xl">
              {heroHeadline.first}
              {heroHeadline.second ? (
                <>
                  <br />
                  {heroHeadline.second}
                </>
              ) : null}
            </h1>
            <p className="mb-8 font-headline text-sm font-bold uppercase tracking-[0.3em] text-white/60 md:text-lg">
              {heroEvent.tagline}
            </p>

            <div className="mb-12 flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-white/40">
              <span>{formatHeroDate(heroEvent.date)}</span>
            </div>

            <div className="mb-12 flex flex-wrap gap-8 md:gap-12">
              <ActionButton icon={MessageSquare} label="Mensagem" to="/app/amigos" />
              <ActionButton icon={UserPlus} label="Solicitacoes" badge={actionCounts.requests} to="/app/amigos" />
              <ActionButton icon={Percent} label="Divisao" badge={actionCounts.splits} to="/app/divisoes" />
              <ActionButton icon={ShoppingBag} label="Pedidos" badge={actionCounts.orders} to="/app/bar" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <InfoCard
                title={`${acceptedFriends} amigos ativos`}
                subtitle={`${pendingRequests} solicitacoes abertas`}
                icon={Users}
                colorClass="text-primary"
                to="/app/amigos"
              />
              <InfoCard
                title={`${activeOrders} pedidos em curso`}
                subtitle="compras durante o evento"
                icon={ShoppingCart}
                colorClass="text-secondary"
                to="/app/bar"
              />
              <InfoCard
                title={`${mockSplitRequests.length} divisoes abertas`}
                subtitle="rateios da sua galera"
                icon={CreditCard}
                colorClass="text-cyan-300"
                to="/app/divisoes"
              />
              <InfoCard
                title={recentItem?.eventName ?? "Pulso da rede"}
                subtitle={recentItem?.socialProof ?? "rede em movimento agora"}
                icon={Sparkles}
                colorClass="text-white/40"
                to="/app/amigos"
              />
            </div>
          </div>
        </section>

        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setActiveTab("eventos")}
            className={cn(
              "rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === "eventos" ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/60 hover:bg-white/10",
            )}
          >
            Eventos
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={cn(
              "rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === "feed" ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/60 hover:bg-white/10",
            )}
          >
            Feed Social
          </button>
        </div>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visibleFeed.map((item, index) => (
            <NetworkFeedCard
              key={item.id}
              avatar={item.friendAvatar}
              name={item.friendName}
              role={(item.socialProof ?? item.eventName).toUpperCase()}
              content={`${item.description} em ${item.eventName}.`}
              actionLabel={index === 0 ? "Say Hello" : "Reply"}
              roleColor={badgeColorByIndex[index] ?? "ring-primary/20 text-primary"}
            />
          ))}

          <OfficialAlertCard eventName={heroEvent.name} />
          <MapCard image={heroEvent.image} />
        </section>
      </main>
    </div>
  );
};

export default SocialHome;
