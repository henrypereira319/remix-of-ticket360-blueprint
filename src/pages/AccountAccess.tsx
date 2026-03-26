import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, CircleHelp, Compass, LockKeyhole, ShieldCheck, Sparkles, Store, Ticket, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import GoogleOAuthPlaceholder from "@/components/GoogleOAuthPlaceholder";
import { Button } from "@/components/ui/button";
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

const trustCards = [
  {
    icon: Ticket,
    title: "Meus ingressos",
    description: "Acesse tickets, QR code e pedidos em um unico painel.",
  },
  {
    icon: Sparkles,
    title: "Checkout rapido",
    description: "Reutilize seu cadastro e volte mais rapido para a compra.",
  },
  {
    icon: Store,
    title: "Conta multiuso",
    description: "A mesma conta abre fluxos de cliente, produtor e operacao.",
  },
] as const;

const eventHubBenefits = [
  "Historico de compras, pagamentos e suporte em um so lugar.",
  "Entrada com Google no topo do fluxo para reduzir atrito.",
  "Cadastro pronto para a proxima compra sem repetir informacoes.",
] as const;

const journeySteps = [
  "Entre ou cadastre com Google ou email.",
  "Retome checkout, pedidos e carteiras sem perder contexto.",
  "Use a mesma conta para explorar eventos e abrir modulos privados.",
] as const;

const AuthDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
    <span className="h-px flex-1 bg-slate-200" />
    <span>{label}</span>
    <span className="h-px flex-1 bg-slate-200" />
  </div>
);

const lightInputClass =
  "h-12 rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#2563eb] focus-visible:ring-offset-0";

