import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import EventCard from "@/components/EventCard";
import type { EventData } from "@/data/events";

interface EventRailProps {
  title: string;
  description?: string;
  eyebrow?: string;
  events: EventData[];
  ctaLabel?: string;
  ctaTo?: string;
}

const EventRail = ({ title, description, eyebrow, events, ctaLabel, ctaTo }: EventRailProps) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
          ) : null}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
        </div>

        {ctaLabel && ctaTo ? (
          <Link
            to={ctaTo}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0">
        <div className="flex min-w-full gap-4">
          {events.map((event) => (
            <div key={event.id} className="w-[260px] min-w-[260px] sm:w-[280px] sm:min-w-[280px]">
              <EventCard event={event} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventRail;
