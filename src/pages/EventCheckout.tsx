import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CreditCard, LockKeyhole, QrCode, ShieldCheck, Ticket, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useEventRuntime } from "@/hooks/use-event-runtime";
import { useToast } from "@/hooks/use-toast";
import {
  formatCurrency,
  getCheckoutPricing,
  getSelectionSummary,
  parseSeatIdsParam,
  parseTicketCategoriesParam,
  type SelectedSeatSummary,
  sanitizeSelectedSeatIds,
  sanitizeTicketCategories,
  ticketCategoryMeta,
} from "@/lib/ticketing";
import { createOrder } from "@/server/api/orders.api";
import NotFound from "./NotFound";

const paymentMethods = [
  {
    id: "pix",
    title: "Pix",
    description: "Pagamento rapido com confirmacao quase imediata para liberar a analise do pedido.",
  },
  {
    id: "card",
    title: "Cartao de credito",
    description: "Fluxo preparado para parcelamento e futura integracao com gateway antifraude.",
  },
  {
    id: "corporate",
    title: "Reserva corporativa",
    description: "Pedido entra em revisao manual para faturamento, aprovacao e emissao posterior.",
  },
] as const;

const checkoutSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo do comprador."),
  email: z.string().email("Informe um email valido."),
  document: z.string().min(11, "Informe um documento valido."),
  phone: z.string().min(10, "Informe um telefone valido."),
  city: z.string().min(2, "Informe a cidade do comprador."),
  paymentMethod: z.enum(["pix", "card", "corporate"]),
  installments: z.string().min(1, "Selecione o parcelamento."),
  tickets: z.array(
    z.object({
      holderName: z.string().min(3, "Informe o nome do titular."),
      document: z.string().min(11, "Informe um documento valido para o titular."),
    }),
  ),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "Voce precisa aceitar os termos desta simulacao de checkout.",
  }),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

const buildCheckoutDefaults = (
  ticketCount: number,
  account?: {
    fullName: string;
    email: string;
    document: string;
    phone: string;
    city: string;
  } | null,
): CheckoutValues => ({
  fullName: account?.fullName ?? "",
  email: account?.email ?? "",
  document: account?.document ?? "",
  phone: account?.phone ?? "",
  city: account?.city ?? "",
  paymentMethod: "pix",
  installments: "1x",
  tickets: Array.from({ length: ticketCount }, (_, index) => ({
    holderName: index === 0 ? account?.fullName ?? "" : "",
    document: index === 0 ? account?.document ?? "" : "",
  })),
  acceptTerms: false,
});

