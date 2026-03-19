import { ArrowLeft, CalendarDays, Clock3, MapPin, ShieldCheck, Ticket, UserRound, Wallet } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import EventInfoAccordion from "@/components/EventInfoAccordion";
import MiniCalendar from "@/components/MiniCalendar";
import SectionSeparator from "@/components/SectionSeparator";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VenueTag from "@/components/VenueTag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventBySlug } from "@/data/events";
import { formatCurrency, getSelectableSeatCount } from "@/lib/ticketing";
import NotFound from "./NotFound";

const EventDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const event = getEventBySlug(slug);

  if (!event) {
    return <NotFound />;
  }

  const seatExperienceLink = `/eventos/${event.slug}/assentos`;

  const quickFacts = [
    {
      label: "Abertura",
      value: event.details.openingTime,
      icon: Clock3,
    },
    {
      label: "Inicio",
      value: event.time,
      icon: CalendarDays,
    },
    {
      label: "Organizador",
      value: event.details.organizer,
      icon: Ticket,
    },
    {
      label: "Classificacao",
      value: `${event.details.ageRating} | ${event.details.agePolicy}`,
      icon: UserRound,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Voltar para a home
          </Link>

          <Badge variant="secondary" className="bg-muted text-foreground">
            Detalhes do evento
          </Badge>
        </div>

        <Card className="overflow-hidden border-border bg-card">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <CardContent className="space-y-5 p-6">
              <div className="flex gap-4">
                <div className="w-14 flex-shrink-0">
                  <MiniCalendar month={event.month} day={event.day} weekday={event.weekday} />
                </div>
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-semibold text-foreground">{event.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    Abertura: {event.details.openingTime} | Inicio: {event.time}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <VenueTag name={event.venueName} icon={event.venueIcon} />

                <div className="inline-flex items-start gap-2 rounded-lg bg-background px-3 py-2 text-sm leading-6 text-muted-foreground">
                  <MapPin className="mt-1 h-4 w-4 text-primary" />
                  <span>{event.details.address}</span>
                </div>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">{event.description}</p>

              <div className="grid gap-3 md:grid-cols-2">
                {quickFacts.map((fact) => {
                  const Icon = fact.icon;

                  return (
                    <div key={fact.label} className="rounded-lg bg-background px-4 py-3">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <Icon className="h-4 w-4 text-primary" />
                        {fact.label}
                      </div>
                      <p className="mt-2 text-sm font-medium leading-6 text-foreground">{fact.value}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>

            <div className="relative min-h-[260px]">
              <img src={event.bannerImage} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">A partir de</p>
                  <p className="mt-1 text-3xl font-semibold text-foreground">{formatCurrency(event.priceFrom)}</p>
                </div>

                <Badge variant="outline" className="bg-background px-3 py-1.5">
                  {event.city}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
                  <Wallet className="h-4 w-4 text-primary" />
                  {event.details.paymentInfo}
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  QR emitido apenas apos validacao administrativa
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded-lg bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Etapa 1</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">Mapa dedicado</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    A escolha dos lugares acontece em uma jornada propria, sem sobrepor o restante da pagina.
                  </p>
                </div>

                <div className="rounded-lg bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Etapa 2</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">Revisao do ingresso</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Depois do scroll, o usuario retifica categoria, meia entrada e detalhes do ticket.
                  </p>
                </div>

                <div className="rounded-lg bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Etapa 3</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">Checkout final</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    O pagamento so entra em cena depois da selecao confirmada e da revisao da compra.
                  </p>
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="w-full md:w-auto">
              <Link to={seatExperienceLink}>
                <Ticket className="w-4 h-4" />
                Abrir selecao de assentos
              </Link>
            </Button>
          </CardContent>
        </Card>

        <SectionSeparator title="Jornada de Assentos" />

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-xl">Mapa em aba exclusiva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                O mapa de sala agora fica em uma rota dedicada, com narrativa por scroll e foco total na escolha dos
                lugares antes do checkout. Isso elimina sobreposicao visual e abre espaco para uma evolucao premium com
                camadas de profundidade e 3D depois.
              </p>

              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Base da experiencia</p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  Template inspirado no Theatro Municipal, com {event.seatMap.seats.length} assentos mapeados,
                  setores acessiveis, visao parcial e uma segunda dobra de scroll para revisar beneficios e seguir ao
                  checkout.
                </p>
              </div>

              <Button asChild className="w-full sm:w-auto">
                <Link to={seatExperienceLink}>
                  <Ticket className="w-4 h-4" />
                  Entrar na jornada de assentos
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-xl">Seguranca e operacao</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  QR do ingresso liberado somente apos validacao administrativa
                </div>

                <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-foreground">
                  <UserRound className="w-4 h-4 text-primary" />
                  Classificacao: {event.details.ageRating}
                </div>

                {event.securityNotes.map((note) => (
                  <p key={note} className="rounded-md bg-background px-3 py-2">
                    {note}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-xl">Visao rapida dos setores</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {event.seatMap.sections.map((section) => (
                  <Badge key={section.id} variant="outline" className="bg-background">
                    {section.shortLabel}: {getSelectableSeatCount(event, section.id)} livres
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <SectionSeparator title="Informacoes do Evento" />
        <EventInfoAccordion event={event} />
      </main>

      <SiteFooter />
    </div>
  );
};

export default EventDetails;
