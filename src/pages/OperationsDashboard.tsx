import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  Ticket,
  XCircle,
} from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useBackofficeSnapshot } from "@/hooks/use-backoffice-snapshot";
import { useToast } from "@/hooks/use-toast";
import {
  approveBackofficeOrder,
  cancelBackofficeOrder,
  denyBackofficeOrder,
} from "@/server/api/operations.api";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatDateTime = (value?: string | null) => (value ? dateFormatter.format(new Date(value)) : "—");

const statusVariantMap = {
  submitted: "outline",
  under_review: "secondary",
  approved: "default",
  cancelled: "destructive",
  authorized: "default",
  refunded: "destructive",
  failed: "destructive",
  expired: "outline",
  issued: "default",
  used: "secondary",
  sent: "default",
  queued: "outline",
  "order-confirmation": "default",
  "tickets-issued": "default",
  "payment-under-review": "secondary",
  "order-cancelled": "destructive",
} as const;

const diagnosticVariantMap = {
  success: "default",
  info: "outline",
  warning: "secondary",
  critical: "destructive",
} as const;

const chartColorMap: Record<string, string> = {
  submitted: "hsl(var(--muted-foreground))",
  under_review: "#f59e0b",
  approved: "hsl(var(--primary))",
  cancelled: "hsl(var(--destructive))",
  authorized: "hsl(var(--primary))",
  refunded: "hsl(var(--destructive))",
  failed: "hsl(var(--destructive))",
  expired: "hsl(var(--muted-foreground))",
  issued: "hsl(var(--primary))",
  used: "#0f766e",
  queued: "hsl(var(--muted-foreground))",
  sent: "#10b981",
  "tickets-issued": "hsl(var(--primary))",
  "tickets-cancelled": "hsl(var(--destructive))",
  "notifications-sent": "#10b981",
  "notifications-failed": "hsl(var(--destructive))",
};

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

