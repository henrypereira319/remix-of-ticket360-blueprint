import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, LockKeyhole, MapPinned, ShieldCheck, Sparkles, Ticket, UserPlus } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import GoogleOAuthPlaceholder from "@/components/GoogleOAuthPlaceholder";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Informe um email valido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Informe seu nome completo."),
    email: z.string().email("Informe um email valido."),
    document: z.string().min(11, "Informe um documento valido."),
    phone: z.string().min(10, "Informe um telefone valido."),
    city: z.string().min(2, "Informe sua cidade."),
    password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type AccessTab = "login" | "register";

const accessHighlights = [
  {
    icon: Ticket,
    title: "Ingressos no mesmo lugar",
    description: "Acompanhe pedidos, QR codes e updates de pagamento sem sair do EventHub.",
  },
  {
    icon: ShieldCheck,
    title: "Conta protegida",
    description: "Email e senha continuam disponiveis, com entrada federada via Google quando o ambiente estiver pronto.",
  },
  {
    icon: Sparkles,
    title: "Jornada mais curta",
    description: "Cadastro rapido para voltar logo para checkout, mapa de assentos e historico da conta.",
  },
] as const;

const accountCapabilities = [
  "Historico de compras, pagamentos e tickets emitidos.",
  "Cadastro centralizado para checkout e suporte.",
  "Acesso a conta principal e rotas de produtor no mesmo login.",
] as const;

const accountMoments = [
  {
    title: "1. Entre ou cadastre",
    description: "Use email e senha ou acelere com Google para abrir a conta na hora.",
  },
  {
    title: "2. Continue sua jornada",
    description: "Volte para seus pedidos, checkout, Pulse ou area de produtor sem perder contexto.",
  },
  {
    title: "3. Centralize tudo",
    description: "A conta passa a guardar perfil, tickets, pagamentos e registros da sua atividade.",
  },
] as const;

const AuthDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
    <span className="h-px flex-1 bg-border" />
    <span>{label}</span>
    <span className="h-px flex-1 bg-border" />
  </div>
);

const AccountAccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<AccessTab>("login");

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      document: "",
      phone: "",
      city: "",
      password: "",
      confirmPassword: "",
    },
  });

  if (auth.isAuthenticated) {
    return <Navigate to="/conta" replace />;
  }

  const handleLogin = async (values: LoginValues) => {
    try {
      await auth.login(values);
      toast({
        title: "Acesso liberado",
        description: "Sua conta foi autenticada com sucesso e sincronizada com o backend quando disponivel.",
      });
      navigate("/conta");
    } catch (error) {
      toast({
        title: "Nao foi possivel entrar",
        description: error instanceof Error ? error.message : "Verifique suas credenciais.",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (values: RegisterValues) => {
    try {
      await auth.register({
        fullName: values.fullName,
        email: values.email,
        document: values.document,
        phone: values.phone,
        city: values.city,
        password: values.password,
      });
      toast({
        title: "Conta criada",
        description: "Seu cadastro foi salvo e a sessao ja esta ativa, com persistencia remota quando o backend estiver configurado.",
      });
      navigate("/conta");
    } catch (error) {
      toast({
        title: "Nao foi possivel concluir o cadastro",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const activeTabTitle = activeTab === "login" ? "Entrar no EventHub" : "Criar conta no EventHub";
  const activeTabDescription =
    activeTab === "login"
      ? "Recupere sua jornada de compra, tickets e area autenticada em poucos segundos."
      : "Abra sua conta para salvar perfil, pedidos, suporte e proximos checkouts.";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-6 space-y-4 lg:py-8">
        <Card className="overflow-hidden border-border/80 bg-card">
          <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
            <CardContent className="space-y-6 p-6 lg:p-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  Conta EventHub
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                    {activeTabTitle}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground lg:text-base">
                    {activeTabDescription}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {accessHighlights.map((highlight) => {
                    const Icon = highlight.icon;

                    return (
                      <div key={highlight.title} className="rounded-[26px] border border-border/70 bg-background/70 p-4">
                        <div className="inline-flex rounded-2xl border border-border/70 bg-card/80 p-2.5">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-foreground">{highlight.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{highlight.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AccessTab)} className="space-y-5">
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-[24px] border border-border/80 bg-background/70 p-1">
                  <TabsTrigger value="login" className="rounded-[18px] py-3 text-sm font-semibold">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-[18px] py-3 text-sm font-semibold">
                    Cadastrar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0">
                  <Card className="border-border/80 bg-background/60">
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
                      <CardDescription className="text-sm leading-6">
                        Entre para abrir seus tickets, pedidos e atalhos privados do EventHub sem perder o contexto da navegacao.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5">
                      <GoogleOAuthPlaceholder intent="login" />
                      <AuthDivider label="ou continue com email e senha" />

                      <Form {...loginForm}>
                        <form className="space-y-4" onSubmit={loginForm.handleSubmit(handleLogin)}>
                          <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input autoComplete="email" inputMode="email" placeholder="voce@exemplo.com" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input autoComplete="current-password" placeholder="Sua senha" type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                            {loginForm.formState.isSubmitting ? "Entrando..." : "Entrar na minha conta"}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <Card className="border-border/80 bg-background/60">
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-2xl">Crie sua conta</CardTitle>
                      <CardDescription className="text-sm leading-6">
                        Cadastre seus dados agora para acelerar os proximos checkouts e concentrar tickets, suporte e historico.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5">
                      <GoogleOAuthPlaceholder intent="register" />
                      <AuthDivider label="ou preencha seu cadastro completo" />

                      <Form {...registerForm}>
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={registerForm.handleSubmit(handleRegister)}>
                          <FormField
                            control={registerForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Nome completo</FormLabel>
                                <FormControl>
                                  <Input autoComplete="name" placeholder="Nome e sobrenome" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input autoComplete="email" inputMode="email" placeholder="voce@exemplo.com" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="document"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Documento</FormLabel>
                                <FormControl>
                                  <Input autoComplete="off" inputMode="numeric" placeholder="CPF ou documento" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input autoComplete="tel" inputMode="tel" placeholder="(11) 99999-9999" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                  <Input autoComplete="address-level2" placeholder="Cidade / UF" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input autoComplete="new-password" placeholder="Crie uma senha" type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar senha</FormLabel>
                                <FormControl>
                                  <Input autoComplete="new-password" placeholder="Repita sua senha" type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="md:col-span-2 space-y-3">
                            <div className="rounded-[24px] border border-border/70 bg-card/70 p-4 text-sm leading-6 text-muted-foreground">
                              Seu cadastro sera usado para checkout, historico de ingressos, atendimento e sincronizacao da conta quando o backend remoto estiver ativo.
                            </div>

                            <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                              {registerForm.formState.isSubmitting ? "Criando conta..." : "Criar minha conta"}
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>

            <div className="relative border-t border-border/80 bg-background/80 xl:border-l xl:border-t-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.22),_transparent_42%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.14),_transparent_36%)]" />

              <div className="relative space-y-4 p-6 lg:p-8">
                <Card className="overflow-hidden border-border/80 bg-card/80">
                  <CardContent className="space-y-5 p-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      O que esta destravado
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Uma unica conta para toda a experiencia</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        O EventHub usa esta area de acesso como porta de entrada para compra, pos-compra, suporte, Pulse e modulos autenticados da plataforma.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {accountCapabilities.map((capability) => (
                        <div key={capability} className="flex items-start gap-3 rounded-[22px] border border-border/70 bg-background/70 p-4">
                          <div className="mt-0.5 rounded-full border border-border/70 bg-card/70 p-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-300" />
                          </div>
                          <p className="text-sm leading-6 text-foreground/90">{capability}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/80">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-2 text-foreground">
                      <MapPinned className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/80">Fluxo recomendado</p>
                    </div>

                    <div className="space-y-4">
                      {accountMoments.map((moment) => (
                        <div key={moment.title} className="rounded-[24px] border border-border/70 bg-background/70 p-4">
                          <p className="text-sm font-semibold text-foreground">{moment.title}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{moment.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
};

export default AccountAccess;
