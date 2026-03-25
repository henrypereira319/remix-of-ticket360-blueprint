import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BadgeCheck, CalendarRange, LifeBuoy, LogOut, Mail, QrCode, ShieldCheck, Ticket, UserRound, Wallet } from "lucide-react";
import GoogleOAuthPlaceholder from "@/components/GoogleOAuthPlaceholder";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAccountNotifications } from "@/hooks/use-account-notifications";
import { useAccountOrders } from "@/hooks/use-account-orders";
import { useAccountPayments } from "@/hooks/use-account-payments";
import { useAccountTickets } from "@/hooks/use-account-tickets";
import { useAuth } from "@/hooks/use-auth";
import { useSupportCases } from "@/hooks/use-support-cases";
import { useToast } from "@/hooks/use-toast";
import {
  buildOrderTimeline,
  filterOrdersByStatus,
  humanizeEventSlug,
  maskDocument,
  maskEmail,
  notificationStatusMeta,
  notificationTemplateLabels,
  orderStatusMeta,
  paymentMethodLabels,
  paymentStatusMeta,
  ticketStatusMeta,
  type AccountOrderStatusFilter,
  type AccountStatusTone,
} from "@/lib/account-center";
import { cn } from "@/lib/utils";
import { supportCategoryLabels, supportHelpArticles, supportStatusMeta } from "@/lib/support-center";
import { createSupportCase } from "@/server/api/support.api";
import type { SupportCaseCategory } from "@/server/support.service";

const profileSchema = z.object({
  fullName: z.string().min(3, "Informe seu nome completo."),
  email: z.string().email("Informe um email valido."),
  document: z.string().min(11, "Informe um documento valido."),
  phone: z.string().min(10, "Informe um telefone valido."),
  city: z.string().min(2, "Informe sua cidade."),
});

type ProfileValues = z.infer<typeof profileSchema>;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const toneClasses: Record<AccountStatusTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

const orderStatusFilters: { value: AccountOrderStatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "approved", label: "Aprovados" },
  { value: "under_review", label: "Em revisao" },
  { value: "submitted", label: "Recebidos" },
  { value: "cancelled", label: "Cancelados" },
];

const StatusBadge = ({ label, tone }: { label: string; tone: AccountStatusTone }) => (
  <Badge variant="outline" className={cn("border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]", toneClasses[tone])}>
    {label}
  </Badge>
);

const DetailMetric = ({ label, value, helper }: { label: string; value: string; helper?: string }) => (
  <div className="rounded-md border border-border bg-background p-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    {helper ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
  </div>
);

const DetailField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground">{value}</p>
  </div>
);

