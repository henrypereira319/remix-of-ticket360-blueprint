import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { useMemo, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import EventInfoAccordion from "@/components/EventInfoAccordion";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VenueSelectionPreview from "@/components/VenueSelectionPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventBySlug } from "@/data/events";
import { formatCurrency, getSelectableSeatCount, getSectionCapacity } from "@/lib/ticketing";
import NotFound from "./NotFound";

const EventDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionRailRef = useRef<HTMLDivElement | null>(null);
  const event = getEventBySlug(slug);

  if (!event) {
    return <NotFound />;
  }

  const sessions = event.sessions ?? [];
  const firstSessionId = sessions[0]?.id ?? null;
  const requestedSessionId = searchParams.get("sessao");
  const selectedSessionId = sessions.some((session) => session.id === requestedSessionId)
    ? requestedSessionId
    : firstSessionId;
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0] ?? null;

  const sectionStats = useMemo(
    () =>
      Object.fromEntries(
        event.seatMap.sections.map((section) => [
          section.id,
          {
            available: getSelectableSeatCount(event, section.id),
            capacity: getSectionCapacity(event, section.id),
          },
        ]),
      ),
    [event],
  );

  const fallbackSectionId =
    event.seatMap.sections.find((section) => (sectionStats[section.id]?.available ?? 0) > 0)?.id ??
    event.seatMap.sections[0]?.id ??
    null;
  const requestedSectionId = searchParams.get("setor");
  const selectedSectionId = event.seatMap.sections.some((section) => section.id === requestedSectionId)
    ? requestedSectionId
    : fallbackSectionId;
  const selectedSection = event.seatMap.sections.find((section) => section.id === selectedSectionId) ?? null;

  const minPrice = Math.min(...event.seatMap.sections.map((section) => Math.round(section.price * 50) / 100));
  const maxPrice = Math.max(...event.seatMap.sections.map((section) => section.price));
  const selectedSectionAvailability = selectedSection ? sectionStats[selectedSection.id]?.available ?? 0 : 0;
  const selectedSectionCapacity = selectedSection ? sectionStats[selectedSection.id]?.capacity ?? 0 : 0;

  const updateFlowParams = (updates: { sessao?: string | null; setor?: string | null }) => {
    const nextParams = new URLSearchParams(searchParams);

    if (updates.sessao !== undefined) {
      if (updates.sessao) {
        nextParams.set("sessao", updates.sessao);
      } else {
        nextParams.delete("sessao");
      }
    }

    if (updates.setor !== undefined) {
      if (updates.setor) {
        nextParams.set("setor", updates.setor);
      } else {
        nextParams.delete("setor");
      }
    }

    setSearchParams(nextParams, { replace: true });
  };

  const scrollSessionRail = (direction: "left" | "right") => {
    sessionRailRef.current?.scrollBy({
      left: direction === "left" ? -260 : 260,
      behavior: "smooth",
    });
  };

  const seatExperienceParams = new URLSearchParams();
  if (selectedSessionId) {
    seatExperienceParams.set("sessao", selectedSessionId);
  }
  if (selectedSectionId) {
    seatExperienceParams.set("setor", selectedSectionId);
  }

  const seatExperienceLink = `/eventos/${event.slug}/assentos${seatExperienceParams.toString() ? `?${seatExperienceParams.toString()}` : ""}`;

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <SiteHeader />

      <main className="pb-12">
        <section className="bg-[#131821] px-4 pb-6 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Voltar para a home
              </Link>

              <Badge className="border border-white/10 bg-white/10 text-white hover:bg-white/10">Fluxo estilo Sympla</Badge>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(120deg,_rgba(19,24,33,0.98),_rgba(12,16,24,0.92)_55%,_rgba(26,14,8,0.85))] shadow-[0_28px_80px_rgba(15,23,42,0.38)]">
              <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-8">
                <div className="space-y-5 text-white">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="border border-emerald-400/25 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/15">
                      Evento com mapa numerado
                    </Badge>
                    <Badge className="border border-white/10 bg-white/10 text-white/80 hover:bg-white/10">
                      {event.venueName}
                    </Badge>
                  </div>

                  <div>
                    <h1 className="text-2xl font-semibold sm:text-3xl lg:text-[2rem]">{event.title}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">{event.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-start gap-2 text-sm text-white/80">
                        <CalendarDays className="mt-1 h-4 w-4 text-emerald-300" />
                        <div>
                          <p className="font-semibold text-white">
                            {selectedSession ? `${selectedSession.weekday}, ${selectedSession.day} ${selectedSession.month}` : `${event.weekday}, ${event.day} ${event.month}`}
                          </p>
                          <p className="mt-1 text-white/64">Início às {selectedSession?.time ?? event.time}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-start gap-2 text-sm text-white/80">
                        <Clock3 className="mt-1 h-4 w-4 text-emerald-300" />
                        <div>
                          <p className="font-semibold text-white">Abertura {event.details.openingTime}</p>
                          <p className="mt-1 text-white/64">{event.details.ageRating}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 sm:col-span-2">
                      <div className="flex items-start gap-2 text-sm text-white/80">
                        <MapPin className="mt-1 h-4 w-4 text-emerald-300" />
                        <div>
                          <p className="font-semibold text-white">{event.venueName}</p>
                          <p className="mt-1 text-white/64">{event.details.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-full max-w-[360px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/6 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-sm">
                    <img src={event.bannerImage} alt={event.title} className="h-full w-full rounded-[1.3rem] object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Descrição do evento</h2>
                <div className="mt-8 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">{event.title}</p>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">{event.summary}</p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Selecione uma data</h3>
                    <p className="mt-1 text-sm text-slate-500">Horários referentes ao local do evento.</p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => scrollSessionRail("left")}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white"
                      aria-label="Ver datas anteriores"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollSessionRail("right")}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white"
                      aria-label="Ver próximas datas"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={sessionRailRef}
                  className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {sessions.map((session) => {
                    const isSelected = session.id === selectedSessionId;

                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => updateFlowParams({ sessao: session.id })}
                        className={[
                          "min-w-[120px] snap-start rounded-[1.2rem] border px-4 py-3 text-left transition-all",
                          isSelected
                            ? "border-sky-500 bg-sky-500 text-white shadow-[0_14px_26px_rgba(59,130,246,0.26)]"
                            : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <p className={`text-xs uppercase tracking-[0.18em] ${isSelected ? "text-white/72" : "text-slate-500"}`}>
                          {session.weekday}
                        </p>
                        <p className="mt-2 text-2xl font-semibold">{session.day}</p>
                        <p className={`mt-1 text-sm ${isSelected ? "text-white/80" : "text-slate-500"}`}>{session.month}</p>
                        <p className={`mt-3 text-sm font-medium ${isSelected ? "text-white" : "text-slate-700"}`}>{session.time}</p>
                        {session.label ? (
                          <p className={`mt-2 text-xs ${isSelected ? "text-white/72" : "text-slate-500"}`}>{session.label}</p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h3 className="text-lg font-semibold text-slate-900">Selecione um setor</h3>
                    <p className="mt-1 text-sm text-slate-500">Escolha o bloco antes de abrir o mapa detalhado.</p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {event.seatMap.sections.map((section) => {
                      const stats = sectionStats[section.id];
                      const isSelected = section.id === selectedSectionId;
                      const isSoldOut = (stats?.available ?? 0) === 0;
                      const priceMin = formatCurrency(Math.round(section.price * 50) / 100);
                      const priceMax = formatCurrency(section.price);

                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => updateFlowParams({ setor: section.id })}
                          className={[
                            "w-full px-5 py-4 text-left transition-colors",
                            isSelected ? "bg-slate-50" : "bg-white hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{section.name}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {isSoldOut ? "Setor esgotado" : `Preços entre ${priceMin} e ${priceMax}`}
                              </p>
                            </div>
                            <Badge
                              className={
                                isSoldOut
                                  ? "border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-100"
                                  : isSelected
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-white"
                              }
                            >
                              {stats?.available ?? 0}/{stats?.capacity ?? 0}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <VenueSelectionPreview
                  seatMap={event.seatMap}
                  selectedSectionId={selectedSectionId}
                  sectionMeta={sectionStats}
                  onSelectSection={(sectionId) => updateFlowParams({ setor: sectionId })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Métodos de pagamento</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      {event.details.paymentInfo}
                    </div>
                    <p className="text-sm leading-6 text-slate-500">Parcelamento e tarifas aparecem novamente na etapa final do checkout.</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Compra com total segurança</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      QR emitido somente após validação administrativa
                    </div>
                    <p className="text-sm leading-6 text-slate-500">{event.details.importantNotice}</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Precisando de ajuda?</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
                      A leitura de datas, setores e disponibilidade foi organizada para espelhar a jornada que você trouxe do Sympla.
                    </div>
                    <Button asChild variant="outline" className="w-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50">
                      <Link to={seatExperienceLink}>
                        <Ticket className="h-4 w-4" />
                        Ir para os assentos
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <EventInfoAccordion event={event} />
              </div>
            </div>

            <aside className="xl:sticky xl:top-24 xl:self-start">
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
                <div className="border-b border-slate-100 px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ingressos</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Ingressos entre {formatCurrency(minPrice)} e {formatCurrency(maxPrice)}
                  </p>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sessão</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedSession ? `${selectedSession.weekday}, ${selectedSession.day} ${selectedSession.month}` : `${event.weekday}, ${event.day} ${event.month}`}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{selectedSession?.time ?? event.time}</p>
                  </div>

                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Setor escolhido</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedSection?.name ?? "Selecione um setor"}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedSection
                        ? `${selectedSectionAvailability} de ${selectedSectionCapacity} lugares disponíveis`
                        : "Selecione um setor para continuar"}
                    </p>
                  </div>

                  {selectedSection && selectedSectionAvailability > 0 ? (
                    <Button asChild size="lg" className="w-full bg-emerald-500 text-white hover:bg-emerald-600">
                      <Link to={seatExperienceLink}>
                        <Ticket className="h-4 w-4" />
                        Comprar ingressos
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full bg-slate-300 text-white hover:bg-slate-300" disabled>
                      <Ticket className="h-4 w-4" />
                      Setor indisponível
                    </Button>
                  )}

                  <p className="text-center text-xs leading-5 text-slate-500">
                    O mapa de assentos abre já filtrado pela sessão e pelo setor escolhidos, no mesmo espírito da jornada do Sympla.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default EventDetails;
