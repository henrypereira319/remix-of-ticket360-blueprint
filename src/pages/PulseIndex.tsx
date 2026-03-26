import { ArrowLeft, ArrowRight, Flame, Sparkles, Users, Wine } from "lucide-react";
import { Link } from "react-router-dom";
import EventGrid from "@/components/EventGrid";
import EventRail from "@/components/EventRail";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCatalogEvents } from "@/hooks/use-catalog-events";
import { getMarketplaceVerticalBySlug, getVerticalEvents } from "@/lib/marketplace-verticals";

const PulseIndex = () => {
  const { events, isLoading } = useCatalogEvents();
  const vertical = getMarketplaceVerticalBySlug("pulse");

  if (!vertical) {
    return null;
  }

  if (isLoading && events.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <SiteHeader />
        <main className="container flex min-h-[60vh] items-center justify-center py-10">
          <div className="text-sm font-medium text-white/70">Carregando curadoria Pulse...</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const pulseEvents = getVerticalEvents(events, vertical.id);

  if (pulseEvents.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <SiteHeader />
        <main className="container flex min-h-[60vh] items-center justify-center py-10">
          <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Vertente alternativa</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Nenhum evento publicado para o Pulse agora</h1>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Assim que o catalogo tiver shows, festivais e experiencias com essa pegada, esta rota volta a preencher sozinha.
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const heroEvent = pulseEvents[0];
  const premiumNightEvents = [...pulseEvents].sort((left, right) => right.priceFrom - left.priceFrom).slice(0, 5);
  const groupEnergyEvents = pulseEvents.filter((event) => event.tags.some((tag) => ["Ao vivo", "Arena", "Festival"].includes(tag))).slice(0, 5);
  const lateNightEvents = pulseEvents.filter((event) => ["Sex", "Sab", "Dom"].includes(event.weekday)).slice(0, 5);
  const cityCount = new Set(pulseEvents.map((event) => event.city)).size;
  const categoryCount = new Set(pulseEvents.map((event) => event.category)).size;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />

      <main className="space-y-8 pb-12 pt-5 sm:space-y-10 sm:pt-6">
        <div className="container">
          <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,#ff8f4638,transparent_35%),radial-gradient(circle_at_top_right,#9fff4d1f,transparent_30%),linear-gradient(180deg,#151515_0%,#070707_100%)] p-5 shadow-[0_30px_100px_-45px_rgba(0,0,0,0.95)] sm:p-6">
            <div className="grid gap-6 xl:grid-cols-[1fr_460px]">
              <div className="space-y-5">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o EventHub
                </Link>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9fff4d]">EventHub vertentes</p>
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    {vertical.name}: descoberta de evento para quem quer aparecer, juntar a galera e viver a noite.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                    O EventHub continua sendo a marca pai. O Pulse vira a vertente de balada, grupo, ego, prova social e
                    evento que conversa com uma camada quase de rede social.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/85">
                    {pulseEvents.length} eventos curados
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/85">
                    {cityCount} cidades ativas
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/85">
                    {categoryCount} recortes de noite
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <Users className="h-5 w-5 text-[#9fff4d]" />
                    <p className="mt-4 text-sm font-semibold text-white">Rede e status</p>
                    <p className="mt-2 text-sm leading-6 text-white/65">Amigos, feed, presença e prova social puxam a descoberta.</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <Wine className="h-5 w-5 text-[#ff8f46]" />
                    <p className="mt-4 text-sm font-semibold text-white">Open bar e consumo</p>
                    <p className="mt-2 text-sm leading-6 text-white/65">Compra in-bar e combos entram como parte da experiencia.</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <Flame className="h-5 w-5 text-white" />
                    <p className="mt-4 text-sm font-semibold text-white">Curadoria de ego</p>
                    <p className="mt-2 text-sm leading-6 text-white/65">Eventos com mais apelo visual, grupo e desejo de pertencer.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/app"
                    className="inline-flex items-center gap-2 rounded-full bg-[#9fff4d] px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
                  >
                    Abrir experiencia social
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#pulse-grid"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Ver eventos desta vertente
                  </a>
                </div>
              </div>

              <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
                <img
                  src={heroEvent.bannerImage}
                  alt={heroEvent.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#9fff4d]/30 bg-[#9fff4d]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9fff4d]">
                    {vertical.label}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                    {heroEvent.category}
                  </span>
                </div>

                <div className="absolute right-4 top-4 w-[12rem] space-y-3">
                  <div className="rounded-[1.3rem] border border-white/10 bg-black/40 p-3 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9fff4d]">Camada social</p>
                    <p className="mt-2 text-sm font-medium text-white">Feed, amigos, divisoes e pedidos no mesmo fluxo.</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/10 bg-black/40 p-3 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ff8f46]">Evento hero</p>
                    <p className="mt-2 text-sm font-medium text-white">{heroEvent.venueName}</p>
                    <p className="mt-1 text-xs text-white/65">
                      {heroEvent.weekday}, {heroEvent.day} {heroEvent.month} · {heroEvent.time}
                    </p>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">{vertical.audience}</p>
                  <h2 className="mt-2 max-w-md text-3xl font-semibold tracking-tight text-white">{heroEvent.title}</h2>
                  <p className="mt-2 max-w-lg text-sm leading-7 text-white/70">{heroEvent.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {heroEvent.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-medium text-white/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="container grid gap-4 lg:grid-cols-3">
          <section className="rounded-[1.9rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              <Sparkles className="h-4 w-4 text-[#9fff4d]" />
              Vertente 01
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Pulse nao substitui a raiz. Ele especializa a descoberta.</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              A home principal continua marketplace pai. Aqui a gente recorta tom, linguagem, social proof, consumo dentro do evento e
              uma curadoria mais noturna.
            </p>
          </section>

          <section className="rounded-[1.9rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              <Users className="h-4 w-4 text-[#9fff4d]" />
              Rede pessoal
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">A camada social passa a influenciar o que sobe no feed.</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              Essa vertente faz sentido quando a pessoa enxerga onde os amigos vao, o que eles consumiram, o que dividiram e com quem vale
              aparecer.
            </p>
          </section>

          <section className="rounded-[1.9rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              <Wine className="h-4 w-4 text-[#ff8f46]" />
              Receita dentro do evento
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Pedido in-bar e divisao viram parte da oferta.</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              O produto deixa de vender so ingresso e passa a vender acesso, consumo e coordenacao de grupo durante a noite.
            </p>
          </section>
        </div>

        <div className="container space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <EventRail
              eyebrow="Noite premium"
              title="Eventos que puxam status, imagem e desejo"
              description="Curadoria para vitrine com mais ego, impacto visual e conversa de grupo."
              events={premiumNightEvents}
            />
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <EventRail
              eyebrow="Chegar com a galera"
              title="Programacao que faz mais sentido em grupo"
              description="Shows, festivais e arenas que combinam com feed social, convites e divisao."
              events={groupEnergyEvents}
            />
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <EventRail
              eyebrow="Fim de semana"
              title="Eventos para ativar o Pulse agora"
              description="Recorte para sexta, sabado e domingo, com leitura mais jovem e mais imediata."
              events={lateNightEvents.length > 0 ? lateNightEvents : pulseEvents.slice(0, 5)}
            />
          </section>
        </div>

        <div className="container">
          <section id="pulse-grid" className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Catalogo filtrado</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Todos os eventos dessa vertente</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  O EventHub pai continua acima. Aqui a gente entrega um recorte editorial com outra voz e outro tipo de descoberta.
                </p>
              </div>
              <span className="text-sm font-medium text-slate-500">{pulseEvents.length} eventos neste recorte</span>
            </div>

            <EventGrid events={pulseEvents} />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default PulseIndex;
