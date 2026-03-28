import { Link, useLocation } from "react-router-dom";
import { socialNavTabs } from "@/components/social/navigation";
import { cn } from "@/lib/utils";
import { GlassButton } from "@/components/ui/glass-button";

const isTabActive = (pathname: string, to: string) => (to === "/app" ? pathname === "/app" : pathname.startsWith(to));

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center px-4"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.25rem)",
      }}
    >
      <nav
        className="pointer-events-auto flex h-16 w-[90%] max-w-md items-center justify-around rounded-full border border-white/10 bg-black/80 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl supports-[backdrop-filter]:bg-black/65"
        style={{
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          willChange: "transform",
          isolation: "isolate",
        }}
      >
        {socialNavTabs.map(({ to, icon: Icon, label }) => {
          const isActive = isTabActive(pathname, to);

          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="block"
            >
              <GlassButton
                size="icon"
                className={cn("social-nav-button h-11 w-11", isActive && "social-nav-button-active")}
                contentClassName="flex items-center justify-center"
              >
                <Icon
                  className={cn("social-nav-icon h-5 w-5", isActive && "social-nav-icon-active")}
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
              </GlassButton>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