const EventCheckout = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { currentAccount, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [checkoutReference, setCheckoutReference] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<"approved" | "under_review" | null>(null);
  const holdToken = searchParams.get("hold");
  const { baseEvent, event, isLoading } = useEventRuntime(slug, holdToken);

  const rawSeatIds = parseSeatIdsParam(searchParams.get("assentos"));
  const selectedSeatIds = event ? sanitizeSelectedSeatIds(event, rawSeatIds) : [];
  const removedSeatCount = rawSeatIds.length - selectedSeatIds.length;
  const ticketCategories = event
    ? sanitizeTicketCategories(event, selectedSeatIds, parseTicketCategoriesParam(searchParams.get("tipos")))
    : {};
  const selection: SelectedSeatSummary = event
    ? getSelectionSummary(event, selectedSeatIds, ticketCategories)
    : { items: [], total: 0 };
  const pricing = getCheckoutPricing(selection.total, selection.items.length);
  const defaultFormValues = useMemo(
    () => buildCheckoutDefaults(selection.items.length, currentAccount),
    [currentAccount, selection.items.length],
  );

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: defaultFormValues,
  });

  const paymentMethod = form.watch("paymentMethod");

  useEffect(() => {
    form.reset(defaultFormValues);
  }, [defaultFormValues, form]);

  if (!baseEvent && !isLoading) {
    return <NotFound />;
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-white/75">
        Carregando estrutura do checkout...
      </div>
    );
  }

  if (selection.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />

        <main className="container py-4">
          <Card className="border-border bg-card">
            <CardContent className="space-y-4 p-6">
              <Badge variant="secondary" className="bg-muted text-foreground">
                Checkout
              </Badge>
              <h1 className="font-display text-3xl font-semibold text-foreground">Nenhum assento pronto para checkout</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                O checkout so abre depois da escolha no mapa de sala. Volte para o evento, revise os setores e
                selecione assentos disponiveis antes de seguir para o pagamento.
              </p>
              <Button asChild>
                <Link to={`/eventos/${event.slug}/assentos`}>Ir para o mapa de sala</Link>
              </Button>
            </CardContent>
          </Card>
        </main>

        <SiteFooter />
      </div>
    );
  }

  const handleSubmit = async (values: CheckoutValues) => {
    try {
      const order = await createOrder({
        event,
        selectedSeatIds,
        ticketCategories,
        buyer: {
          fullName: values.fullName,
          email: values.email,
          document: values.document,
          phone: values.phone,
          city: values.city,
        },
        tickets: selectedSeatIds.map((seatId, index) => ({
          seatId,
          holderName: values.tickets[index]?.holderName ?? "",
          document: values.tickets[index]?.document ?? "",
        })),
        paymentMethod: values.paymentMethod,
        installments: values.installments,
        accountId: currentAccount?.id ?? null,
        holdToken,
      });

      setCheckoutReference(order.reference);
      setCheckoutStatus(order.status === "under_review" ? "under_review" : "approved");

      if (order.status === "under_review") {
        toast({
          title: "Pedido em revisao",
          description: `Pedido ${order.reference} entrou em revisao manual e os ingressos ainda nao foram emitidos.`,
        });
      } else {
        toast({
          title: "Pedido criado",
          description: `Pedido ${order.reference} aprovado localmente com ingressos emitidos para a area da conta.`,
        });
      }
    } catch (error) {
      toast({
        title: "Nao foi possivel fechar o pedido",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={`/eventos/${event.slug}/assentos?assentos=${encodeURIComponent(searchParams.get("assentos") ?? "")}&tipos=${encodeURIComponent(searchParams.get("tipos") ?? "")}${holdToken ? `&hold=${encodeURIComponent(holdToken)}` : ""}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o mapa de sala
          </Link>

          <Badge variant="secondary" className="bg-muted text-foreground">
            Checkout
          </Badge>
        </div>

        <Card className="overflow-hidden border-border bg-card">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  <Ticket className="w-4 h-4 text-primary" />
                  Checkout do ingresso
                </div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{event.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {event.city} | {event.weekday}, {event.day} de {event.month} | {event.time}
                </p>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                Esta area fecha os dados do comprador, titulares dos ingressos e a preparacao do pagamento sem sair da
                linguagem visual da base principal. A escolha dos lugares continua sendo a etapa anterior e obrigatoria
                no mapa de sala, junto com a definicao de inteira, meia entrada ou categoria social.
              </p>

              <div className="flex flex-wrap gap-2">
                {selection.items.map((item) => (
                  <Badge key={item.seatId} variant="outline" className="bg-background">
                    {item.section.shortLabel} | {item.label} | {ticketCategoryMeta[item.ticketCategory].label}
                  </Badge>
                ))}
              </div>
            </CardContent>

            <div className="border-t border-border bg-background lg:border-l lg:border-t-0">
              <div className="space-y-4 p-6">
                <div className="rounded-lg bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ingressos no pedido</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{selection.items.length}</p>
                </div>

                <div className="rounded-lg bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total estimado</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(pricing.total)}</p>
                </div>

                <div className="rounded-lg bg-card p-4 text-sm leading-6 text-muted-foreground">
                  O QR do ingresso continua sujeito a validacao administrativa antes da emissao final.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {removedSeatCount > 0 && (
          <Card className="border-border bg-card">
            <CardContent className="flex items-start gap-3 p-4 text-sm leading-6 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p>
                {removedSeatCount} assento(s) foram removidos deste checkout por estarem invalidos ou indisponiveis no
                momento da revisao.
              </p>
            </CardContent>
          </Card>
        )}

        {checkoutReference && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Pedido local preparado: {checkoutReference}</p>
                <p className="text-sm text-muted-foreground">
                  {checkoutStatus === "under_review"
                    ? "O pedido entrou em revisao manual. Assim que o pagamento for aprovado, os ingressos serao emitidos."
                    : "O pedido foi aprovado localmente, os tickets foram emitidos e a confirmacao entrou na outbox desta base."}
                </p>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                {checkoutStatus === "under_review" ? "Em revisao" : "Aprovado localmente"}
              </Badge>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Form {...form}>
            <form id="checkout-form" className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              {!isAuthenticated && (
                <Card className="border-border bg-card">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center gap-2 text-foreground">
                      <UserRound className="w-4 h-4 text-primary" />
                      <p className="font-semibold">Entrar pode acelerar o checkout</p>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Se o usuario entrar na conta, podemos preencher dados cadastrais automaticamente nesta etapa.
                    </p>
                    <Button type="button" variant="outline" asChild>
                      <Link to="/conta/acesso">Entrar ou cadastrar</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Comprador</CardTitle>
                  <CardDescription>Dados principais de quem esta fechando o pedido.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome e sobrenome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="voce@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="document"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Documento</FormLabel>
                          <FormControl>
                            <Input placeholder="CPF ou documento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade / UF" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Titulares dos ingressos</CardTitle>
                  <CardDescription>Um bloco por assento para prepararmos emissao e conferencia futura.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selection.items.map((item, index) => (
                    <div key={item.seatId} className="rounded-lg bg-background p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Assento {item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.section.name} | {ticketCategoryMeta[item.ticketCategory].label}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-card">
                          {formatCurrency(item.price)}
                        </Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`tickets.${index}.holderName` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do titular</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome impresso no ingresso" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`tickets.${index}.document` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Documento do titular</FormLabel>
                              <FormControl>
                                <Input placeholder="CPF ou documento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Pagamento</CardTitle>
                  <CardDescription>Espaco para o fluxo financeiro e a futura integracao com gateway.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Metodo de pagamento</FormLabel>
                        <FormControl>
                          <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3">
                            {paymentMethods.map((method) => (
                              <div
                                key={method.id}
                                className={[
                                  "rounded-lg border p-4 transition-colors",
                                  field.value === method.id ? "border-primary bg-primary/5" : "border-border bg-background",
                                ].join(" ")}
                              >
                                <Label htmlFor={`payment-${method.id}`} className="flex cursor-pointer items-start gap-3">
                                  <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="mt-1" />
                                  <div className="space-y-1">
                                    <p className="font-semibold text-foreground">{method.title}</p>
                                    <p className="text-sm leading-6 text-muted-foreground">{method.description}</p>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {paymentMethod === "card" && (
                    <FormField
                      control={form.control}
                      name="installments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parcelamento</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o parcelamento" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1x">1x sem juros</SelectItem>
                                <SelectItem value="2x">2x sem juros</SelectItem>
                                <SelectItem value="3x">3x sem juros</SelectItem>
                                <SelectItem value="4x">4x com gateway</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>O parcelamento real sera confirmado quando o gateway entrar.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="rounded-lg bg-background p-4 text-sm leading-6 text-muted-foreground">
                    {paymentMethod === "pix" && (
                      <p>O checkout fica pronto para gerar QR Pix dinamico e aguardar confirmacao do provedor financeiro.</p>
                    )}
                    {paymentMethod === "card" && (
                      <p>Reserve este bloco para tokenizacao do cartao, antifraude e retorno do gateway de pagamento.</p>
                    )}
                    {paymentMethod === "corporate" && (
                      <p>Use esta opcao para pedidos que dependem de analise comercial, contrato e aprovacao manual.</p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="rounded-lg bg-background p-4">
                        <div className="flex items-start gap-3">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel>Confirmo os dados do pedido e entendo que esta tela ainda depende do backend real.</FormLabel>
                            <FormDescription>
                              O ingresso digital e o QR final so devem ser emitidos apos aprovacao e integracao completa.
                            </FormDescription>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>

          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Resumo do pedido</CardTitle>
                <CardDescription>Visao consolidada para usuario e operacao.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {selection.items.map((item) => (
                    <div key={item.seatId} className="flex items-center justify-between rounded-lg bg-background px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Assento {item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.section.name} | {ticketCategoryMeta[item.ticketCategory].label}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-lg bg-background p-4">
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
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Total</span>
                      <span className="text-2xl font-semibold text-foreground">{formatCurrency(pricing.total)}</span>
                    </div>
                  </div>
                </div>

                <Button type="submit" form="checkout-form" className="w-full">
                  <CreditCard className="w-4 h-4" />
                  Fechar checkout
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Seguranca do fluxo</CardTitle>
                <CardDescription>Regras importantes para o ticketing e a operacao.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-foreground">
                  <LockKeyhole className="w-4 h-4 text-primary" />
                  Dados do comprador devem seguir mascaramento e trilha de auditoria no backend.
                </div>
                <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-foreground">
                  <QrCode className="w-4 h-4 text-primary" />
                  O QR final continua dependente da etapa de validacao administrativa.
                </div>
                <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Assentos indisponiveis sao removidos do checkout para evitar pedido inconsistente.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default EventCheckout;
