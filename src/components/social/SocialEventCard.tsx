import { Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getAlternatingCardShapeClass } from "@/components/social/card-shape";
import { cn } from "@/lib/utils";
import type { SocialEventCard as SocialEventCardData } from "@/data/social-mock";

interface Props {
  event: SocialEventCardData;
  index: number;
}

const SocialEventCard = ({ event, index }: Props) => {
  const shapeClass = getAlternatingCardShapeClass(index);

  return (
    <Link
      to={`/eventos/${event.slug}`}
      className="group block min-w-0 transition-transform active:scale-[0.98]"
    >
      <div
        className={cn(
          "overflow-hidden bg-surface/70 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.95)] ring-1 ring-white/5",
          shapeClass,
        )}
      >
        <div className="aspect-[164/170] overflow-hidden">
          <img
            src={event.image}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        </div>
      </div>
      <div className="space-y-1 px-0.5 pb-0.5 pt-2.5">
        <h3 className="truncate text-[13px] font-semibold leading-none text-foreground sm:text-sm">
          {event.name}
        </h3>
        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground sm:text-[11px]">
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.date}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Users className="h-3 w-3 text-social" />
            <span>{event.friendsGoing}</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default SocialEventCard;
