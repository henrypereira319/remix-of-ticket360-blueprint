import MiniCalendar from "./MiniCalendar";
import VenueTag from "./VenueTag";
import type { EventData } from "@/data/events";

interface EventCardProps {
  event: EventData;
}

const EventCard = ({ event }: EventCardProps) => {
  return (
    <a
      href="#"
      className="block rounded-lg bg-card overflow-hidden card-lift"
      style={{ boxShadow: "var(--shadow-card)" }}
      title={event.title}
    >
      {/* Cover Image */}
      <div className="relative w-full" style={{ aspectRatio: "300 / 196" }}>
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-2.5 mt-2 mx-1 mb-1">
        {/* Row 1: Calendar + Info */}
        <div className="flex gap-3 mb-2">
          <div className="flex-shrink-0 w-12">
            <MiniCalendar month={event.month} day={event.day} weekday={event.weekday} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground">
              Abertura: {event.time}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {event.city}
            </p>
          </div>
        </div>

        {/* Row 2: Venue */}
        <div className="mb-1.5">
          <VenueTag name={event.venueName} icon={event.venueIcon} />
        </div>

        {/* Row 3: Event Title */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug font-body">
          {event.title}
        </h3>
      </div>
    </a>
  );
};

export default EventCard;
