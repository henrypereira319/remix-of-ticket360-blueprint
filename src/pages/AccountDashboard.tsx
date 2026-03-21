import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BadgeCheck, CreditCard, LogOut, QrCode, ShieldCheck, Ticket, UserRound } from "lucide-react";
import GoogleOAuthPlaceholder from "@/components/GoogleOAuthPlaceholder";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAccountOrders } from "@/hooks/use-account-orders";
import { useAccountPayments } from "@/hooks/use-account-payments";
import { useAccountTickets } from "@/hooks/use-account-tickets";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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

const AccountDashboard = () => {
  const auth = useAuth();
  const { toast } = useToast();
  const { orders } = useAccountOrders(auth.currentAccount?.id);
  const { payments } = useAccountPayments(auth.currentAccount?.id);
  const { tickets } = useAccountTickets(auth.currentAccount?.id);

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

  const handleSubmit = (values: ProfileValues) => {
    try {
      auth.updateProfile(values);
      toast({
        title: "Cadastro atualizado",
        description: "Os dados da sua conta foram salvos neste ambiente local.",
      });
    } catch (error) {
      toast({
        title: "Nao foi possivel salvar",
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
                  Gestao de dados cadastrais, historico de registros da conta e area reservada para Google OAuth.
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
                      Esta gestao de contas funciona localmente para desenvolvimento. A autenticacao real, validacao de
                      credenciais e login federado precisam ser fechados no backend.
                    </p>
                    <Button type="button" variant="outline" className="w-full" onClick={() => auth.logout()}>
                      <LogOut className="w-4 h-4" />
                      Encerrar sessao
                    </Button>
                    <Button asChild type="button" className="w-full">
                      <Link to="/operacao">
                        <CreditCard className="w-4 h-4" />
                        Abrir operacao
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
              <CardDescription>Edite os dados basicos da sua conta sem sair da base atual.</CardDescription>
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
                <CardTitle className="font-display text-2xl">Pedidos e checkouts</CardTitle>
                <CardDescription>Historico local dos pedidos criados neste ambiente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div key={order.id} className="rounded-md bg-background px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{order.reference}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            {order.status} · {order.eventSlug}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.pricing.total)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.tickets.map((ticket) => (
                          <span key={ticket.seatId} className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs text-foreground">
                            <Ticket className="h-3.5 w-3.5 text-primary" />
                            {ticket.sectionName} · {ticket.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                    Ainda nao ha pedidos locais vinculados a esta conta. Feche um checkout para começar a povoar este histórico.
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
                    <div key={payment.id} className="rounded-md bg-background px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {payment.method} · {payment.reference}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            {payment.status} · {payment.eventSlug}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payment.amount)}
                          </p>
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
                <CardDescription>Tickets locais gerados depois da aprovacao automatica do checkout.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-md bg-background px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {ticket.sectionName} · {ticket.label}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            {ticket.orderReference} · {ticket.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Wallet</p>
                          <p className="text-sm font-medium text-foreground">{ticket.walletToken.slice(-10)}</p>
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

            <GoogleOAuthPlaceholder compact />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default AccountDashboard;