const formatMinutes = (value: number) => {
  if (value <= 0) {
    return "0 min";
  }

  if (value < 60) {
    return `${value} min`;
  }

  const days = Math.floor(value / 1440);
  const hours = Math.floor((value % 1440) / 60);
  const minutes = value % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

type MiniBarDatum = {
  key: string;
  label: string;
  count?: number;
  amount?: number;
};

const MiniBarSpark = ({ data, dataKey }: { data: MiniBarDatum[]; dataKey: "count" | "amount" }) => {
  if (data.length === 0) {
    return <div className="flex h-20 items-center text-xs text-muted-foreground">Sem volume suficiente para a janela.</div>;
  }

  return (
    <div className="h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="28%">
          <Bar dataKey={dataKey} radius={[6, 6, 2, 2]} maxBarSize={18}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={chartColorMap[entry.key] ?? "hsl(var(--primary))"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const OperationsDashboard = () => {
  const auth = useAuth();
  const { toast } = useToast();
  const snapshot = useBackofficeSnapshot();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  if (!auth.isAuthenticated || !auth.currentAccount) {
    return <Navigate to="/conta/acesso" replace />;
  }

  const runOrderAction = async (
    orderId: string,
    action: (targetOrderId: string) => Promise<{ reference: string }>,
    successTitle: string,
    successDescription: (reference: string) => string,
    failureTitle: string,
  ) => {
    try {
      setActiveOrderId(orderId);
      const order = await action(orderId);
      toast({
        title: successTitle,
        description: successDescription(order.reference),
      });
    } catch (error) {
      toast({
        title: failureTitle,
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActiveOrderId(null);
    }
  };

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container flex min-h-[60vh] items-center justify-center py-10">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando operacao local...
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const activeEventsChart = snapshot.eventLoadSeries
    .filter((item) => item.activeOrders > 0)
    .map((item) => ({
      key: item.eventSlug,
      label: item.eventSlug,
      count: item.activeOrders,
    }));
  const grossRevenueChart = snapshot.eventLoadSeries
    .filter((item) => item.revenue > 0)
    .map((item) => ({
      key: item.eventSlug,
      label: item.eventSlug,
      amount: item.revenue,
    }));
  const feeRevenueChart = snapshot.eventLoadSeries
    .filter((item) => item.platformFeeRevenue > 0)
    .map((item) => ({
      key: item.eventSlug,
      label: item.eventSlug,
      amount: item.platformFeeRevenue,
    }));
  const topOperationalEvent = snapshot.eventLoadSeries[0];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container space-y-4 py-4">
        <Card className="overflow-hidden border-border bg-card">
          <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Admin da plataforma
                </div>
                <h1 className="font-display text-3xl font-semibold text-foreground">Administracao da plataforma</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Rota administrativa da plataforma para revisar pedidos corporativos, monitorar coerencia entre pedido,
                  pagamento, ticket e notificacao, e acompanhar o fluxo recente com leitura visual mais precisa.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/produtor/meus-eventos">
                      <ShieldCheck className="h-4 w-4" />
                      Voltar para meus eventos
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Eventos com operacao</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">
                        {snapshot.summary.activeEventsCount}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Eventos com pedido ativo, aprovado ou em revisao no ambiente local.
                      </p>
                    </div>
                    <Activity className="mt-1 h-5 w-5 text-primary" />
                  </div>
                  <MiniBarSpark data={activeEventsChart} dataKey="count" />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p>
                      Pedidos ativos <span className="font-medium text-foreground">{snapshot.summary.totalOrders - snapshot.summary.cancelledOrders}</span>
                    </p>
                    <p>
                      Maior frente <span className="font-medium text-foreground">{topOperationalEvent?.eventSlug ?? "—"}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bruto transacionado</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">
                        {currencyFormatter.format(snapshot.summary.grossPlatformRevenue)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Pagamentos autorizados e valores ja refundados entram no bruto da plataforma.
                      </p>
                    </div>
                    <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                  </div>
                  <MiniBarSpark data={grossRevenueChart} dataKey="amount" />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p>
                      Autorizado atual <span className="font-medium text-foreground">{currencyFormatter.format(snapshot.summary.authorizedRevenue)}</span>
                    </p>
                    <p>
                      Refund <span className="font-medium text-foreground">{currencyFormatter.format(snapshot.summary.refundedRevenue)}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fee liquida da plataforma</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">
                        {currencyFormatter.format(snapshot.summary.netPlatformFeeRevenue)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        10% sobre o valor dos ingressos aprovados e nao cancelados.
                      </p>
                    </div>
                    <Ticket className="mt-1 h-5 w-5 text-primary" />
                  </div>
                  <MiniBarSpark data={feeRevenueChart} dataKey="amount" />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p>
                      Fee na fila <span className="font-medium text-foreground">{currencyFormatter.format(snapshot.summary.pendingPlatformFeeRevenue)}</span>
                    </p>
                    <p>
                      Taxa fixa <span className="font-medium text-foreground">{percentFormatter.format(10)}%</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="border-t border-border bg-background xl:border-l xl:border-t-0">
              <div className="grid gap-3 p-6">
                <Card className="border-border bg-card">
                  <CardContent className="space-y-4 p-6">
                    <p className="text-sm font-semibold text-foreground">Operacao agora</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-background p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fila de revisao</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{snapshot.summary.underReviewOrders}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-background p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Backlog bruto</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                          {currencyFormatter.format(snapshot.summary.pendingReviewRevenue)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-background p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Lead da fila</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{formatMinutes(snapshot.summary.oldestReviewAgeMinutes)}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-background p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          Ultima atividade
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {formatDateTime(snapshot.summary.lastActivityAt)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">{snapshot.diagnostics[0]?.title ?? "Sem alertas"}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {snapshot.diagnostics[0]?.summary ?? "Acompanhe a aba de diagnosticos para novos sinais operacionais."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground">
                          Criticos: {snapshot.summary.criticalDiagnostics}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground">
                          Notificacoes falhas: {snapshot.summary.failedNotifications}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground">
                          Analytics: {snapshot.summary.analyticsEvents}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardContent className="space-y-4 p-6">
                    <p className="text-sm font-semibold text-foreground">Carga por evento</p>
                    {snapshot.eventLoadSeries.length > 0 ? (
                      <div className="space-y-4">
                        {snapshot.eventLoadSeries.map((eventLoad) => {
                          const peakRevenue = Math.max(...snapshot.eventLoadSeries.map((item) => item.revenue), 1);
                          const width = peakRevenue > 0 ? Math.max((eventLoad.revenue / peakRevenue) * 100, 10) : 0;

                          return (
                            <div key={eventLoad.eventSlug} className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-foreground">{eventLoad.eventSlug}</p>
                                    {eventLoad.reviewQueueOrders > 0 ? (
                                      <Badge variant="secondary">{eventLoad.reviewQueueOrders} em revisao</Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {eventLoad.orders} pedidos · {eventLoad.activeOrders} ativos · {eventLoad.approvedOrders} aprovados
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-foreground">
                                    {currencyFormatter.format(eventLoad.revenue)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Fee {currencyFormatter.format(eventLoad.platformFeeRevenue)}
                                  </p>
                                </div>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
                        Assim que houver pedidos persistidos, esta area passa a mostrar a concentracao de volume e fila por evento.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="review" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-muted p-2">
            <TabsTrigger value="review">Fila de revisao</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="tickets">Ingressos</TabsTrigger>
            <TabsTrigger value="notifications">Notificacoes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnosticos</TabsTrigger>
            <TabsTrigger value="runbooks">Runbooks</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-4">
            {snapshot.reviewQueue.length > 0 ? (
              snapshot.reviewQueue.map((row) => (
                <Card key={row.order.id} className="border-border bg-card">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{row.order.status}</Badge>
                          <span className="text-sm font-semibold text-foreground">{row.order.reference}</span>
                          <span className="text-sm text-muted-foreground">{row.order.eventSlug}</span>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          Comprador: {row.order.buyer.fullName} · {row.order.buyer.email} · {row.order.paymentMethod}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {row.order.tickets.map((ticket) => (
                            <span
                              key={ticket.seatId}
                              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                            >
                              {ticket.sectionName} · {ticket.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 xl:text-right">
                        <p className="text-2xl font-semibold text-foreground">
                          {currencyFormatter.format(row.order.pricing.total)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {row.payment?.corporateProtocol ? `Protocolo ${row.payment.corporateProtocol}` : "Sem protocolo"}
                        </p>
                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          <Button
                            size="sm"
                            onClick={() =>
                              runOrderAction(
                                row.order.id,
                                approveBackofficeOrder,
                                "Pedido aprovado",
                                (reference) => `O pedido ${reference} foi liquidado e os ingressos foram emitidos.`,
                                "Nao foi possivel aprovar",
                              )
                            }
                            disabled={activeOrderId === row.order.id}
                          >
                            {activeOrderId === row.order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              runOrderAction(
                                row.order.id,
                                denyBackofficeOrder,
                                "Pedido negado",
                                (reference) => `O pedido ${reference} foi cancelado e o inventario voltou para disponibilidade.`,
                                "Nao foi possivel negar",
                              )
                            }
                            disabled={activeOrderId === row.order.id}
                          >
                            <XCircle className="h-4 w-4" />
                            Negar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-border bg-card">
                <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
                  Nao ha pedidos em revisao no momento. Quando um pagamento corporativo cair em `under_review`, ele
                  aparece aqui com a acao de aprovar ou negar.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {snapshot.orders.map((row) => (
              <Card key={row.order.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariantMap[row.order.status] ?? "outline"}>{row.order.status}</Badge>
                        <span className="font-semibold text-foreground">{row.order.reference}</span>
                        <span className="text-sm text-muted-foreground">{row.order.eventSlug}</span>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {row.order.buyer.fullName} · {row.order.buyer.email} · Criado em {formatDateTime(row.order.createdAt)}
                      </p>
                    </div>

                    <div className="space-y-2 xl:text-right">
                      <p className="text-xl font-semibold text-foreground">
                        {currencyFormatter.format(row.order.pricing.total)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pagamento: {row.payment?.status ?? "sem pagamento"} · Tickets: {row.tickets.length}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div className="flex flex-wrap gap-2">
                      {row.order.tickets.map((ticket) => (
                        <span
                          key={ticket.seatId}
                          className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                        >
                          {ticket.sectionName} · {ticket.label} · {ticket.ticketCategory}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {row.order.status === "under_review" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              runOrderAction(
                                row.order.id,
                                approveBackofficeOrder,
                                "Pedido aprovado",
                                (reference) => `O pedido ${reference} foi liquidado e os ingressos foram emitidos.`,
                                "Nao foi possivel aprovar",
                              )
                            }
                            disabled={activeOrderId === row.order.id}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              runOrderAction(
                                row.order.id,
                                denyBackofficeOrder,
                                "Pedido negado",
                                (reference) => `O pedido ${reference} foi cancelado e o inventario voltou para disponibilidade.`,
                                "Nao foi possivel negar",
                              )
                            }
                            disabled={activeOrderId === row.order.id}
                          >
                            <XCircle className="h-4 w-4" />
                            Negar
                          </Button>
                        </>
                      ) : null}

                      {row.order.status === "approved" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            runOrderAction(
                              row.order.id,
                              cancelBackofficeOrder,
                              "Pedido cancelado",
                              (reference) => `O pedido ${reference} foi cancelado e o refund local foi aplicado.`,
                              "Nao foi possivel cancelar",
                            )
                          }
                          disabled={activeOrderId === row.order.id}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelar pedido
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pagamento</p>
                      <p className="mt-2 font-semibold text-foreground">{row.payment?.reference ?? "Nao criado"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{row.payment?.provider ?? "Sem provider"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notificacoes</p>
                      <p className="mt-2 font-semibold text-foreground">{row.notifications.length}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Registros vinculados ao pedido</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Analytics</p>
                      <p className="mt-2 font-semibold text-foreground">{row.analytics.length}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Eventos operacionais vinculados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            {snapshot.payments.map((payment) => (
              <Card key={payment.id} className="border-border bg-card">
                <CardContent className="flex flex-col gap-3 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariantMap[payment.status] ?? "outline"}>{payment.status}</Badge>
                      <span className="font-semibold text-foreground">{payment.reference}</span>
                      <span className="text-sm text-muted-foreground">{payment.eventSlug}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Metodo: {payment.method} · Provider: {payment.provider} · Pedido {payment.orderReference}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {payment.pixExpiresAt ? (
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground">
                          Expira em {formatDateTime(payment.pixExpiresAt)}
                        </span>
                      ) : null}
                      {payment.corporateProtocol ? (
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground">
                          Protocolo {payment.corporateProtocol}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1 lg:text-right">
                    <p className="text-xl font-semibold text-foreground">{currencyFormatter.format(payment.amount)}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(payment.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            {snapshot.tickets.map((ticket) => (
              <Card key={ticket.id} className="border-border bg-card">
                <CardContent className="flex flex-col gap-3 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariantMap[ticket.status] ?? "outline"}>{ticket.status}</Badge>
                      <span className="font-semibold text-foreground">{ticket.sectionName}</span>
                      <span className="text-sm text-muted-foreground">{ticket.label}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {ticket.holderName} · Pedido {ticket.orderReference} · Evento {ticket.eventSlug}
                    </p>
                  </div>

                  <div className="space-y-1 lg:text-right">
                    <p className="text-sm font-semibold text-foreground">{ticket.barcode}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(ticket.issuedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            {snapshot.notifications.map((notification) => (
              <Card key={notification.id} className="border-border bg-card">
                <CardContent className="flex flex-col gap-3 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariantMap[notification.template] ?? "outline"}>{notification.template}</Badge>
                      <span className="font-semibold text-foreground">{notification.subject}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {notification.recipient} · {notification.eventSlug} · {notification.preview}
                    </p>
                  </div>

                  <div className="space-y-1 lg:text-right">
                    <p className="text-sm font-semibold text-foreground">{notification.channel}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {snapshot.analytics.map((event) => (
              <Card key={event.id} className="border-border bg-card">
                <CardContent className="flex flex-col gap-3 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{event.name}</Badge>
                      <span className="text-sm text-muted-foreground">{event.eventSlug ?? "sem evento"}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Pedido: {event.orderId ?? "—"} · Conta: {event.accountId ?? "—"}
                    </p>
                    {event.payload ? (
                      <div className="rounded-xl border border-border bg-background p-3 text-xs leading-6 text-muted-foreground">
                        {JSON.stringify(event.payload)}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-1 lg:text-right">
                    <p className="text-sm font-semibold text-foreground">{formatDateTime(event.occurredAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-4">
            {snapshot.diagnostics.map((diagnostic) => (
              <Card key={diagnostic.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={diagnosticVariantMap[diagnostic.severity]}>
                          {diagnostic.severity}
                        </Badge>
                        <span className="font-semibold text-foreground">{diagnostic.title}</span>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{diagnostic.summary}</p>
                    </div>

                    {diagnostic.metricLabel && diagnostic.metricValue ? (
                      <div className="rounded-xl border border-border bg-background p-4 lg:min-w-60">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{diagnostic.metricLabel}</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{diagnostic.metricValue}</p>
                      </div>
                    ) : null}
                  </div>

                  {diagnostic.references.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Referencias</p>
                      <div className="flex flex-wrap gap-2">
                        {diagnostic.references.map((reference) => (
                          <span
                            key={reference}
                            className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                          >
                            {reference}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Acoes sugeridas</p>
                    <div className="grid gap-2">
                      {diagnostic.actions.map((action) => (
                        <div key={action} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="runbooks" className="space-y-4">
            {snapshot.runbooks.map((runbook) => (
              <Card key={runbook.id} className="border-border bg-card">
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <BookOpenText className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{runbook.title}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{runbook.summary}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quando usar</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{runbook.trigger}</p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Passo a passo</p>
                      <div className="grid gap-2">
                        {runbook.steps.map((step, index) => (
                          <div key={step} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                            {index + 1}. {step}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Criterios de sucesso</p>
                      <div className="grid gap-2">
                        {runbook.successCriteria.map((criterion) => (
                          <div
                            key={criterion}
                            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                          >
                            {criterion}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <SiteFooter />
    </div>
  );
};

export default OperationsDashboard;
