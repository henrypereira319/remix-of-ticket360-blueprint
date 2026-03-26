import { ArrowRight, Building2, Flame, Map, Sparkles, Ticket, Users, Wine } from "lucide-react";
import { Link } from "react-router-dom";
import DiscoveryHero from "@/components/DiscoveryHero";
import EventCard from "@/components/EventCard";
import EventGrid from "@/components/EventGrid";
import EventRail from "@/components/EventRail";
import HeroBanner from "@/components/HeroBanner";
import HighlightsCarousel from "@/components/HighlightsCarousel";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { banners, highlights } from "@/data/events";
import { useCatalogEvents } from "@/hooks/use-catalog-events";

const categoryAnchor = (category: string) =>
  `categoria-${category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

const Index = () => {
  const { events, isLoading } = useCatalogEvents();

  if (isLoading && events.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <SiteHeader />
        <main className="container flex min-h-[60vh] items-center justify-center py-10">
          <div className="text-sm font-medium text-slate-600">Carregando catálogo...</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <SiteHeader />
        <main className="container flex min-h-[60vh] items-center justify-center py-10">
          <div className="max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Catálogo público</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Nenhum evento publicado agora</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Quando houver eventos publicados no backend, a vitrine volta a carregar automaticamente nesta rota.
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const marketplaceCategories = Array.from(new Set(events.map((event) => event.category)));
  const marketplaceCities = Array.from(new Set(events.map((event) => event.city)));
  const spotlightEvent = events.find((event) => event.seatMap.variant === "theater") ?? events[0];
  const topSellingEvents = [...events].sort((left, right) => right.priceFrom - left.priceFrom).slice(0, 5);
  const theaterEvents = events.filter((event) => event.seatMap.variant === "theater");
  const saoPauloEvents = events.filter((event) => event.city.includes("Sao Paulo")).slice(0, 5);
  const nightlifeEvents = events.filter((event) => ["Shows", "Festivais", "Experiencias"].includes(event.category)).slice(0, 5);
  const publishedSlugs = new Set(events.map((event) => event.slug));
  const visibleHighlights = highlights.filter((highlight) => publishedSlugs.has(highlight.href.split("/").filter(Boolean).at(-1) ?? ""));
  const visibleBanners = banners.filter((banner) => publishedSlugs.has(banner.href.split("/").filter(Boolean).at(-1) ?? ""));
  const categoryCollections = marketplaceCategories
    .map((category) => ({
      category,
      events: events.filter((event) => event.category === category).slice(0, 4),
    }))
    .filter((collection) => collection.events.length > 0);

  const stats = [
    { label: "Eventos publicados", value: `${events.length}` },
    { label: "Praças ativas", value: `${marketplaceCities.length}` },
    { label: "Mapas de sala", value: `${theaterEvents.length}` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader />

      <main className="space-y-8 pb-12 pt-5 sm:space-y-10 sm:pt-6">
        <div className="container">
          <DiscoveryHero
            categories={marketplaceCategories}
            cities={marketplaceCities.slice(0, 5)}
            spotlightEvent={spotlightEvent}
            stats={stats}
          />
        </div>

        <div className="container">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Destaques do momento</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">O que está puxando a vitrine</h2>
                </div>
                <Link to={`/eventos/${spotlightEvent.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  Ver destaque
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <HighlightsCarousel highlights={visibleHighlights} />
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Campanhas e turnês</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Banners com call mais comercial</h2>
              </div>
              <HeroBanner banners={visibleBanners} />
            </section>
          </div>
        </div>

        <div className="container">
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Atalhos de descoberta</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Link
                  to={`/eventos/${spotlightEvent.slug}/assentos`}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <Map className="h-5 w-5 text-emerald-600" />
                  <h3 className="mt-3 text-base font-semibold text-slate-950">Mapa de sala</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Entre direto na jornada de assentos com foco visual e checkout.</p>
                </Link>

                <Link
                  to={`/eventos/${topSellingEvents[0].slug}`}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <Ticket className="h-5 w-5 text-sky-600" />
                  <h3 className="mt-3 text-base font-semibold text-slate-950">Compra rápida</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Chegue no evento em poucos passos e mantenha a navegação limpa.</p>
                </Link>

                <Link
                  to={`/eventos/${saoPauloEvents[0]?.slug ?? spotlightEvent.slug}`}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <Building2 className="h-5 w-5 text-violet-600" />
                  <h3 className="mt-3 text-base font-semibold text-slate-950">Praças fortes</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Curadorias por cidade e venue para deixar a home mais navegável.</p>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_24px_90px_-50px_rgba(15,23,42,0.95)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                <Sparkles className="h-4 w-4" />
                Curadoria editorial
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Uma home mais próxima de marketplace de ingressos.</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Reorganizamos o topo para puxar descoberta real: busca com sugestão, trilhas por categoria, rails por cidade e
                destaque comercial mais forte no mobile e no desktop.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {marketplaceCities.slice(0, 5).map((city) => (
                  <span key={city} className="rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-white/85">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="container space-y-8">
          <EventRail
            eyebrow="Mais vendidos"
            title="Ingressos puxando conversão"
            description="Uma trilha horizontal mais próxima de vitrine comercial, com preços, badges e CTA explícito."
            events={topSellingEvents}
          />

          <EventRail
            eyebrow="Sala e lugares"
            title="Eventos com mapa de sala"
            description="Coleção dedicada para experiências com assento marcado, teatro e checkout mais orientado."
            events={theaterEvents}
          />

          <EventRail
            eyebrow="Praça principal"
            title="São Paulo em destaque"
            description="A home agora consegue empilhar curadorias por cidade sem virar só uma grid estática."
            events={saoPauloEvents}
          />

          <EventRail
            eyebrow="Noite e festival"
            title="Programação para sair hoje"
            description="Shows, festivais e experiências com uma linguagem mais próxima de ticketing marketplace."
            events={nightlifeEvents}
          />
        </div>

        <div className="container">
          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_24px_90px_-50px_rgba(15,23,42,0.95)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Ecossistema EventHub</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">A plataforma pai fica no centro. As vertentes nascem por publico.</h2>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Em vez de uma unica home tentando falar com todo mundo do mesmo jeito, o EventHub passa a abrir rotas alternativas
                com curadoria, linguagem e descoberta especificas para cada audiencia.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <Flame className="h-5 w-5 text-lime-300" />
                  <p className="mt-3 text-sm font-semibold text-white">Pulse</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">Noite, grupo, ego, consumo e rede social de evento.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <Users className="h-5 w-5 text-sky-300" />
                  <p className="mt-3 text-sm font-semibold text-white">Vertentes futuras</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">Familia, corporativo, classicos e outros recortes podem nascer depois.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <Wine className="h-5 w-5 text-orange-300" />
                  <p className="mt-3 text-sm font-semibold text-white">Receita ampliada</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">Ingresso, in-bar, experiencias e coordenacao de grupo no mesmo ecossistema.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Link
                to="/pulse"
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <div className="relative min-h-[220px] overflow-hidden">
                  <img
                    src={(nightlifeEvents[0] ?? spotlightEvent).bannerImage}
                    alt="Pulse by EventHub"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-300">Vertente ativa</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">EventHub Pulse</h3>
                    <p className="mt-2 text-sm leading-6 text-white/75">
                      A rota jovem/social do ecossistema, com eventos de noite, feed, grupo e desejo.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Explorar vertente</p>
                    <p className="mt-1 text-sm text-slate-600">Curadoria alternativa ligada ao EventHub pai.</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-700" />
                </div>
              </Link>

              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">House of brands</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Estrutura pronta para abracar mais publicos.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A ideia nao e um produto generico tentando ser tudo ao mesmo tempo. E uma plataforma central com vertentes fortes,
                  cada uma com linguagem, oferta e discovery proprios.
                </p>
                <div className="mt-5 space-y-3">
                  <div className="rounded-[1.4rem] bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-950">Pai: EventHub</p>
                    <p className="mt-1 text-sm text-slate-600">Conta, operacao, checkout, tickets, catalogo e motor de descoberta.</p>
                  </div>
                  <div className="rounded-[1.4rem] bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-950">Filhos: vertentes</p>
                    <p className="mt-1 text-sm text-slate-600">Pulse agora. Outras rotas depois, cada uma falando com um comportamento especifico.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="container space-y-8">
          {categoryCollections.map((collection) => (
            <section key={collection.category} id={categoryAnchor(collection.category)} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categoria</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{collection.category}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Trilha dedicada para {collection.category.toLowerCase()}, com mais previsibilidade visual na home.
                  </p>
                </div>
                <span className="text-sm font-medium text-slate-500">{collection.events.length} destaques nesta curadoria</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {collection.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="container">
          <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Catálogo completo</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Todos os eventos da vitrine</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Um grid final mais denso para quem já desceu toda a home e quer comparar opções lado a lado.
                </p>
              </div>
              <span className="text-sm font-medium text-slate-500">{events.length} eventos publicados</span>
            </div>

            <EventGrid events={events} />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
