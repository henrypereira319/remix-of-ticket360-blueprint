import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { socialNavTabs } from "@/components/social/navigation";
import { cn } from "@/lib/utils";

const isTabActive = (pathname: string, to: string) => (to === "/app" ? pathname === "/app" : pathname.startsWith(to));

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
      }}
    >
      <motion.nav
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="pointer-events-auto glass-panel flex h-16 w-[90%] max-w-md items-center justify-around rounded-full border border-white/10 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {socialNavTabs.map(({ to, icon: Icon, label }) => {
          const isActive = isTabActive(pathname, to);

          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={cn(
                "flex h-11 w-11 flex-col items-center justify-center rounded-full transition-all",
                isActive
                  ? "scale-110 bg-primary/18 text-primary shadow-[0_0_30px_rgba(153,238,0,0.16)]"
                  : "text-white/40 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.9} />
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
};

export default BottomNav;
