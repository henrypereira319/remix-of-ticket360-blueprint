import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
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

const AccountAccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAuth();

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-4 space-y-4">
        <Card className="border-border bg-card">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Gestao de contas
                </div>
                <h1 className="font-display text-3xl font-semibold text-foreground">Entrar ou criar conta</h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  O cadastro agora pode operar em modo remote-first para testes entre devices, mantendo um fallback
                  local enquanto a autenticacao definitiva evolui.
                </p>
              </div>

              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Card className="border-border bg-background">
                    <CardHeader>
                      <CardTitle className="font-display text-xl">Acesse sua conta</CardTitle>
                      <CardDescription>Use email e senha para entrar na area da conta com sincronizacao remota quando disponivel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...loginForm}>
                        <form className="space-y-4" onSubmit={loginForm.handleSubmit(handleLogin)}>
                          <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="voce@exemplo.com" {...field} />
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
                                  <Input type="password" placeholder="Sua senha" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                            Entrar
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="register">
                  <Card className="border-border bg-background">
                    <CardHeader>
                      <CardTitle className="font-display text-xl">Criar nova conta</CardTitle>
                      <CardDescription>Cadastro inicial para acompanhar compras, perfil e registros da conta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...registerForm}>
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={registerForm.handleSubmit(handleRegister)}>
                          <FormField
                            control={registerForm.control}
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
                            control={registerForm.control}
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
                            control={registerForm.control}
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
                            control={registerForm.control}
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
                            control={registerForm.control}
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

                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Crie uma senha" {...field} />
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
                                  <Input type="password" placeholder="Repita sua senha" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="md:col-span-2">
                            <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                              Criar conta
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>

            <div className="border-t border-border bg-background lg:border-l lg:border-t-0">
              <div className="space-y-4 p-6">
                <Card className="border-border bg-card">
                  <CardContent className="space-y-3 p-6">
                    <h2 className="font-display text-2xl font-semibold text-foreground">O que entra nesta etapa</h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Cadastro por email e senha, login, sincronizacao remote-first para testes definitivos e area
                      reservada para login federado.
                    </p>
                    <div className="space-y-2">
                      <div className="rounded-md bg-background px-3 py-2 text-sm text-foreground">Dados cadastrais do usuario com persistencia remota</div>
                      <div className="rounded-md bg-background px-3 py-2 text-sm text-foreground">Registro de acessos e alteracoes da conta</div>
                      <div className="rounded-md bg-background px-3 py-2 text-sm text-foreground">Espaco pronto para Google OAuth</div>
                    </div>
                  </CardContent>
                </Card>

                <GoogleOAuthPlaceholder />
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
