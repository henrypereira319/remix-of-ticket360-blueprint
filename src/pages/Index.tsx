import { Link } from "react-router-dom";
import EventGrid from "@/components/EventGrid";
import HeroBanner from "@/components/HeroBanner";
import HighlightsCarousel from "@/components/HighlightsCarousel";
import SectionSeparator from "@/components/SectionSeparator";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { banners, events, highlights } from "@/data/events";
import { useAuth } from "@/hooks/use-auth";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const mapPreviewEvent = events.find((event) => event.seatMap.variant === "theater") ?? events[0];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-4 space-y-4">
        <SectionSeparator title="Destaques" />
        <HighlightsCarousel highlights={highlights} />

        <div className="border-b border-separator" />

        <HeroBanner banners={banners} />

        <SectionSeparator title="Mapa de Sala" />

        <Card className="overflow-hidden border-border bg-card">
          <CardContent className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Demo ja disponivel</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">
                  O mapa da sala agora tem uma jornada propria
                </h2>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                A experiencia 2D inspirada no Theatro Municipal ja pode ser aberta no evento{" "}
                <span className="font-semibold text-foreground">{mapPreviewEvent.title}</span>, agora em uma rota
                dedicada com foco por setor, palco, frisas, anfiteatro e uma segunda dobra para revisar o ingresso.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={`/eventos/${mapPreviewEvent.slug}/assentos`}>Abrir mapa da sala</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={`/eventos/${mapPreviewEvent.slug}`}>Ver detalhe do evento</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.94),_rgba(241,245,249,1)_68%)] p-5 shadow-sm">
              <div className="mx-auto w-[72%] rounded-b-[1.6rem] bg-foreground px-4 py-3 text-center text-card">
                <p className="text-[11px] uppercase tracking-[0.2em] text-card/70">Palco</p>
              </div>

              <div className="relative mt-5 h-52 overflow-hidden rounded-[1.4rem] border border-border/70 bg-background">
                <div className="absolute left-1/2 top-6 h-16 w-48 -translate-x-1/2 rounded-[999px] border border-emerald-200 bg-emerald-50/90" />
                <div className="absolute left-1/2 top-[4.4rem] h-28 w-72 -translate-x-1/2 rounded-[48%] border border-primary/20 bg-primary/10" />
                <div className="absolute left-5 top-[5.2rem] h-24 w-14 rounded-[1.2rem] border border-slate-300 bg-slate-100/90" />
                <div className="absolute right-5 top-[5.2rem] h-24 w-14 rounded-[1.2rem] border border-slate-300 bg-slate-100/90" />

                <div className="absolute left-1/2 top-24 h-4 w-4 -translate-x-[6.5rem] rounded-full bg-primary shadow-sm" />
                <div className="absolute left-1/2 top-[5.2rem] h-4 w-4 -translate-x-[3rem] rounded-full bg-primary shadow-sm" />
                <div className="absolute left-1/2 top-[4.6rem] h-4 w-4 -translate-x-1/2 rounded-full bg-violet-400 shadow-sm" />
                <div className="absolute left-1/2 top-[5.2rem] h-4 w-4 translate-x-[2.1rem] rounded-full bg-primary shadow-sm" />
                <div className="absolute left-1/2 top-24 h-4 w-4 translate-x-[5.6rem] rounded-full bg-primary shadow-sm" />

                <div className="absolute left-8 top-[6.2rem] h-4 w-4 rounded-full bg-slate-500 shadow-sm" />
                <div className="absolute right-8 top-[6.2rem] h-4 w-4 rounded-full bg-slate-500 shadow-sm" />
                <div className="absolute left-1/2 top-10 h-4 w-4 -translate-x-8 rounded-full bg-emerald-500 shadow-sm" />
                <div className="absolute left-1/2 top-10 h-4 w-4 translate-x-4 rounded-full bg-emerald-500 shadow-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isAuthenticated ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Workspace administrativo</p>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Builder de evento indexado na navegação principal
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  O atalho para montar eventos agora também fica acessível pela home e pelo header, além da conta.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/admin">Abrir workspace admin</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/admin/eventos/novo">Ir direto para novo evento</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <SectionSeparator title="Proximos Eventos" />
        <EventGrid events={events} />
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
