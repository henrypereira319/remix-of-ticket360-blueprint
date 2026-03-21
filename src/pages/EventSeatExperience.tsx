import { ArrowLeft, CreditCard, ScanSearch, ShieldCheck, Ticket, UserRound, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import SeatMap from "@/components/SeatMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEventBySlug } from "@/data/events";
import {
  formatCurrency,
  getCheckoutPricing,
  getSeatById,
  getSelectionSummary,
  parseSeatIdsParam,
  parseTicketCategoriesParam,
  sanitizeSelectedSeatIds,
  sanitizeTicketCategories,
  serializeSeatIds,
  serializeTicketCategories,
  ticketCategoryMeta,
  type TicketCategory,
} from "@/lib/ticketing";
import NotFound from "./NotFound";

const selectableStatuses = new Set(["available", "accessible"]);
const ticketCategories = Object.keys(ticketCategoryMeta) as TicketCategory[];

const isTicketCategory = (value: string): value is TicketCategory => ticketCategories.includes(value as TicketCategory);

const EventSeatExperience = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const event = getEventBySlug(slug);
  const mapSectionRef = useRef<HTMLElement | null>(null);
  const checkoutSectionRef = useRef<HTMLElement | null>(null);
  const initialSeatIds = event ? sanitizeSelectedSeatIds(event, parseSeatIdsParam(searchParams.get("assentos"))) : [];
  const initialTicketCategories = event
    ? sanitizeTicketCategories(event, initialSeatIds, parseTicketCategoriesParam(searchParams.get("tipos")))
    : {};

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(initialSeatIds);
  const [selectedTicketCategories, setSelectedTicketCategories] =
    useState<Record<string, TicketCategory>>(initialTicketCategories);

  const searchKey = searchParams.toString();

  useEffect(() => {
    if (!event) {
      return;
    }

    const params = new URLSearchParams(searchKey);
    const nextSeatIds = sanitizeSelectedSeatIds(event, parseSeatIdsParam(params.get("assentos")));

    setSelectedSeatIds(nextSeatIds);
    setSelectedTicketCategories(
      sanitizeTicketCategories(event, nextSeatIds, parseTicketCategoriesParam(params.get("tipos"))),
    );
  }, [event?.id, searchKey]);

  if (!event) {
    return <NotFound />;
  }

  const scrollToSection = (section: "map" | "checkout") => {
    const target = section === "map" ? mapSectionRef.current : checkoutSectionRef.current;

    target?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const updateSelectedSeatIds = (updater: (current: string[]) => string[]) => {
    setSelectedSeatIds((currentSelection) => {
      const nextSelection = updater(currentSelection);
      setSelectedTicketCategories((currentCategories) =>
        sanitizeTicketCategories(event, nextSelection, currentCategories),
      );

      return nextSelection;
    });
  };

  const handleToggleSeat = (seatId: string) => {
    const seat = getSeatById(event, seatId);

    if (!seat || !selectableStatuses.has(seat.status)) {
      return;
    }

    updateSelectedSeatIds((currentSelection) =>
      currentSelection.includes(seatId)
        ? currentSelection.filter((currentSeatId) => currentSeatId !== seatId)
        : [...currentSelection, seatId],
    );
  };

  const handleTicketCategoryChange = (seatId: string, category: TicketCategory) => {
    setSelectedTicketCategories((currentCategories) => ({
      ...currentCategories,
      [seatId]: category,
    }));
  };

  const selection = getSelectionSummary(event, selectedSeatIds, selectedTicketCategories);
  const pricing = getCheckoutPricing(selection.total, selection.items.length);
  const hasSelection = selection.items.length > 0;

  const checkoutParams = new URLSearchParams();
  checkoutParams.set("assentos", serializeSeatIds(selectedSeatIds));
  checkoutParams.set("tipos", serializeTicketCategories(selectedSeatIds, selectedTicketCategories));

  return (
    <div className="relative h-screen overflow-hidden bg-slate-100">
      <main className="relative h-full overflow-y-auto overscroll-contain scroll-smooth">
        <section ref={mapSectionRef} className="relative px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
          <div className="pointer-events-none absolute inset-x-4 top-4 z-20 sm:inset-x-6 sm:top-6">
            <div className="mx-auto flex max-w-7xl justify-end">
              <div className="pointer-events-auto flex flex-wrap items-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-lg">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selecionados</p>
                  <p className="mt-1 text-2xl font-semibold">{selection.items.length}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total estimado</p>
                  <p className="mt-1 text-2xl font-semibold">{formatCurrency(pricing.total)}</p>
                </div>

                <Button type="button" onClick={() => scrollToSection("checkout")} disabled={!hasSelection}>
                  <ScanSearch className="h-4 w-4" />
                  Ir para o checkout
                </Button>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="h-[calc(100vh-2rem)] min-h-[560px] sm:h-[calc(100vh-3rem)]">
              <SeatMap
                immersive
                fullBleed
                seatMap={event.seatMap}
                selectedSeatIds={selectedSeatIds}
                onToggleSeat={handleToggleSeat}
              />
            </div>
          </div>
        </section>

        <section
          ref={checkoutSectionRef}
          id="checkout-final"
          className="relative min-h-screen bg-[linear-gradient(180deg,_rgb(248,250,252)_0%,_rgb(241,245,249)_100%)] px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10"
        >
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <Badge variant="secondary" className="bg-card text-foreground">
                  Etapa final
                </Badge>
                <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
                  Revisao completa antes de seguir para o pagamento.
                </h2>
                <p className="text-sm leading-7 text-muted-foreground md:text-base">
                  Aqui o scroll termina na conferencia do pedido: voce ajusta categoria por assento, revisa valores,
                  ve o que vai para a proxima tela e fecha o fluxo de compra.
                </p>
              </div>

              <Button type="button" variant="outline" onClick={() => scrollToSection("map")}>
                <ArrowLeft className="h-4 w-4" />
                Voltar ao mapa
              </Button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-4">
                {hasSelection ? (
                  selection.items.map((item) => {
                    const category = selectedTicketCategories[item.seatId] ?? item.ticketCategory;
                    const categoryMeta = ticketCategoryMeta[category];

                    return (
                      <section key={item.seatId} className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Badge variant="outline" className="bg-background">
                              {item.section.shortLabel}
                            </Badge>
                            <p className="mt-3 text-xl font-semibold text-foreground">Assento {item.label}</p>
                            <p className="text-sm text-muted-foreground">{item.section.name}</p>
                          </div>

                          <div className="rounded-xl bg-background px-4 py-3 text-right">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Valor atual</p>
                            <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(item.price)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Base {formatCurrency(item.basePrice)}</p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tipo do ingresso</p>
                            <Select
                              value={category}
                              onValueChange={(value) => {
                                if (isTicketCategory(value)) {
                                  handleTicketCategoryChange(item.seatId, value);
                                }
                              }}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                {ticketCategories.map((ticketCategory) => (
                                  <SelectItem key={ticketCategory} value={ticketCategory}>
                                    {ticketCategoryMeta[ticketCategory].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-sm leading-6 text-muted-foreground">{categoryMeta.description}</p>
                          </div>

                          <div className="rounded-xl bg-background p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Detalhes do ingresso</p>
                            <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                              <p>{categoryMeta.proofLabel}</p>
                              <p>O titular e os documentos deste assento serao finalizados na etapa de checkout.</p>
                              <p>Classificacao do evento: {event.details.ageRating}</p>
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })
                ) : (
                  <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
                    <p className="text-lg font-semibold text-foreground">Nenhum assento selecionado ainda</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Volte ao mapa acima, escolha seus lugares e depois role novamente para revisar o pedido.
                    </p>
                    <Button type="button" className="mt-4" onClick={() => scrollToSection("map")}>
                      Escolher assentos
                    </Button>
                  </section>
                )}

                <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Conferencia de beneficios e documentos
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-background p-4 text-sm leading-6 text-muted-foreground">
                      A meia entrada exige comprovacao valida no acesso ou na liberacao administrativa.
                    </div>
                    <div className="rounded-xl bg-background p-4 text-sm leading-6 text-muted-foreground">
                      O ingresso social pode depender de campanha ativa, contrapartida ou regra comercial.
                    </div>
                    <div className="rounded-xl bg-background p-4 text-sm leading-6 text-muted-foreground">
                      O QR final continua bloqueado ate a aprovacao administrativa do pedido.
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resumo pronto para checkout</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ingressos</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{selection.items.length}</p>
                    </div>

                    <div className="rounded-xl bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total estimado</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(pricing.total)}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 rounded-xl bg-background p-4">
                    {selection.items.length > 0 ? (
                      selection.items.map((item) => (
                        <div key={item.seatId} className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Assento {item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.section.shortLabel} | {ticketCategoryMeta[item.ticketCategory].label}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(item.price)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Seu resumo aparecera aqui assim que houver selecao.</p>
                    )}
                  </div>

                  <div className="mt-4 space-y-3 rounded-xl bg-background p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">{formatCurrency(pricing.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de servico</span>
                      <span className="font-medium text-foreground">{formatCurrency(pricing.serviceFee)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Processamento</span>
                      <span className="font-medium text-foreground">{formatCurrency(pricing.processingFee)}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    {hasSelection ? (
                      <Button asChild size="lg" className="w-full">
                        <Link to={`/eventos/${event.slug}/checkout?${checkoutParams.toString()}`}>
                          <CreditCard className="h-4 w-4" />
                          Ir para o checkout final
                        </Link>
                      </Button>
                    ) : (
                      <Button type="button" size="lg" className="w-full" disabled>
                        <CreditCard className="h-4 w-4" />
                        Selecione assentos para continuar
                      </Button>
                    )}

                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/eventos/${event.slug}`}>
                        <Ticket className="h-4 w-4" />
                        Voltar aos detalhes do evento
                      </Link>
                    </Button>
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">O que acontece na proxima tela</p>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                    <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-3 text-foreground">
                      <UserRound className="h-4 w-4 text-primary" />
                      Identificacao do comprador e dos titulares.
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-3 text-foreground">
                      <Wallet className="h-4 w-4 text-primary" />
                      Fechamento financeiro com Pix, cartao ou fluxo corporativo.
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-3 text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Revisao de seguranca antes de liberar o QR do ingresso.
                    </div>
                    <div className="rounded-xl bg-background p-4 text-sm leading-6 text-muted-foreground">
                      {event.details.importantNotice}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EventSeatExperience;
