import { useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container space-y-4 py-4">
        <Card className="border-border bg-card">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Operacao local
                </div>
                <h1 className="font-display text-3xl font-semibold text-foreground">Backoffice minimo</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Painel para revisar pedidos corporativos, liquidar pagamentos locais, cancelar pedidos e inspecionar
                  pagamentos, tickets, notificacoes e analytics operacionais.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fila de revisao</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.summary.underReviewOrders}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Pedidos aguardando acao manual.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Receita autorizada</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {currencyFormatter.format(snapshot.summary.authorizedRevenue)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Pagamentos aprovados neste navegador.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tickets emitidos</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.summary.issuedTickets}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Ingressos ativos no wallet local.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Eventos de analytics</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.summary.analyticsEvents}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Telemetria operacional acumulada.</p>
                </div>
              </div>
            </CardContent>

            <div className="border-t border-border bg-background lg:border-l lg:border-t-0">
              <div className="space-y-3 p-6">
                <Card className="border-border bg-card">
                  <CardContent className="space-y-3 p-6">
                    <p className="text-sm font-semibold text-foreground">Estado do ambiente</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Pedidos totais: {snapshot.summary.totalOrders}</p>
                      <p>Pedidos aprovados: {snapshot.summary.approvedOrders}</p>
                      <p>Pedidos cancelados: {snapshot.summary.cancelledOrders}</p>
                      <p>Refund local: {currencyFormatter.format(snapshot.summary.refundedRevenue)}</p>
                      <p>Notificacoes enviadas: {snapshot.summary.sentNotifications}</p>
                    </div>
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
        </Tabs>
      </main>

      <SiteFooter />
    </div>
  );
};

export default OperationsDashboard;
