import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassButton } from "@/components/ui/glass-button";
import SocialPageHero from "@/components/social/SocialPageHero";
import { Bell, ChevronRight, CreditCard, HelpCircle, LogOut, Shield } from "lucide-react";

const menuItems = [
  { icon: Bell, label: "Notificacoes" },
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
      <div className="px-4 pt-4 lg:px-0 lg:pt-6">
        <SocialPageHero
          eyebrow="Conta e preferencias"
          title={currentAccount?.fullName ?? "Seu espaco pessoal"}
          subtitle="Seu perfil agora herda a mesma linguagem premium da home para organizar identidade, configuracoes e acessos, sem mexer no fluxo das acoes que ja existem."
          action={
            <GlassButton
              onClick={() => navigate("/conta")}
              size="sm"
              className="text-primary"
              contentClassName="px-5 py-3 text-xs font-bold uppercase tracking-[0.18em]"
            >
              Editar perfil
            </GlassButton>
          }
          footer={
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,0.7fr))]">
              <div className="glass-panel flex items-center gap-4 rounded-[1.6rem] border border-white/10 p-4">
                <Avatar className="h-20 w-20 ring-4 ring-primary/25">
                  <AvatarImage src={undefined} alt={currentAccount?.fullName} />
                  <AvatarFallback className="bg-black/40 text-lg font-bold text-white">
                    {(currentAccount?.fullName ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Perfil ativo</p>
                  <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-white">
                    {currentAccount?.fullName ?? "Usuario"}
                  </h2>
                  <p className="mt-1 truncate text-sm text-white/45">{currentAccount?.email ?? ""}</p>
                </div>
              </div>

              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Rede</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">12</p>
                <p className="mt-1 text-xs text-white/45">Conexoes e interacoes ativas.</p>
              </div>

              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">Eventos</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">4</p>
                <p className="mt-1 text-xs text-white/45">Experiencias salvas no seu historico.</p>
              </div>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 px-4 lg:px-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="nocturne-panel p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Preferencias e conta</p>
            <div className="mt-4 space-y-2">
              {menuItems.map(({ icon: Icon, label }) => (
                <GlassButton
                  key={label}
                  className="w-full"
                  contentClassName="flex w-full items-center gap-4 px-4 py-4 text-left"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/35">
                    <Icon className="h-5 w-5 text-white/55" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-white">{label}</span>
                  <ChevronRight className="h-4 w-4 text-white/30" />
                </GlassButton>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 pb-6">
          <div className="glass-panel rounded-[1.75rem] border border-white/10 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">Sessao</p>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Encerrar a conta remove a sincronizacao local e leva voce de volta para a entrada principal.
            </p>
          </div>

          <GlassButton
            onClick={handleLogout}
            className="w-full text-destructive"
            contentClassName="flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
