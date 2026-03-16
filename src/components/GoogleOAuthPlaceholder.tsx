import { Chrome, ShieldCheck } from "lucide-react";
import { googleOAuthConfig, googleOAuthEnvSlots, googleOAuthIsReady } from "@/config/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface GoogleOAuthPlaceholderProps {
  compact?: boolean;
}

const GoogleOAuthPlaceholder = ({ compact = false }: GoogleOAuthPlaceholderProps) => {
  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Espaco reservado para Google OAuth</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Estrutura pronta para receber `client id`, `redirect uri` e o callback do provedor.
            </p>
          </div>
          <Button type="button" variant="outline" className="shrink-0" disabled={!googleOAuthIsReady}>
            <Chrome className="w-4 h-4" />
            Google
          </Button>
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
            <p className="text-sm text-muted-foreground">Slot preparado para login federado</p>
          </div>
        </div>

        <Button type="button" className="w-full" disabled={!googleOAuthIsReady}>
          <Chrome className="w-4 h-4" />
          {googleOAuthIsReady ? "Conectar com Google" : "Google OAuth em preparacao"}
        </Button>

        <div className="rounded-md bg-background p-4 text-sm leading-6 text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            A camada ja esta delimitada
          </div>
          <p>
            Quando formos integrar, basta preencher as variaveis abaixo e conectar o callback ao backend ou BFF de
            autenticacao.
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
          Status atual: {googleOAuthConfig.enabled ? "habilitado" : "desabilitado"} | Redirect URI:{" "}
          {googleOAuthConfig.redirectUri || "nao configurado"}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleOAuthPlaceholder;
