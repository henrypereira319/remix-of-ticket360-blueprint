import { useState } from "react";
import SocialHeader from "@/components/social/SocialHeader";
import SocialHeroBanner from "@/components/social/HeroBanner";
import QuickActions from "@/components/social/QuickActions";
import SocialEventCard from "@/components/social/SocialEventCard";
import FeedCard from "@/components/social/FeedCard";
import {
  mockHeroEvent,
  mockNotificationCounts,
  mockSocialEvents,
  mockFeedItems,
} from "@/data/social-mock";
import { useAuth } from "@/hooks/use-auth";

const SocialHome = () => {
  const { currentAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<"eventos" | "feed">("eventos");

  const name = currentAccount?.fullName ?? "Visitante";

  return (
    <div className="space-y-0">
      <SocialHeader fullName={name} />
      <SocialHeroBanner event={mockHeroEvent} />
      <QuickActions counts={mockNotificationCounts} />

      {/* Tab switcher */}
      <div className="flex gap-1 px-4 pb-3">
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

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-6">
        {activeTab === "eventos"
          ? mockSocialEvents.map((event) => (
              <SocialEventCard key={event.id} event={event} />
            ))
          : mockFeedItems.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
      </div>
    </div>
  );
};

export default SocialHome;
