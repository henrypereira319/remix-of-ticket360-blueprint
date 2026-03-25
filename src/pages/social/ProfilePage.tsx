import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, LogOut, Shield, Bell, CreditCard, HelpCircle } from "lucide-react";

const menuItems = [
  { icon: Bell, label: "Notificações" },
  { icon: CreditCard, label: "Pagamentos" },
  { icon: Shield, label: "Privacidade" },
  { icon: HelpCircle, label: "Ajuda e suporte" },
];

const ProfilePage = () => {
  const { currentAccount, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="space-y-6 safe-top lg:px-6 lg:pb-6">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3 px-4 pt-8 lg:rounded-[1.75rem] lg:border lg:border-white/5 lg:bg-surface/70 lg:px-6 lg:py-8">
          <Avatar className="h-20 w-20 ring-4 ring-social/30">
            <AvatarImage src={undefined} alt={currentAccount?.fullName} />
            <AvatarFallback className="bg-surface text-lg font-bold text-foreground">
              {(currentAccount?.fullName ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">{currentAccount?.fullName ?? "Usuário"}</h2>
            <p className="text-xs text-muted-foreground">{currentAccount?.email ?? ""}</p>
          </div>
          <button
            onClick={() => navigate("/conta")}
            className="rounded-full bg-surface px-5 py-2 text-xs font-semibold text-foreground active:bg-surface-elevated"
          >
            Editar perfil
          </button>

          <div className="grid w-full grid-cols-2 gap-3 pt-2">
            <div className="rounded-2xl bg-background/55 p-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Rede</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">12</p>
            </div>
            <div className="rounded-2xl bg-background/55 p-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Eventos</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">4</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 lg:px-0 lg:pt-6">
          <div className="rounded-[1.75rem] border border-white/5 bg-surface/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preferências e conta</p>
            <div className="mt-3 space-y-1">
              {menuItems.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-background/40 active:bg-surface"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-0 pb-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-semibold text-destructive active:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
