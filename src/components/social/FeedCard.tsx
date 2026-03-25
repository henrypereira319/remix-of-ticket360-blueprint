import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAlternatingCardShapeClass } from "@/components/social/card-shape";
import type { FeedItem, FeedActionType } from "@/data/social-mock";
import { cn } from "@/lib/utils";

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
  index: number;
}

const FeedCard = ({ item, index }: Props) => {
  const shapeClass = getAlternatingCardShapeClass(index);

  return (
    <div className="group min-w-0 transition-transform active:scale-[0.98]">
      <div
        className={cn(
          "relative overflow-hidden bg-surface/70 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.95)] ring-1 ring-white/5",
          shapeClass,
        )}
      >
        <div className="aspect-[164/170] overflow-hidden">
          <img
            src={item.eventImage}
            alt={item.eventName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-white">{item.eventName}</p>
            <p className="truncate text-[10px] text-white/70">{item.friendName}</p>
          </div>
          <span className="shrink-0 text-[10px] text-white/75">{timeAgo(item.timestamp)}</span>
        </div>
      </div>
      <div className="space-y-2 px-0.5 pb-0.5 pt-2.5">
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
        </div>
        {item.socialProof && (
          <p className="text-[10px] font-medium text-social">
            {item.socialProof}
          </p>
        )}
      </div>
    </div>
  );
};

export default FeedCard;
