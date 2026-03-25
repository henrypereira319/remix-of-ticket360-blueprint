import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { socialNavTabs } from "@/components/social/navigation";
import { cn } from "@/lib/utils";

const navSpring = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.85,
} as const;

const isTabActive = (pathname: string, to: string) => (to === "/app" ? pathname === "/app" : pathname.startsWith(to));

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
    >
      <motion.nav
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="pointer-events-auto mx-auto w-full max-w-[25.5rem] rounded-[1.75rem] border border-white/8 bg-background/88 px-2 py-2 shadow-[0_26px_80px_-40px_rgba(0,0,0,1)] backdrop-blur-2xl"
      >
        <div className="flex items-stretch justify-between gap-1">
          {socialNavTabs.map(({ to, icon: Icon, label }) => {
            const isActive = isTabActive(pathname, to);

            return (
              <Link key={to} to={to} className="relative flex min-w-0 flex-1 items-center justify-center">
                <motion.div whileTap={{ scale: 0.94 }} className="relative flex w-full items-center justify-center">
                  {isActive ? (
                    <motion.span
                      layoutId="social-bottom-nav-active"
                      transition={navSpring}
                      className="absolute inset-x-1 inset-y-0 rounded-[1.35rem] border border-social/30 bg-white/[0.045] shadow-[inset_0_0_0_1px_rgba(178,241,52,0.06),0_0_24px_-14px_hsl(var(--social)/0.9)]"
                    />
                  ) : null}

                  <div
                    className={cn(
                      "relative flex h-[3.6rem] w-full flex-col items-center justify-center gap-1 px-2",
                      isActive ? "text-social" : "text-muted-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[1.15rem] w-[1.15rem] transition-all duration-200",
                        isActive && "drop-shadow-[0_0_10px_hsl(var(--social)/0.7)]",
                      )}
                      strokeWidth={isActive ? 2.25 : 1.7}
                    />
                    <span className="truncate text-[10px] font-medium leading-none tracking-[-0.01em]">{label}</span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
};

export default BottomNav;
