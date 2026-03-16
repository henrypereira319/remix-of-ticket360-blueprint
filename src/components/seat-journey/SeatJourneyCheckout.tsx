import { ArrowLeft, CreditCard, ShieldCheck, Ticket, UserRound, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatCurrency,
  ticketCategoryMeta,
  type TicketCategory,
} from "@/lib/ticketing";
import type { EventData } from "@/data/events";

const ticketCategories = Object.keys(ticketCategoryMeta) as TicketCategory[];
const isTicketCategory = (value: string): value is TicketCategory =>
  ticketCategories.includes(value as TicketCategory);

interface SelectionItem {
  seatId: string;
  label: string;
  section: { name: string; shortLabel: string };
  price: number;
  basePrice: number;
  ticketCategory: TicketCategory;
}

interface CheckoutPricing {
  subtotal: number;
  serviceFee: number;
  processingFee: number;
  total: number;
}

interface SeatJourneyCheckoutProps {
  event: EventData;
  items: SelectionItem[];
  pricing: CheckoutPricing;
  selectedTicketCategories: Record<string, TicketCategory>;
  onTicketCategoryChange: (seatId: string, category: TicketCategory) => void;
  onScrollToMap: () => void;
  checkoutUrl: string;
}

const SeatJourneyCheckout = ({
  event,
  items,
  pricing,
  selectedTicketCategories,
  onTicketCategoryChange,
  onScrollToMap,
  checkoutUrl,
}: SeatJourneyCheckoutProps) => {
  const hasSelection = items.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 px-4 pb-28 pt-12 sm:px-6 sm:pb-32 sm:pt-16">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="secondary" className="bg-card text-foreground">
              Revisão do pedido
            </Badge>
            <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
              Confira seus assentos e finalize a compra.
            </h2>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              Ajuste a categoria de cada ingresso, revise os valores e siga para o pagamento.
            </p>
          </div>

          <Button type="button" variant="outline" onClick={onScrollToMap}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao mapa
          </Button>
        </div>

        {/* Content grid */}
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          {/* Left: seat cards */}
          <div className="space-y-4">
            {hasSelection ? (
              items.map((item) => {
                const category = selectedTicketCategories[item.seatId] ?? item.ticketCategory;
                const categoryMeta = ticketCategoryMeta[category];

                return (
                  <section key={item.seatId} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Badge variant="outline" className="bg-background">
                          {item.section.shortLabel}
                        </Badge>
                        <p className="mt-3 text-xl font-semibold text-foreground">Assento {item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.section.name}</p>
                      </div>

                      <div className="rounded-xl bg-background px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Valor</p>
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
                              onTicketCategoryChange(item.seatId, value);
                            }
                          }}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {ticketCategories.map((tc) => (
                              <SelectItem key={tc} value={tc}>
                                {ticketCategoryMeta[tc].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm leading-6 text-muted-foreground">{categoryMeta.description}</p>
                      </div>

                      <div className="rounded-xl bg-background p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Detalhes</p>
                        <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                          <p>{categoryMeta.proofLabel}</p>
                          <p>Dados do titular serão finalizados no checkout.</p>
                          <p>Classificação: {event.details.ageRating}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })
            ) : (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="text-lg font-semibold text-foreground">Nenhum assento selecionado</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Volte ao mapa, escolha seus lugares e role para cá novamente.
                </p>
                <Button type="button" className="mt-4" onClick={onScrollToMap}>
                  Escolher assentos
                </Button>
              </section>
            )}

            {/* Info cards */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Benefícios e documentos
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-background p-4 text-sm leading-6 text-muted-foreground">
                  Meia-entrada exige comprovação válida no acesso.
                </div>
                <div className="rounded-xl bg-background p-4 text-sm leading-6 text-muted-foreground">
                  Ingresso social pode depender de campanha ativa.
                </div>
                <div className="rounded-xl bg-background p-4 text-sm leading-6 text-muted-foreground">
                  QR bloqueado até aprovação do pedido.
                </div>
              </div>
            </section>
          </div>

          {/* Right: summary */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resumo do pedido</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ingressos</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{items.length}</p>
                </div>
                <div className="rounded-xl bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(pricing.total)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-xl bg-background p-4">
                {items.length > 0 ? (
                  items.map((item) => (
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
                  <p className="text-sm text-muted-foreground">Selecione assentos no mapa acima.</p>
                )}
              </div>

              <div className="mt-4 space-y-3 rounded-xl bg-background p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(pricing.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de serviço</span>
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
                    <Link to={checkoutUrl}>
                      <CreditCard className="h-4 w-4" />
                      Ir para o pagamento
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
                    Voltar ao evento
                  </Link>
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Próxima etapa</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-3 text-foreground">
                  <UserRound className="h-4 w-4 text-primary" />
                  Identificação do comprador e titulares.
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-3 text-foreground">
                  <Wallet className="h-4 w-4 text-primary" />
                  Pagamento via Pix, cartão ou fluxo corporativo.
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-3 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Revisão de segurança antes de liberar o QR.
                </div>
                <div className="rounded-xl bg-background p-4 text-sm leading-6 text-muted-foreground">
                  {event.details.importantNotice}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatJourneyCheckout;
