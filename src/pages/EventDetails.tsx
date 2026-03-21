import { ArrowLeft, CalendarDays, Clock3, MapPin, ShieldCheck, Ticket, UserRound, Wallet } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import EventInfoAccordion from "@/components/EventInfoAccordion";
import EventRail from "@/components/EventRail";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VenueTag from "@/components/VenueTag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { events, getEventBySlug } from "@/data/events";
import { formatCurrency, getSelectableSeatCount } from "@/lib/ticketing";
import NotFound from "./NotFound";

const EventDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const event = getEventBySlug(slug);

  if (!event) {
    return <NotFound />;
  }

  const seatExperienceLink = `/eventos/${event.slug}/assentos`;
  const relatedEvents = events.filter((item) => item.category === event.category && item.id !== event.id).slice(0, 5);
  const highlightedSections = event.seatMap.sections.slice(0, 4);

  const quickFacts = [
    { label: "Abertura", value: event.details.openingTime, icon: Clock3 },
    { label: "Início", value: `${event.weekday}, ${event.day} ${event.month} · ${event.time}`, icon: CalendarDays },
    { label: "Local", value: `${event.venueName} · ${event.city}`, icon: MapPin },
    { label: "Classificação", value: event.details.ageRating, icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader />

      <main className="space-y-10 pb-12 pt-5 sm:pt-6">
        <div className="container space-y-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a home
          </Link>

          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[320px] overflow-hidden">
                  <img src={event.bannerImage} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                        {event.category}
                      </span>
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                        {event.discoveryLabel}
                      </span>
                      {event.salesBadge ? (
                        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                          {event.salesBadge}
                        </span>
                      ) : null}
                    </div>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{event.title}</h1>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/80 sm:text-base">{event.summary}</p>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <div className="space-y-3">
                    <VenueTag name={event.venueName} icon={event.venueIcon} />
                    <p className="text-sm leading-7 text-slate-600">{event.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {quickFacts.map((fact) => {
                      const Icon = fact.icon;

                      return (
                        <div key={fact.label} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            <Icon className="h-4 w-4 text-primary" />
                            {fact.label}
                          </p>
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{fact.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="xl:sticky xl:top-28 xl:self-start">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_26px_90px_-55px_rgba(15,23,42,0.45)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Compra e jornada</p>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">A partir de</p>
                    <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">
                      {formatCurrency(event.priceFrom)}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700">
                    {event.city}
                  </Badge>
                </div>

                <div className="mt-5 space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {event.weekday}, {event.day} {event.month} · {event.time}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <MapPin className="h-4 w-4 text-primary" />
                    {event.details.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Ticket className="h-4 w-4 text-primary" />
                    {event.seatMap.variant === "theater"
                      ? `${event.seatMap.totalSeats} assentos mapeados`
                      : `${event.seatMap.sections.length} setores disponíveis`}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <Button asChild size="lg" className="w-full">
                    <Link to={seatExperienceLink}>
                      <Ticket className="h-4 w-4" />
                      {event.seatMap.variant === "theater" ? "Escolher assentos" : "Selecionar ingressos"}
                    </Link>
                  </Button>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <Wallet className="h-4 w-4 text-primary" />
                        Pagamento
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{event.details.paymentInfo}</p>
                    </div>

                    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Segurança
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        QR e ticket digital continuam sujeitos a validação operacional e antifraude.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="container grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
          <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo comercial</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Informações que empurram a decisão</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Etapa 1</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Escolha visual</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  A navegação leva para a seleção de lugares em uma rota dedicada, sem camadas pesadas sobre a planta.
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Etapa 2</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Revisão do pedido</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tipos de ingresso, benefícios e valores ficam claros antes de entrar no checkout financeiro.
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Etapa 3</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Validação final</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Pagamento e emissão seguem com critérios de segurança e trilha operacional explícita.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Diferenciais da sala</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {highlightedSections.map((section) => (
                  <Badge key={section.id} variant="outline" className="bg-white text-slate-700">
                    {section.shortLabel}: {getSelectableSeatCount(event, section.id)} livres
                  </Badge>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {event.seatMap.notes[0]}
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operação e políticas</p>
              <div className="mt-4 space-y-3">
                {event.securityNotes.map((note) => (
                  <div key={note} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    {note}
                  </div>
                ))}
              </div>
            </div>

            <EventInfoAccordion event={event} />
          </section>
        </div>

        {relatedEvents.length > 0 ? (
          <div className="container">
            <EventRail
              eyebrow="Você também pode gostar"
              title={`Mais eventos em ${event.category}`}
              description="Curadoria de eventos parecidos para manter navegação viva depois da PDP."
              events={relatedEvents}
            />
          </div>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
};

export default EventDetails;
