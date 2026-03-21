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
      className="group block overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white card-lift"
      style={{ boxShadow: "var(--shadow-card)" }}
      title={event.title}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "300 / 210" }}>
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-800 shadow-sm">
            {event.category}
          </span>
          {event.salesBadge ? (
            <span className="rounded-full bg-slate-950/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
              {event.salesBadge}
            </span>
          ) : null}
        </div>

        {event.seatMap.variant === "theater" ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-emerald-50/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800 shadow-sm">
            Mapa de sala
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-12">
            <MiniCalendar month={event.month} day={event.day} weekday={event.weekday} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Abertura · {event.time}</p>
            <p className="mt-1 text-sm text-slate-600 truncate">{event.city}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{event.discoveryLabel}</p>
          </div>
        </div>

        <div>
          <VenueTag name={event.venueName} icon={event.venueIcon} />
        </div>

        <div className="space-y-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-950 font-body">
            {event.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-slate-600">{event.summary}</p>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Ingressos</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">R$ {event.priceFrom.toFixed(2).replace(".", ",")}</p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">Ver evento</p>
            <p className="mt-1 text-xs text-slate-500">
              {event.seatMap.variant === "theater" ? "Explorar assentos" : "Detalhes e compra"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {event.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>

        {event.seatMap.variant === "theater" ? (
          <p className="text-xs font-medium text-primary">Abrir experiencia do mapa 2D</p>
        ) : null}
      </div>
    </Link>
  );
};

export default EventCard;
