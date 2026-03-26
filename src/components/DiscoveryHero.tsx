import { CalendarDays, MapPin, Ticket, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import EventSearchBox from "@/components/EventSearchBox";
import type { EventCategory, EventData } from "@/data/events";

interface DiscoveryHeroProps {
  categories: EventCategory[];
  cities: string[];
  spotlightEvent: EventData;
  stats: Array<{ label: string; value: string }>;
}

const DiscoveryHero = ({ categories, cities, spotlightEvent, stats }: DiscoveryHeroProps) => {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#ecfeff_100%)]">
      <div className="grid gap-8 px-5 py-6 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" />
              Descubra eventos com menos atrito
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Ingressos, mapa de sala e descoberta com cara de plataforma grande.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Busque por artista, cidade ou local, navegue por trilhas de descoberta e entre em uma jornada de
                compra mais próxima de marketplace real, no desktop e no mobile.
              </p>
            </div>
          </div>

          <EventSearchBox
            variant="hero"
            placeholder="Ex.: Hamlet, pop, Sala São Paulo, Rio de Janeiro"
            className="max-w-3xl"
          />

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Explore por categoria</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cidades em alta</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cities.map((city) => (
                  <span
                    key={city}
                    className="rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.9rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.9)]">
          <div className="overflow-hidden rounded-[1.5rem]">
            <img
              src={spotlightEvent.bannerImage}
              alt={spotlightEvent.title}
              className="h-[230px] w-full object-cover sm:h-[280px]"
            />
          </div>

          <div className="space-y-4 p-2 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                {spotlightEvent.category}
              </span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                {spotlightEvent.discoveryLabel}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{spotlightEvent.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">{spotlightEvent.summary}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/55">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Data
                </p>
                <p className="mt-2 text-sm font-medium">
                  {spotlightEvent.weekday}, {spotlightEvent.day} {spotlightEvent.month} · {spotlightEvent.time}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/55">
                  <MapPin className="h-3.5 w-3.5" />
                  Local
                </p>
                <p className="mt-2 text-sm font-medium">
                  {spotlightEvent.venueName}
                  <span className="block text-white/55">{spotlightEvent.city}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/55">
                  <Ticket className="h-3.5 w-3.5" />
                  A partir de
                </p>
                <p className="mt-1 text-2xl font-semibold">R$ {spotlightEvent.priceFrom.toFixed(2).replace(".", ",")}</p>
              </div>

              <Link
                to={`/eventos/${spotlightEvent.slug}`}
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                Ver evento
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscoveryHero;
