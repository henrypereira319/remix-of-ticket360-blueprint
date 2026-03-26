import { useEffect, useMemo, useRef, useState } from "react";
import { Chrome, LoaderCircle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { googleOAuthConfig, googleOAuthEnvSlots, googleOAuthIsReady } from "@/config/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface GoogleOAuthPlaceholderProps {
  compact?: boolean;
}

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";

let googleIdentityScriptPromise: Promise<void> | null = null;

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
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Falha ao carregar Google Identity Services."));
      document.head.appendChild(script);
    });
  }

  return googleIdentityScriptPromise;
};

const GoogleOAuthPlaceholder = ({ compact = false }: GoogleOAuthPlaceholderProps) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buttonWidth = useMemo(() => (compact ? 180 : 360), [compact]);

  useEffect(() => {
    if (!googleOAuthIsReady) {
      setIsSdkReady(false);
      return;
    }

    let cancelled = false;

    const setupGoogleButton = async () => {
      try {
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
          text: "continue_with",
          shape: "pill",
          width: buttonWidth,
          logo_alignment: "left",
        });

        setIsSdkReady(true);
      } catch (error) {
        console.warn("Falha ao preparar o botao do Google.", error);
        setIsSdkReady(false);
      }
    };

    void setupGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [auth, buttonWidth, compact, navigate, toast]);

  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Entrar com Google</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Federado real com o client configurado neste ambiente.
            </p>
          </div>
          <Button type="button" variant="outline" className="shrink-0" disabled>
            {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
            Google
          </Button>
        </div>
        <div className="mt-4 flex justify-start">
          <div ref={buttonRef} />
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Chrome className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Google OAuth</h3>
            <p className="text-sm text-muted-foreground">Login federado ativo neste ambiente</p>
          </div>
        </div>

        <div className="space-y-3">
          <div ref={buttonRef} className="min-h-11" />

          <Button type="button" className="w-full" disabled={!googleOAuthIsReady || !isSdkReady || isSubmitting}>
            {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
            {isSubmitting
              ? "Conectando..."
              : googleOAuthIsReady
                ? "Botao Google carregado abaixo"
                : "Google OAuth em preparacao"}
          </Button>
        </div>

        <div className="rounded-md bg-background p-4 text-sm leading-6 text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Fluxo seguro
          </div>
          <p>
            O client ID fica no frontend, e o token Google segue para validacao no backend quando ele estiver configurado.
          </p>
        </div>

        <div className="space-y-2">
          {googleOAuthEnvSlots.map((slot) => (
            <div key={slot} className="rounded-md bg-background px-3 py-2 font-mono text-xs text-foreground">
              {slot}
            </div>
          ))}
        </div>

        <div className="rounded-md bg-background px-3 py-2 text-xs text-muted-foreground">
          Status atual: {googleOAuthConfig.enabled ? "habilitado" : "desabilitado"} | SDK:{" "}
          {isSdkReady ? "pronto" : googleOAuthIsReady ? "carregando" : "aguardando env"}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleOAuthPlaceholder;
