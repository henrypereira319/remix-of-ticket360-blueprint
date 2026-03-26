import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Chrome, LoaderCircle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { googleOAuthConfig, googleOAuthEnvSlots, googleOAuthIsReady } from "@/config/auth";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface GoogleOAuthPlaceholderProps {
  compact?: boolean;
  intent?: "login" | "register" | "continue";
  surface?: "default" | "light";
}

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";

let googleIdentityScriptPromise: Promise<void> | null = null;

const googleCopyByIntent = {
  login: {
    title: "Entrar com Google",
    description: "Acesse sua conta EventHub com o Google e volte direto para seus pedidos e ingressos.",
    badge: "Login federado",
    buttonText: "signin_with",
  },
  register: {
    title: "Criar conta com Google",
    description: "Crie sua conta em menos etapas usando um email Google verificado.",
    badge: "Cadastro rapido",
    buttonText: "signup_with",
  },
  continue: {
    title: "Continuar com Google",
    description: "Autentique com sua conta Google sem preencher o formulario inteiro de novo.",
    badge: "Acesso rapido",
    buttonText: "continue_with",
  },
} as const;

const loadGoogleIdentityScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google OAuth so pode carregar no navegador."));
  }

  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  if (!googleIdentityScriptPromise) {
    googleIdentityScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;

      if (existingScript) {
        if (window.google?.accounts.id || existingScript.dataset.loaded === "true") {
          resolve();
          return;
        }

        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Falha ao carregar Google Identity Services.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.id = GOOGLE_IDENTITY_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = () => reject(new Error("Falha ao carregar Google Identity Services."));
      document.head.appendChild(script);
    });
  }

  return googleIdentityScriptPromise;
};

const GoogleOAuthPlaceholder = ({ compact = false, intent = "continue", surface = "default" }: GoogleOAuthPlaceholderProps) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState(compact ? 220 : 360);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const copy = googleCopyByIntent[intent];
  const isLightSurface = surface === "light";

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) {
      return;
    }

    const node = containerRef.current;
    const updateWidth = () => {
      const measuredWidth = Math.floor(node.getBoundingClientRect().width);
      const minWidth = compact ? 180 : 260;
      const maxWidth = compact ? 260 : 420;
      const nextWidth = Math.min(Math.max(measuredWidth, minWidth), maxWidth);
      setButtonWidth(nextWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(node);

    return () => observer.disconnect();
  }, [compact]);

  useEffect(() => {
    if (!googleOAuthConfig.enabled) {
      setIsSdkReady(false);
      setSetupError(
        googleOAuthConfig.clientId
          ? "Ative VITE_GOOGLE_OAUTH_ENABLED=true para expor o login Google neste ambiente."
          : "Defina VITE_GOOGLE_OAUTH_CLIENT_ID para habilitar o login Google.",
      );
      return;
    }

    if (!googleOAuthIsReady) {
      setIsSdkReady(false);
      setSetupError("Defina o client ID do Google para habilitar o login federado.");
      return;
    }

    let cancelled = false;

    const setupGoogleButton = async () => {
      try {
        setSetupError(null);
        await loadGoogleIdentityScript();

        if (cancelled || !window.google?.accounts.id || !buttonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleOAuthConfig.clientId,
          callback: async (response) => {
            if (!response.credential) {
              toast({
                title: "Google nao retornou credencial",
                description: "Tente novamente em alguns segundos.",
                variant: "destructive",
              });
              return;
            }

            try {
              setIsSubmitting(true);
              await auth.loginWithGoogle(response.credential);
              toast({
                title: "Conta conectada",
                description: "Login com Google concluido com sucesso.",
              });
              navigate("/conta");
            } catch (error) {
              toast({
                title: "Nao foi possivel entrar com Google",
                description: error instanceof Error ? error.message : "Tente novamente.",
                variant: "destructive",
              });
            } finally {
              setIsSubmitting(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: compact ? "medium" : "large",
          text: copy.buttonText,
          shape: "pill",
          width: buttonWidth,
          logo_alignment: "left",
        });

        if (!compact) {
          window.google.accounts.id.prompt();
        }

        setIsSdkReady(true);
      } catch (error) {
        console.warn("Falha ao preparar o botao do Google.", error);
        setSetupError(error instanceof Error ? error.message : "Falha ao carregar login Google.");
        setIsSdkReady(false);
      }
    };

    void setupGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [auth, buttonWidth, compact, copy.buttonText, navigate, toast]);

  const statusLabel = isSubmitting
    ? "Conectando"
    : googleOAuthIsReady && isSdkReady
      ? "Pronto"
      : setupError
        ? "Configurar"
        : "Carregando";

  const statusToneClass =
    isLightSurface
      ? isSubmitting || (googleOAuthIsReady && isSdkReady)
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700"
      : isSubmitting || (googleOAuthIsReady && isSdkReady)
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
        : "border-amber-500/30 bg-amber-500/10 text-amber-100";

  const helpCopy = setupError
    ? setupError
    : "O Google valida o email, e a credencial segue para validacao do backend quando ele estiver ativo.";

  if (compact) {
    return (
      <div className="rounded-[28px] border border-border/80 bg-background/80 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{copy.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{copy.description}</p>
          </div>
          <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusToneClass}`}>
            {isSubmitting ? <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            {statusLabel}
          </div>
        </div>

        <div ref={containerRef} className="mt-4 rounded-3xl border border-border/70 bg-card/70 p-4">
          <div ref={buttonRef} className="flex min-h-11 items-center justify-center" />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{helpCopy}</p>
        </div>
      </div>
    );
  }

  if (isLightSurface) {
    return (
      <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
              <Chrome className="h-3.5 w-3.5" />
              {copy.badge}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{copy.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{copy.description}</p>
            </div>
          </div>

          <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusToneClass}`}>
            {isSubmitting ? <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            {statusLabel}
          </div>
        </div>

        <div ref={containerRef} className="rounded-[20px] border border-slate-200 bg-white p-3">
          <div ref={buttonRef} className="flex min-h-12 items-center justify-center" />
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
          <div className="flex items-start gap-2">
            {setupError ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            ) : (
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            )}
            <p>{helpCopy}</p>
          </div>
        </div>

        {setupError ? (
          <div className="flex flex-wrap gap-2">
            {googleOAuthEnvSlots.map((slot) => (
              <span key={slot} className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] text-slate-700">
                {slot}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-border/80 bg-background/60">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
              <Chrome className="h-3.5 w-3.5 text-primary" />
              {copy.badge}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{copy.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.description}</p>
            </div>
          </div>

          <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusToneClass}`}>
            {isSubmitting ? <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            {statusLabel}
          </div>
        </div>

        <div ref={containerRef} className="rounded-[28px] border border-border/80 bg-card/70 p-4">
          <div ref={buttonRef} className="flex min-h-12 items-center justify-center" />
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground">
            {setupError ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            ) : (
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            )}
            <p className="leading-6">{helpCopy}</p>
          </div>
        </div>

        {googleOAuthIsReady && !setupError ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Menos atrito na entrada
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                O usuario entra com a conta Google e cai direto na area autenticada do EventHub.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Validacao de credencial
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Quando o backend estiver ativo, a credencial tambem e validada no servidor antes de hidratar a conta.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">Ambiente ainda nao configurado para Google OAuth</p>
            <p className="mt-2">
              Para ativar, preencha estas variaveis de ambiente e reinicie o frontend:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {googleOAuthEnvSlots.map((slot) => (
                <span key={slot} className="rounded-full border border-border/70 bg-card px-3 py-1 font-mono text-[11px] text-foreground">
                  {slot}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleOAuthPlaceholder;
