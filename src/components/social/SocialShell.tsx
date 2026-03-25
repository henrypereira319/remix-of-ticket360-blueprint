import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";
import BottomNav from "@/components/social/BottomNav";
import { getSocialRouteIndex } from "@/components/social/navigation";
import SocialDesktopRail from "@/components/social/SocialDesktopRail";

/**
 * Shell layout for the authenticated social mobile experience.
 * Renders bottom navigation and safe-area padding for content.
 */
const pageTransition = {
  center: {
    x: 0,
    opacity: 1,
    rotateY: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  enter: (direction: number) => ({
    x: direction >= 0 ? "22%" : "-22%",
    opacity: 0,
    rotateY: direction >= 0 ? -14 : 14,
    scale: 0.985,
    filter: "blur(6px)",
  }),
  exit: (direction: number) => ({
    x: direction >= 0 ? "-14%" : "14%",
    opacity: 0,
    rotateY: direction >= 0 ? 10 : -10,
    scale: 0.985,
    filter: "blur(5px)",
  }),
} as const;

const pageSpring = {
  type: "spring",
  stiffness: 280,
  damping: 32,
  mass: 0.9,
} as const;

const SocialShell = () => {
  const outlet = useOutlet();
  const location = useLocation();
  const routeIndex = getSocialRouteIndex(location.pathname);
  const previousRouteIndexRef = useRef(routeIndex);
  const direction = routeIndex === previousRouteIndexRef.current ? 0 : routeIndex > previousRouteIndexRef.current ? 1 : -1;

  useEffect(() => {
    previousRouteIndexRef.current = routeIndex;
  }, [routeIndex]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(178,241,52,0.1),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_24%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] lg:grid lg:min-h-screen lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6 lg:px-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:px-8">
        <SocialDesktopRail />

        <main className="min-w-0 lg:py-8">
          <div className="pb-24 lg:min-h-[calc(100vh-4rem)] lg:overflow-hidden lg:rounded-[2rem] lg:border lg:border-border/60 lg:bg-background/60 lg:pb-0 lg:shadow-card">
            <div className="relative min-h-screen [perspective:1800px] lg:min-h-[calc(100vh-4rem)]">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={location.pathname}
                  custom={direction}
                  variants={pageTransition}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={pageSpring}
                  className="relative min-h-screen origin-center will-change-transform lg:min-h-[calc(100vh-4rem)]"
                >
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/25 to-transparent"
                  />
                  {outlet}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default SocialShell;