const primaryButtonClass =
  "h-12 w-full rounded-2xl bg-[#2563eb] text-white shadow-[0_16px_40px_-20px_rgba(37,99,235,0.75)] hover:bg-[#1d4ed8]";

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

  const activeTabTitle = activeTab === "login" ? "Entre na sua conta" : "Crie sua conta";
  const activeTabDescription =
    activeTab === "login"
      ? "Continue sua jornada no EventHub com tickets, pedidos e atalhos privados prontos para uso."
      : "Abra sua conta para salvar cadastro, acelerar compras e centralizar seu historico.";

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="container flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="rounded-2xl bg-[#2563eb] px-3 py-2 font-display text-xl font-bold text-white shadow-[0_18px_40px_-22px_rgba(37,99,235,0.9)]">
              EventHub
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">Conta unica para tickets, checkout e produtor</p>
              <p className="text-xs text-slate-500">Fluxo de acesso mais limpo, direto e confiavel.</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 md:inline-flex">
              Explorar eventos
            </Link>
            <Link to="/pulse" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 md:inline-flex">
              Pulse
            </Link>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              <Link to="/">Voltar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              <LockKeyhole className="h-4 w-4" />
              Conta EventHub
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">
                Acesso simples, com cara de plataforma grande.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                O EventHub agora abre sua conta com uma interface mais limpa e comercial, priorizando login rapido,
                Google no topo do fluxo e formularios que nao parecem um painel interno.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {trustCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.45)]"
                  >
                    <div className="inline-flex rounded-2xl bg-sky-50 p-2.5 text-sky-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-900">{card.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_52%,#2563eb_100%)] p-6 text-white shadow-[0_35px_90px_-50px_rgba(15,23,42,0.85)] lg:p-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                  <Compass className="h-3.5 w-3.5" />
                  Jornada da conta
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  Um fluxo de acesso pensado para voltar voce ao evento, nao para te travar.
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/75">
                  A referencia veio do mercado de eventos: hierarquia curta, decisao clara e menos blocos disputando a sua atencao.
                </p>

                <div className="mt-8 space-y-3">
                  {journeySteps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/10 px-4 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-white/85">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.5)] lg:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
                  O que a conta destrava
                </div>

                <div className="mt-5 space-y-3">
                  {eventHubBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mt-0.5 rounded-full bg-sky-100 p-1.5 text-sky-700">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm leading-6 text-slate-700">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                  <div className="rounded-full bg-amber-50 p-2 text-amber-600">
                    <CircleHelp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Sem inventar complexidade</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Login social no topo, formulario limpo embaixo e feedback claro quando algo falhar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_35px_90px_-50px_rgba(15,23,42,0.45)] lg:p-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                <LockKeyhole className="h-3.5 w-3.5" />
                Acesso a conta
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{activeTabTitle}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{activeTabDescription}</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AccessTab)} className="mt-6 space-y-6">
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-[20px] bg-slate-100 p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-[16px] py-3 text-sm font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-[16px] py-3 text-sm font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0 space-y-5">
                <GoogleOAuthPlaceholder intent="login" surface="light" />
                <AuthDivider label="ou continue com email e senha" />

                <Form {...loginForm}>
                  <form className="space-y-4" onSubmit={loginForm.handleSubmit(handleLogin)}>
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">Email</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="email"
                              className={lightInputClass}
                              inputMode="email"
                              placeholder="voce@exemplo.com"
                              type="email"
                              {...field}
                            />
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
                          <FormLabel className="text-sm font-semibold text-slate-700">Senha</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="current-password"
                              className={lightInputClass}
                              placeholder="Sua senha"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className={primaryButtonClass} disabled={loginForm.formState.isSubmitting}>
                      {loginForm.formState.isSubmitting ? "Entrando..." : "Entrar na minha conta"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>

                <p className="text-xs leading-6 text-slate-500">
                  Ao continuar, sua sessao fica pronta para pedidos, ingressos, suporte e outros modulos autenticados do EventHub.
                </p>
              </TabsContent>

              <TabsContent value="register" className="mt-0 space-y-5">
                <GoogleOAuthPlaceholder intent="register" surface="light" />
                <AuthDivider label="ou preencha seu cadastro" />

                <Form {...registerForm}>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={registerForm.handleSubmit(handleRegister)}>
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-sm font-semibold text-slate-700">Nome completo</FormLabel>
                          <FormControl>
                            <Input autoComplete="name" className={lightInputClass} placeholder="Nome e sobrenome" {...field} />
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
                          <FormLabel className="text-sm font-semibold text-slate-700">Email</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="email"
                              className={lightInputClass}
                              inputMode="email"
                              placeholder="voce@exemplo.com"
                              type="email"
                              {...field}
                            />
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
                          <FormLabel className="text-sm font-semibold text-slate-700">Documento</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="off"
                              className={lightInputClass}
                              inputMode="numeric"
                              placeholder="CPF ou documento"
                              {...field}
                            />
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
                          <FormLabel className="text-sm font-semibold text-slate-700">Telefone</FormLabel>
                          <FormControl>
                            <Input autoComplete="tel" className={lightInputClass} inputMode="tel" placeholder="(11) 99999-9999" {...field} />
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
                          <FormLabel className="text-sm font-semibold text-slate-700">Cidade</FormLabel>
                          <FormControl>
                            <Input autoComplete="address-level2" className={lightInputClass} placeholder="Cidade / UF" {...field} />
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
                          <FormLabel className="text-sm font-semibold text-slate-700">Senha</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="new-password"
                              className={lightInputClass}
                              placeholder="Crie uma senha"
                              type="password"
                              {...field}
                            />
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
                          <FormLabel className="text-sm font-semibold text-slate-700">Confirmar senha</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="new-password"
                              className={lightInputClass}
                              placeholder="Repita sua senha"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2 space-y-3">
                      <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                        Seu cadastro vai alimentar checkout, historico de pedidos, suporte e sincronizacao da conta quando o backend remoto estiver ativo.
                      </div>

                      <Button type="submit" className={primaryButtonClass} disabled={registerForm.formState.isSubmitting}>
                        {registerForm.formState.isSubmitting ? "Criando conta..." : "Criar minha conta"}
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>

                <p className="text-xs leading-6 text-slate-500">
                  Ao criar sua conta, voce acelera as proximas compras e centraliza tudo em um unico login.
                </p>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container flex flex-col gap-3 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>EventHub Account Center</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="transition-colors hover:text-slate-800">
              Eventos
            </Link>
            <Link to="/pulse" className="transition-colors hover:text-slate-800">
              Pulse
            </Link>
            <span className="text-slate-300">|</span>
            <span>Login, cadastro e Google OAuth integrados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AccountAccess;
