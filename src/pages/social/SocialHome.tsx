import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Percent, ShoppingBag, Users } from "lucide-react";
import SocialHeader from "@/components/social/SocialHeader";
import SocialHeroBanner from "@/components/social/HeroBanner";
import QuickActions from "@/components/social/QuickActions";
import SocialEventCard from "@/components/social/SocialEventCard";
import FeedCard from "@/components/social/FeedCard";
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

const SocialHome = () => {
  const { currentAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<"eventos" | "feed">("eventos");
  const accountId = currentAccount?.id;
  const { events } = useCatalogEvents();
  const { orders } = useAccountOrders(accountId);
  const { tickets } = useAccountTickets(accountId);
  const { notifications } = useAccountNotifications(accountId);

  const name = currentAccount?.fullName ?? "Visitante";
  const heroEvent = useMemo(
    () => buildHeroEventFromBackend({ events, orders, tickets }) ?? mockHeroEvent,
    [events, orders, tickets],
  );
  const socialEvents = useMemo(() => {
    const mappedEvents = buildSocialEventsFromBackend({ events, orders, tickets });
    return mappedEvents.length > 0 ? mappedEvents : mockSocialEvents;
  }, [events, orders, tickets]);
  const feedItems = useMemo(() => {
    const mappedFeed = buildFeedItemsFromBackend({
      accountId,
      accountName: name,
      events,
      orders,
      tickets,
    });

    return mappedFeed.length > 0 ? mappedFeed : mockFeedItems;
  }, [accountId, events, name, orders, tickets]);

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
  const recentMovement = feedItems[0];
  const heroUtilityLinks = [
    {
      to: "/app/amigos",
      icon: Users,
      title: `${acceptedFriends} amigos ativos`,
      description: pendingRequests > 0 ? `${pendingRequests} solicitações abertas` : "rede aquecida agora",
      tone: "social",
    },
    {
      to: "/app/bar",
      icon: ShoppingBag,
      title: `${activeOrders} pedidos em curso`,
      description: activeOrders > 0 ? "acompanhar agora" : "compras durante o evento",
      tone: "primary",
    },
    {
      to: "/app/divisoes",
      icon: Percent,
      title: `${mockSplitRequests.length} divisões abertas`,
      description: "rateios da sua galera",
      tone: "secondary",
    },
    {
      to: "/app/amigos",
      icon: Sparkles,
      title: recentMovement?.eventName ?? "Pulso da rede",
      description: recentMovement ? `${recentMovement.friendName} ${recentMovement.description}` : "o que sua rede está fazendo agora",
      tone: "muted",
    },
  ] as const;

  return (
    <div className="space-y-0">
      <SocialHeader fullName={name} />
      <div className="space-y-4 pb-6 xl:px-6 xl:pt-2">
        <div className="space-y-4">
          <SocialHeroBanner
            event={heroEvent}
            headerSlot={
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78 backdrop-blur-md">
                  Rede EventHub
                </span>
                {recentMovement ? (
                  <Link
                    to="/app/amigos"
                    className="max-w-[18rem] rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-right text-[11px] font-medium text-white/76 backdrop-blur-md transition-colors hover:bg-black/45"
                  >
                    {recentMovement.friendName} • {recentMovement.eventName}
                  </Link>
                ) : null}
              </div>
            }
            footerSlot={
              <>
                <QuickActions counts={quickActionCounts} variant="hero" />
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {heroUtilityLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.title}
                        to={item.to}
                        className="group rounded-[1.35rem] border border-white/10 bg-black/36 p-3 backdrop-blur-md transition-colors hover:bg-black/44"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/66">{item.description}</p>
                          </div>
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                              item.tone === "social"
                                ? "bg-social/16 text-social"
                                : item.tone === "primary"
                                  ? "bg-primary/16 text-primary"
                                  : item.tone === "secondary"
                                    ? "bg-secondary/16 text-secondary"
                                    : "bg-white/10 text-white/76"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            }
          />

          <div className="flex gap-1 px-4 pb-1 lg:px-0">
            <button
              onClick={() => setActiveTab("eventos")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "eventos"
                  ? "bg-social text-social-foreground"
                  : "bg-surface text-muted-foreground"
              }`}
            >
              Eventos
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "feed"
                  ? "bg-social text-social-foreground"
                  : "bg-surface text-muted-foreground"
              }`}
            >
              Feed Social
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-4 md:grid-cols-3 lg:px-0 xl:grid-cols-3 2xl:grid-cols-4">
            {activeTab === "eventos"
              ? socialEvents.map((event, index) => (
                  <SocialEventCard key={event.id} event={event} index={index} />
                ))
              : feedItems.map((item, index) => (
                  <FeedCard key={item.id} item={item} index={index} />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialHome;
