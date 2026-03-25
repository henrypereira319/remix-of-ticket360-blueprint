import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FeedItem, FeedActionType } from "@/data/social-mock";

const actionColors: Record<FeedActionType, string> = {
  bought_ticket: "text-primary",
  confirmed_presence: "text-social",
  bought_at_bar: "text-primary",
  opened_split: "text-secondary",
  created_group: "text-social",
  favorited_event: "text-accent",
  recommended_event: "text-accent",
};

const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

interface Props {
  item: FeedItem;
}

const FeedCard = ({ item }: Props) => (
  <div className="group overflow-hidden rounded-2xl bg-surface transition-transform active:scale-[0.98]">
    <div className="aspect-square overflow-hidden relative">
      <img
        src={item.eventImage}
        alt={item.eventName}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-2 left-2 right-2">
        <p className="truncate text-xs font-semibold text-white">{item.eventName}</p>
      </div>
    </div>
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={item.friendAvatar} />
          <AvatarFallback className="bg-surface-elevated text-[8px]">
            {item.friendName.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-foreground">{item.friendName}</p>
          <p className={`truncate text-[10px] font-medium ${actionColors[item.action]}`}>
            {item.description}
          </p>
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(item.timestamp)}</span>
      </div>
      {item.socialProof && (
        <p className="text-[10px] font-medium text-social">
          {item.socialProof}
        </p>
      )}
    </div>
  </div>
);

export default FeedCard;
