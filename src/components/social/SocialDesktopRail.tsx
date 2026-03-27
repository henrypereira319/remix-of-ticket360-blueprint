import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { socialNavTabs, socialQuickLinks } from "@/components/social/navigation";
import { mockNotificationCounts } from "@/data/social-mock";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const SocialDesktopRail = () => {
  const { currentAccount } = useAuth();
  const firstName = currentAccount?.fullName?.split(" ")[0] ?? "Visitante";
  const pendingInbox = mockNotificationCounts.requests + mockNotificationCounts.splits + mockNotificationCounts.orders;

  return (
    <aside className="hidden lg:flex lg:h-screen lg:flex-col lg:py-8">
      <div className="sticky top-8 flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-[0_28px_90px_-52px_rgba(0,0,0,1)] backdrop-blur-2xl">
        <Link to="/app" className="glass-panel rounded-[1.5rem] border border-white/10 px-4 py-4 transition-colors hover:border-primary/30">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">EventHub Social</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Rede pessoal do evento</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Feed social, pedidos in-bar e divisao de itens premium no mesmo fluxo.
          </p>
        </Link>

        <div className="nocturne-panel mt-5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Sua sessao</p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">Ola, {firstName}</h3>
          <p className="mt-1 text-sm text-white/60">{currentAccount?.email ?? "Entre para sincronizar sua rede."}</p>
          <Link
            to="/conta"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Abrir painel da conta
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <nav className="mt-5 space-y-2">
          {socialNavTabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_18px_45px_-28px_rgba(153,238,0,0.48)]"
                    : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-4 w-4" strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Atalhos</p>
          <div className="mt-3 space-y-2">
            {socialQuickLinks.map(({ to, icon: Icon, label, description }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-[1.25rem] border px-4 py-3 transition-colors",
                    isActive
                      ? "border-primary/30 bg-primary/10"
                      : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        isActive ? "bg-primary text-primary-foreground" : "bg-white/[0.06] text-primary",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="truncate text-xs text-white/50">{description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/35" />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-primary/18 via-transparent to-secondary/16 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Resumo rapido</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{pendingInbox}</p>
          <p className="mt-1 text-sm leading-6 text-white/60">
            itens aguardando sua atencao entre solicitacoes, divisoes e pedidos ativos.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default SocialDesktopRail;
