import { NavLink } from "react-router-dom";
import { socialNavTabs } from "@/components/social/navigation";
import { cn } from "@/lib/utils";

const BottomNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg safe-bottom lg:hidden">
    <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
      {socialNavTabs.map(({ to, icon: Icon, label }) => (
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
