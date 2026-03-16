import { Link } from "react-router-dom";
import MiniCalendar from "./MiniCalendar";
import VenueTag from "./VenueTag";
import type { EventData } from "@/data/events";

interface EventCardProps {
  event: EventData;
}

const EventCard = ({ event }: EventCardProps) => {
  return (
    <Link
      to={`/eventos/${event.slug}`}
      className="block rounded-lg bg-card overflow-hidden card-lift"
      style={{ boxShadow: "var(--shadow-card)" }}
      title={event.title}
    >
      <div className="relative w-full" style={{ aspectRatio: "300 / 196" }}>
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />

        {event.seatMap.variant === "theater" ? (
          <span className="absolute left-3 top-3 rounded-full bg-card/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground shadow-sm">
            Mapa de sala
          </span>
        ) : null}
      </div>

      <div className="p-2.5 mt-2 mx-1 mb-1">
        <div className="flex gap-3 mb-2">
          <div className="flex-shrink-0 w-12">
            <MiniCalendar month={event.month} day={event.day} weekday={event.weekday} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground">Abertura: {event.time}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.city}</p>
          </div>
        </div>

        <div className="mb-1.5">
          <VenueTag name={event.venueName} icon={event.venueIcon} />
        </div>

        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug font-body">
          {event.title}
        </h3>

        {event.seatMap.variant === "theater" ? (
          <p className="mt-2 text-xs font-medium text-primary">Abrir experiencia do mapa 2D</p>
        ) : null}
      </div>
    </Link>
  );
};

export default EventCard;