const AccountDashboard = () => {
  const auth = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderFilter, setOrderFilter] = useState<AccountOrderStatusFilter>("all");
  const { orders } = useAccountOrders(auth.currentAccount?.id);
  const { payments } = useAccountPayments(auth.currentAccount?.id);
  const { tickets } = useAccountTickets(auth.currentAccount?.id);
  const { notifications } = useAccountNotifications(auth.currentAccount?.id);
  const { supportCases } = useSupportCases(auth.currentAccount?.id);
  const [supportCategory, setSupportCategory] = useState<SupportCaseCategory>("order");
  const [supportOrderId, setSupportOrderId] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: auth.currentAccount?.fullName ?? "",
      email: auth.currentAccount?.email ?? "",
      document: auth.currentAccount?.document ?? "",
      phone: auth.currentAccount?.phone ?? "",
      city: auth.currentAccount?.city ?? "",
    },
  });

  useEffect(() => {
    if (!auth.currentAccount) {
      return;
    }

    profileForm.reset({
      fullName: auth.currentAccount.fullName,
      email: auth.currentAccount.email,
      document: auth.currentAccount.document,
      phone: auth.currentAccount.phone,
      city: auth.currentAccount.city,
    });
  }, [auth.currentAccount, profileForm]);

  if (!auth.isAuthenticated || !auth.currentAccount) {
    return <Navigate to="/conta/acesso" replace />;
  }

  const paymentsByOrderId = Object.fromEntries(payments.map((payment) => [payment.orderId, payment]));
  const ticketsByOrderId: Record<string, typeof tickets> = {};
  const notificationsByOrderId: Record<string, typeof notifications> = {};

  tickets.forEach((ticket) => {
    ticketsByOrderId[ticket.orderId] = [...(ticketsByOrderId[ticket.orderId] ?? []), ticket];
  });

  notifications.forEach((notification) => {
    if (!notification.orderId) {
      return;
    }

    notificationsByOrderId[notification.orderId] = [...(notificationsByOrderId[notification.orderId] ?? []), notification];
  });

  const orderCounts: Record<AccountOrderStatusFilter, number> = {
    all: orders.length,
    approved: 0,
    under_review: 0,
    submitted: 0,
    cancelled: 0,
  };

  orders.forEach((order) => {
    orderCounts[order.status] += 1;
  });

  const filteredOrders = filterOrdersByStatus(orders, orderFilter);
  const selectedOrderId = searchParams.get("order");
  const selectedOrder = selectedOrderId ? orders.find((order) => order.id === selectedOrderId) ?? null : null;
  const selectedOrderPayment = selectedOrder ? paymentsByOrderId[selectedOrder.id] ?? null : null;
  const selectedOrderTickets = selectedOrder ? ticketsByOrderId[selectedOrder.id] ?? [] : [];
  const selectedOrderNotifications = selectedOrder ? notificationsByOrderId[selectedOrder.id] ?? [] : [];
  const selectedOrderTimeline = selectedOrder
    ? buildOrderTimeline({
        order: selectedOrder,
        payment: selectedOrderPayment,
        tickets: selectedOrderTickets,
        notifications: selectedOrderNotifications,
      })
    : [];
  const selectedOrderTicketsBySeatId = Object.fromEntries(selectedOrderTickets.map((ticket) => [ticket.seatId, ticket]));

  const selectedTicketId = searchParams.get("ticket");
  const selectedWalletToken = searchParams.get("wallet");
  const selectedTicket = selectedTicketId
    ? tickets.find((ticket) => ticket.id === selectedTicketId && (!selectedWalletToken || ticket.walletToken === selectedWalletToken)) ?? null
    : null;
  const selectedTicketOrder = selectedTicket ? orders.find((order) => order.id === selectedTicket.orderId) ?? null : null;

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
        return;
      }

      nextParams.delete(key);
    });

    setSearchParams(nextParams, { replace: true });
  };

  const openOrderDetails = (orderId: string) => {
    updateQueryParams({
      order: orderId,
      ticket: null,
      wallet: null,
    });
  };

  const closeOrderDetails = () => {
    updateQueryParams({
      order: null,
    });
  };

  const openTicketDetails = (ticketId: string, walletToken?: string | null) => {
    updateQueryParams({
      order: null,
      ticket: ticketId,
      wallet: walletToken ?? null,
    });
  };

  const closeTicketDetails = () => {
    updateQueryParams({
      ticket: null,
      wallet: null,
    });
  };

  const accountActivity = auth.currentAccount.activity.slice(0, 8);

  const handleSubmit = async (values: ProfileValues) => {
    try {
      await auth.updateProfile(values);
      toast({
        title: "Cadastro atualizado",
        description: "Os dados da sua conta foram salvos e sincronizados com o backend quando disponivel.",
      });
    } catch (error) {
      toast({
        title: "Nao foi possivel salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSupportCase = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast({
        title: "Preencha o chamado",
        description: "Informe assunto e descricao do problema antes de abrir o caso.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSupportCase({
        accountId: auth.currentAccount.id,
        orderId: supportOrderId || null,
        category: supportCategory,
        subject: supportSubject,
        message: supportMessage,
      });
      setSupportSubject("");
      setSupportMessage("");
      setSupportOrderId("");
      toast({
        title: "Caso aberto",
        description: "O caso de suporte foi registrado para esta conta.",
      });
    } catch (error) {
      toast({
        title: "Nao foi possivel abrir o caso",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-4 space-y-4">
        <Card className="border-border bg-card">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  <UserRound className="w-4 h-4 text-primary" />
                  Minha conta
                </div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{auth.currentAccount.fullName}</h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Gestao de dados cadastrais, historico da conta e trilhas pos-compra com leitura remota quando o
                  backend estiver ativo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-md bg-background px-3 py-2 text-sm text-foreground">
                  Email: {auth.currentAccount.email}
                </div>
                <div className="rounded-md bg-background px-3 py-2 text-sm text-foreground">
                  Provedor: {auth.currentAccount.provider === "password" ? "Email e senha" : "Google"}
                </div>
                <div className="rounded-md bg-background px-3 py-2 text-sm text-foreground">
                  Criada em {formatDateTime(auth.currentAccount.createdAt)}
                </div>
              </div>
            </CardContent>

            <div className="border-t border-border bg-background lg:border-l lg:border-t-0">
              <div className="space-y-4 p-6">
                <Card className="border-border bg-card">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center gap-2 text-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <p className="font-semibold">Guardrails desta base</p>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Esta area da conta agora roda em modo remote-first para cadastro, login e atualizacao de perfil.
                      Auth federado, ownership final e hardening de producao continuam como proximo passo.
                    </p>
                    <Button type="button" variant="outline" className="w-full" onClick={() => void auth.logout()}>
                      <LogOut className="w-4 h-4" />
                      Encerrar sessao
                    </Button>
                    <Button asChild type="button" variant="outline" className="w-full">
                      <Link to="/produtor/meus-eventos">
                        <CalendarRange className="w-4 h-4" />
                        Abrir meus eventos
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Dados cadastrais</CardTitle>
                <CardDescription>Edite os dados basicos da sua conta sem sair da area autenticada.</CardDescription>
              </CardHeader>
              <CardContent>
              <Form {...profileForm}>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={profileForm.handleSubmit(handleSubmit)}>
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Documento</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <Button type="submit">Salvar cadastro</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Atividade da conta</CardTitle>
                <CardDescription>Ultimos eventos de cadastro, acesso e alteracao deste perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {accountActivity.length > 0 ? (
                  accountActivity.map((activity) => (
                    <div key={activity.id} className="rounded-md border border-border bg-background p-4">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{activity.message}</p>
                          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{activity.type}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                    Ainda nao existem eventos de atividade registrados para esta conta.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="space-y-3">
                <div>
                  <CardTitle className="font-display text-2xl">Pedidos e checkouts</CardTitle>
                  <CardDescription>Historico da conta com filtro por status e detalhe completo por pedido.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {orderStatusFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      type="button"
                      size="sm"
                      variant={orderFilter === filter.value ? "default" : "outline"}
                      onClick={() => setOrderFilter(filter.value)}
                    >
                      {filter.label} ({orderCounts[filter.value]})
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const relatedPayment = paymentsByOrderId[order.id] ?? null;

                    return (
                      <div key={order.id} className="rounded-md border border-border bg-background px-4 py-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{order.reference}</p>
                              <StatusBadge label={orderStatusMeta[order.status].label} tone={orderStatusMeta[order.status].tone} />
                              {relatedPayment ? (
                                <StatusBadge
                                  label={`Pagamento ${paymentStatusMeta[relatedPayment.status].label}`}
                                  tone={paymentStatusMeta[relatedPayment.status].tone}
                                />
                              ) : null}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-foreground">{humanizeEventSlug(order.eventSlug)}</p>
                              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                {paymentMethodLabels[order.paymentMethod]} · {order.installments} · {formatDateTime(order.createdAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {order.tickets.map((ticket) => (
                                <span key={ticket.seatId} className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs text-foreground">
                                  <Ticket className="h-3.5 w-3.5 text-primary" />
                                  {ticket.sectionName} · {ticket.label}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 lg:items-end">
                            <div className="text-left lg:text-right">
                              <p className="text-sm font-semibold text-foreground">{formatCurrency(order.pricing.total)}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {order.tickets.length} ingresso(s) · {formatCurrency(order.pricing.subtotal)} base
                              </p>
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={() => openOrderDetails(order.id)}>
                              Ver detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-md bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                    {orders.length === 0
                      ? "Ainda nao ha pedidos locais vinculados a esta conta. Feche um checkout para comecar a povoar este historico."
                      : "Nenhum pedido encontrado para o filtro atual. Ajuste os status acima para navegar pelo historico."}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Pagamentos</CardTitle>
                <CardDescription>Status financeiro local por pedido e metodo de cobranca.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <div key={payment.id} className="rounded-md border border-border bg-background px-4 py-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {paymentMethodLabels[payment.method]} · {payment.reference}
                            </p>
                            <StatusBadge label={paymentStatusMeta[payment.status].label} tone={paymentStatusMeta[payment.status].tone} />
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            {humanizeEventSlug(payment.eventSlug)}
                          </p>
                        </div>
                        <div className="text-left lg:text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(payment.createdAt)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs text-foreground">
                          <CreditCard className="h-3.5 w-3.5 text-primary" />
                          {payment.provider}
                        </span>
                        {payment.pixExpiresAt ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs text-foreground">
                            Expira em {formatDateTime(payment.pixExpiresAt)}
                          </span>
                        ) : null}
                        {payment.corporateProtocol ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs text-foreground">
                            Protocolo {payment.corporateProtocol}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                    Os registros de pagamento vao aparecer aqui conforme os pedidos forem criados nesta base.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Ingressos emitidos</CardTitle>
                <CardDescription>Tickets locais com atalho de wallet e detalhe por ingresso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-md border border-border bg-background px-4 py-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {ticket.sectionName} · {ticket.label}
                            </p>
                            <StatusBadge label={ticketStatusMeta[ticket.status].label} tone={ticketStatusMeta[ticket.status].tone} />
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            {ticket.orderReference} · {humanizeEventSlug(ticket.eventSlug)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 lg:items-end">
                          <div className="text-left lg:text-right">
                            <p className="text-xs text-muted-foreground">Wallet</p>
                            <p className="text-sm font-medium text-foreground">{ticket.walletToken.slice(-10)}</p>
                          </div>
                          <Button type="button" size="sm" variant="outline" onClick={() => openTicketDetails(ticket.id, ticket.walletToken)}>
                            <Wallet className="h-4 w-4" />
                            Abrir detalhes
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs text-foreground">
                          <QrCode className="h-3.5 w-3.5 text-primary" />
                          {ticket.barcode}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs text-foreground">
                          <Ticket className="h-3.5 w-3.5 text-primary" />
                          {ticket.holderName}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                    Seus ingressos emitidos vao aparecer aqui depois que um checkout local for aprovado.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Registros da conta</CardTitle>
                <CardDescription>Historico local de eventos importantes para esta sessao e perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {auth.currentAccount.activity.map((activity) => (
                  <div key={activity.id} className="rounded-md bg-background px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{activity.message}</p>
                      <span className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                      {activity.type}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Suporte e autosservico</CardTitle>
                <CardDescription>
                  FAQs operacionais, abertura de caso e rastreio basico dos chamados desta conta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {supportHelpArticles.map((article) => (
                    <div key={article.id} className="rounded-md border border-border bg-background p-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <LifeBuoy className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">{article.title}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{article.summary}</p>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {article.steps.map((step) => (
                          <p key={step}>- {step}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3 rounded-md border border-border bg-background p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Abrir solicitacao</p>
                    <p className="text-sm text-muted-foreground">
                      Registre um caso com categoria, pedido relacionado e contexto suficiente para investigacao.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Categoria</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={supportCategory}
                        onChange={(event) => setSupportCategory(event.target.value as SupportCaseCategory)}
                      >
                        {Object.entries(supportCategoryLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pedido relacionado</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={supportOrderId}
                        onChange={(event) => setSupportOrderId(event.target.value)}
                      >
                        <option value="">Sem pedido especifico</option>
                        {orders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.reference} · {humanizeEventSlug(order.eventSlug)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Assunto</label>
                    <Input value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Descricao</label>
                    <Textarea
                      className="min-h-24"
                      value={supportMessage}
                      onChange={(event) => setSupportMessage(event.target.value)}
                    />
                  </div>

                  <Button type="button" onClick={handleCreateSupportCase}>
                    <LifeBuoy className="h-4 w-4" />
                    Abrir caso
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Casos desta conta</p>
                    <p className="text-sm text-muted-foreground">Historico basico para acompanhar o que ja foi reportado.</p>
                  </div>

                  {supportCases.length > 0 ? (
                    supportCases.map((supportCase) => (
                      <div key={supportCase.id} className="rounded-md border border-border bg-background p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{supportCase.subject}</p>
                              <StatusBadge
                                label={supportStatusMeta[supportCase.status].label}
                                tone={supportStatusMeta[supportCase.status].tone}
                              />
                              <StatusBadge label={supportCategoryLabels[supportCase.category]} tone="neutral" />
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">{supportCase.message}</p>
                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                              {supportCase.orderReference ? `${supportCase.orderReference} · ` : ""}
                              {supportCase.eventSlug ? humanizeEventSlug(supportCase.eventSlug) : "Sem evento vinculado"}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDateTime(supportCase.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                      Nenhum caso de suporte foi aberto por esta conta ainda.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <GoogleOAuthPlaceholder compact />
          </div>
        </div>
      </main>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && closeOrderDetails()}>
        {selectedOrder ? (
          <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-display text-2xl">{selectedOrder.reference}</DialogTitle>
                <StatusBadge label={orderStatusMeta[selectedOrder.status].label} tone={orderStatusMeta[selectedOrder.status].tone} />
                {selectedOrderPayment ? (
                  <StatusBadge
                    label={`Pagamento ${paymentStatusMeta[selectedOrderPayment.status].label}`}
                    tone={paymentStatusMeta[selectedOrderPayment.status].tone}
                  />
                ) : null}
              </div>
              <DialogDescription className="text-sm leading-6">
                {humanizeEventSlug(selectedOrder.eventSlug)} · {selectedOrder.tickets.length} ingresso(s) com
                visao consolidada de itens, pagamento e entrega.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 md:grid-cols-4">
              <DetailMetric label="Total" value={formatCurrency(selectedOrder.pricing.total)} helper="Subtotal + taxas da base local." />
              <DetailMetric label="Pagamento" value={paymentMethodLabels[selectedOrder.paymentMethod]} helper={selectedOrder.installments} />
              <DetailMetric label="Criado em" value={formatDateTime(selectedOrder.createdAt)} />
              <DetailMetric label="Atualizado em" value={formatDateTime(selectedOrder.updatedAt)} />
            </div>

            <div className="space-y-3 rounded-md border border-border bg-card p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Comprador</p>
                <p className="text-sm text-muted-foreground">Dados principais usados para o fechamento deste pedido.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailField label="Nome" value={selectedOrder.buyer.fullName} />
                <DetailField label="Email" value={maskEmail(selectedOrder.buyer.email)} />
                <DetailField label="Documento" value={maskDocument(selectedOrder.buyer.document)} />
                <DetailField label="Telefone" value={selectedOrder.buyer.phone} />
                <DetailField label="Cidade" value={selectedOrder.buyer.city} />
                <DetailField label="Hold token" value={selectedOrder.holdToken ?? "Nao informado"} />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Itens, setores e titulares</p>
                <p className="text-sm text-muted-foreground">Cada assento do pedido com categoria, titular e status do ticket.</p>
              </div>
              <div className="space-y-3">
                {selectedOrder.tickets.map((orderTicket) => {
                  const issuedTicket = selectedOrderTicketsBySeatId[orderTicket.seatId];

                  return (
                    <div key={orderTicket.seatId} className="rounded-md border border-border bg-background p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {orderTicket.sectionName} · {orderTicket.label}
                            </p>
                            {issuedTicket ? (
                              <StatusBadge label={ticketStatusMeta[issuedTicket.status].label} tone={ticketStatusMeta[issuedTicket.status].tone} />
                            ) : (
                              <StatusBadge label="Nao emitido" tone="warning" />
                            )}
                          </div>
                          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            {orderTicket.ticketCategory} · {formatCurrency(orderTicket.price)}
                          </p>
                        </div>

                        {issuedTicket ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => openTicketDetails(issuedTicket.id, issuedTicket.walletToken)}>
                            <QrCode className="h-4 w-4" />
                            Abrir ticket
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-4 md:grid-cols-3">
                        <DetailField label="Titular" value={orderTicket.holderName} />
                        <DetailField label="Documento" value={maskDocument(orderTicket.document)} />
                        <DetailField label="Preco base" value={formatCurrency(orderTicket.basePrice)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Pagamento</p>
                <p className="text-sm text-muted-foreground">Estado financeiro e referencias operacionais do pedido.</p>
              </div>

              {selectedOrderPayment ? (
                <div className="space-y-3 rounded-md border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={paymentStatusMeta[selectedOrderPayment.status].label}
                      tone={paymentStatusMeta[selectedOrderPayment.status].tone}
                    />
                    <StatusBadge label={paymentMethodLabels[selectedOrderPayment.method]} tone="neutral" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <DetailField label="Referencia" value={selectedOrderPayment.reference} />
                    <DetailField label="Provider" value={selectedOrderPayment.provider} />
                    <DetailField label="Valor" value={formatCurrency(selectedOrderPayment.amount)} />
                    <DetailField label="Parcelamento" value={selectedOrderPayment.installments} />
                    <DetailField label="Criado em" value={formatDateTime(selectedOrderPayment.createdAt)} />
                    <DetailField
                      label="Autorizado em"
                      value={selectedOrderPayment.authorizedAt ? formatDateTime(selectedOrderPayment.authorizedAt) : "Ainda nao autorizado"}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                  Este pedido ainda nao possui um pagamento persistido na base local.
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Entrega e notificacoes</p>
                <p className="text-sm text-muted-foreground">Diagnostico rapido do que foi disparado para a conta a partir deste pedido.</p>
              </div>

              {selectedOrderNotifications.length > 0 ? (
                <div className="space-y-3">
                  {selectedOrderNotifications.map((notification) => (
                    <div key={notification.id} className="rounded-md border border-border bg-background p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {notificationTemplateLabels[notification.template]}
                            </p>
                            <StatusBadge
                              label={notificationStatusMeta[notification.status].label}
                              tone={notificationStatusMeta[notification.status].tone}
                            />
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">{notification.preview}</p>
                        </div>

                        <div className="space-y-1 text-left lg:text-right">
                          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 text-primary" />
                            {notification.recipient}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDateTime(notification.sentAt ?? notification.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                  Ainda nao existem notificacoes vinculadas a este pedido na outbox local.
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Logs principais</p>
                <p className="text-sm text-muted-foreground">Linha do tempo resumida das transicoes mais importantes deste pedido.</p>
              </div>

              <div className="space-y-3">
                {selectedOrderTimeline.map((timelineItem) => (
                  <div key={timelineItem.id} className="rounded-md border border-border bg-background p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{timelineItem.title}</p>
                          <StatusBadge label={timelineItem.title} tone={timelineItem.tone} />
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">{timelineItem.description}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(timelineItem.occurredAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && closeTicketDetails()}>
        {selectedTicket ? (
          <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-display text-2xl">
                  {selectedTicket.sectionName} · {selectedTicket.label}
                </DialogTitle>
                <StatusBadge label={ticketStatusMeta[selectedTicket.status].label} tone={ticketStatusMeta[selectedTicket.status].tone} />
              </div>
              <DialogDescription className="text-sm leading-6">
                Wallet local vinculada ao pedido {selectedTicket.orderReference} com QR, barcode e token persistidos.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 md:grid-cols-4">
              <DetailMetric label="Evento" value={humanizeEventSlug(selectedTicket.eventSlug)} />
              <DetailMetric label="Emissao" value={formatDateTime(selectedTicket.issuedAt)} />
              <DetailMetric label="Pedido" value={selectedTicket.orderReference} />
              <DetailMetric label="Wallet" value={selectedTicket.walletToken.slice(-10)} helper="Token curto exibido para conferencia." />
            </div>

            <div className="space-y-3 rounded-md border border-border bg-card p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Acesso do ingresso</p>
                <p className="text-sm text-muted-foreground">Payloads disponiveis na base local para QR, barcode e wallet.</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-md bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">QR payload</p>
                  <code className="mt-2 block break-all text-xs text-foreground">{selectedTicket.qrPayload}</code>
                </div>
                <div className="rounded-md bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Barcode</p>
                  <code className="mt-2 block break-all text-xs text-foreground">{selectedTicket.barcode}</code>
                </div>
                <div className="rounded-md bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Wallet URL</p>
                  <code className="mt-2 block break-all text-xs text-foreground">{selectedTicket.walletUrl}</code>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-md border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Titular</p>
                  <p className="text-sm text-muted-foreground">Dados associados ao ingresso emitido.</p>
                </div>
                <DetailField label="Nome" value={selectedTicket.holderName} />
                <DetailField label="Documento" value={maskDocument(selectedTicket.document)} />
                <DetailField label="Assento" value={`${selectedTicket.sectionName} · ${selectedTicket.label}`} />
              </div>

              <div className="space-y-3 rounded-md border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Pedido relacionado</p>
                  <p className="text-sm text-muted-foreground">Atalho para o fluxo completo do pedido no historico da conta.</p>
                </div>
                <DetailField label="Referencia" value={selectedTicket.orderReference} />
                <DetailField
                  label="Status do pedido"
                  value={selectedTicketOrder ? orderStatusMeta[selectedTicketOrder.status].label : "Nao encontrado"}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    closeTicketDetails();
                    openOrderDetails(selectedTicket.orderId);
                  }}
                >
                  <Ticket className="h-4 w-4" />
                  Abrir pedido
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <SiteFooter />
    </div>
  );
};

export default AccountDashboard;
