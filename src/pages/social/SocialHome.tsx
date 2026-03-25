import { useState } from "react";
import { Link } from "react-router-dom";
import { Percent, ShoppingBag, Users } from "lucide-react";
import SocialHeader from "@/components/social/SocialHeader";
import SocialHeroBanner from "@/components/social/HeroBanner";
import QuickActions from "@/components/social/QuickActions";
import SocialEventCard from "@/components/social/SocialEventCard";
import FeedCard from "@/components/social/FeedCard";
import {
  mockBarOrders,
  mockHeroEvent,
  mockNotificationCounts,
  mockFeedItems,
  mockFriends,
  mockSocialEvents,
  mockSplitRequests,
} from "@/data/social-mock";
import { useAuth } from "@/hooks/use-auth";

const SocialHome = () => {
  const { currentAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<"eventos" | "feed">("eventos");

  const name = currentAccount?.fullName ?? "Visitante";
  const acceptedFriends = mockFriends.filter((friend) => friend.status === "accepted").length;
  const pendingRequests = mockFriends.length - acceptedFriends;
  const activeOrders = mockBarOrders.filter((order) => order.status !== "delivered").length;

  return (
    <div className="space-y-0">
      <SocialHeader fullName={name} />
      <div className="space-y-4 pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6 xl:px-6 xl:pt-2">
        <div className="space-y-4">
          <SocialHeroBanner event={mockHeroEvent} />
          <QuickActions counts={mockNotificationCounts} />

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

          <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:px-0 xl:grid-cols-3 2xl:grid-cols-4">
            {activeTab === "eventos"
              ? mockSocialEvents.map((event) => (
                  <SocialEventCard key={event.id} event={event} />
                ))
              : mockFeedItems.map((item) => (
                  <FeedCard key={item.id} item={item} />
                ))}
          </div>
        </div>

        <aside className="hidden xl:flex xl:flex-col xl:gap-4 xl:pr-0 xl:pt-1">
          <div className="rounded-[1.75rem] border border-white/5 bg-surface/70 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-social">Sua rede agora</p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-2xl bg-background/55 p-4">
                <div className="flex items-center gap-2 text-social">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Amigos ativos</span>
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">{acceptedFriends}</p>
                <p className="mt-1 text-sm text-muted-foreground">{pendingRequests} solicitações ainda abertas.</p>
              </div>
              <div className="rounded-2xl bg-background/55 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Pedidos em curso</span>
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">{activeOrders}</p>
                <p className="mt-1 text-sm text-muted-foreground">Acompanhe o status do bar sem sair do feed.</p>
              </div>
              <div className="rounded-2xl bg-background/55 p-4">
                <div className="flex items-center gap-2 text-secondary">
                  <Percent className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Divisões abertas</span>
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">{mockSplitRequests.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Rateios prontos para aprovação com a sua rede.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/5 bg-surface/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pulso social</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">Movimentos recentes</h2>
              </div>
              <Link to="/app/amigos" className="text-xs font-semibold text-social transition-colors hover:text-social/80">
                Ver rede
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {mockFeedItems.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl bg-background/55 p-4">
                  <p className="text-sm font-semibold text-foreground">{item.friendName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-social">{item.eventName}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SocialHome;
