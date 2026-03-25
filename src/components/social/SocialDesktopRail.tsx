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
      <div className="sticky top-8 flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-surface/80 p-5 shadow-card backdrop-blur-xl">
        <Link to="/app" className="rounded-[1.5rem] border border-white/5 bg-background/70 px-4 py-4 transition-colors hover:border-social/30">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-social">EventHub Social</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Rede pessoal do evento</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Feed social, pedidos in-bar e divisão de itens premium no mesmo fluxo.
          </p>
        </Link>

        <div className="mt-5 rounded-[1.5rem] border border-white/5 bg-background/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sua sessão</p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">Olá, {firstName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{currentAccount?.email ?? "Entre para sincronizar sua rede."}</p>
          <Link
            to="/conta"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-social transition-colors hover:text-social/80"
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
                    ? "bg-social text-social-foreground shadow-[0_18px_45px_-28px_hsl(var(--social)/0.95)]"
                    : "bg-background/40 text-muted-foreground hover:bg-background/70 hover:text-foreground",
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
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Atalhos</p>
          <div className="mt-3 space-y-2">
            {socialQuickLinks.map(({ to, icon: Icon, label, description }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-[1.25rem] border px-4 py-3 transition-colors",
                    isActive
                      ? "border-social/35 bg-social/10"
                      : "border-white/5 bg-background/35 hover:border-white/10 hover:bg-background/55",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        isActive ? "bg-social text-social-foreground" : "bg-surface-elevated text-social",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="truncate text-xs text-muted-foreground">{description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mt-auto rounded-[1.5rem] border border-white/5 bg-gradient-to-br from-social/18 via-transparent to-primary/18 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-social">Resumo rápido</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{pendingInbox}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            itens aguardando sua atenção entre solicitações, divisões e pedidos ativos.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default SocialDesktopRail;
