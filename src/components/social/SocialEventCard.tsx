import { Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SocialEventCard as SocialEventCardData } from "@/data/social-mock";

interface Props {
  event: SocialEventCardData;
}

const SocialEventCard = ({ event }: Props) => (
  <Link
    to={`/eventos/${event.slug}`}
    className="group block overflow-hidden rounded-2xl bg-surface transition-transform active:scale-[0.97]"
  >
    <div className="aspect-square overflow-hidden">
      <img
        src={event.image}
        alt={event.name}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
    </div>
    <div className="space-y-1.5 p-3">
      <h3 className="truncate text-sm font-semibold text-foreground">{event.name}</h3>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {event.date}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3 text-social" />
          {event.friendsGoing}
        </span>
      </div>
      {event.friendAvatars.length > 0 && (
        <div className="flex -space-x-2">
          {event.friendAvatars.slice(0, 3).map((url, i) => (
            <Avatar key={i} className="h-5 w-5 border border-surface">
              <AvatarImage src={url} />
              <AvatarFallback className="bg-surface-elevated text-[8px]">?</AvatarFallback>
            </Avatar>
          ))}
          {event.friendsGoing > 3 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-surface-elevated text-[8px] font-bold text-muted-foreground">
              +{event.friendsGoing - 3}
            </div>
          )}
        </div>
      )}
    </div>
  </Link>
);

export default SocialEventCard;
