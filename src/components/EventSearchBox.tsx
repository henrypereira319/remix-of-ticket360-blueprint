import { CalendarDays, MapPin, Search, Ticket } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { searchEvents } from "@/data/events";

interface EventSearchBoxProps {
  className?: string;
  placeholder?: string;
  variant?: "header" | "hero";
}

const EventSearchBox = ({
  className,
  placeholder = "Busque por artista, evento, local ou cidade",
  variant = "header",
}: EventSearchBoxProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const results = useMemo(() => searchEvents(query), [query]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const heroVariant = variant === "hero";
  const showDropdown = open && (query.trim().length > 0 || results.length > 0);

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-white transition-shadow",
          heroVariant
            ? "border-slate-200 shadow-[0_30px_90px_-42px_rgba(15,23,42,0.55)]"
            : "border-slate-200/90 shadow-sm",
        )}
      >
        <Search
          className={cn(
            "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400",
            heroVariant ? "h-5 w-5" : "h-4 w-4",
          )}
        />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent pr-4 text-slate-900 outline-none placeholder:text-slate-400",
            heroVariant ? "h-14 pl-12 text-base" : "h-11 pl-11 text-sm",
          )}
        />
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.65rem)] z-50 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_90px_-44px_rgba(15,23,42,0.45)]">
          {results.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {results.map((eventItem) => (
                <Link
                  key={eventItem.id}
                  to={`/eventos/${eventItem.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <img
                    src={eventItem.image}
                    alt={eventItem.title}
                    className="h-14 w-14 flex-none rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        {eventItem.category}
                      </span>
                      {eventItem.salesBadge ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                          {eventItem.salesBadge}
                        </span>
                      ) : null}
                    </div>
                    <h4 className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900">{eventItem.title}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {eventItem.weekday}, {eventItem.day} {eventItem.month} · {eventItem.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {eventItem.city}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Ticket className="h-3.5 w-3.5" />
                        A partir de R$ {eventItem.priceFrom.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-slate-500">
              Nenhum evento encontrado para <span className="font-semibold text-slate-700">{query}</span>.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default EventSearchBox;
