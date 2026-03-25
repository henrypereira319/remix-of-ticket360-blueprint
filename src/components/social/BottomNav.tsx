import { Home, Users, Ticket, Map, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app", icon: Home, label: "Home" },
  { to: "/app/amigos", icon: Users, label: "Amigos" },
  { to: "/app/tickets", icon: Ticket, label: "Ticket's" },
  { to: "/app/mapa", icon: Map, label: "Mapa" },
  { to: "/app/perfil", icon: User, label: "Perfil" },
] as const;

const BottomNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg safe-bottom">
    <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/app"}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
              isActive ? "text-social" : "text-muted-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--social)/0.6)]")} strokeWidth={isActive ? 2.2 : 1.6} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;
