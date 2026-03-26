import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";
import BottomNav from "@/components/social/BottomNav";
import { getSocialRouteIndex } from "@/components/social/navigation";
import SocialDesktopRail from "@/components/social/SocialDesktopRail";

const backgroundImage =
  "https://lh3.googleusercontent.com/aida/ADBb0ujjRIWQIYy1FeWu-Mtq7SifGiLts-cv6qhQbB6-NWCURug0u3T2q7nbr4eCxQFg_DXSd7IgXJOZQSvOWzlowBvTHXeUdcC3GNpu_1ETi6GPcPQbS-UJU344RNPn-43y6hdlG59zopaEV_w1tEN9JQU7u1a9v24Pd1Qzt9UJo52r4a_gyrggFmqfHXGNr2RoPv-iS_fY63Px45QJs1-qDnQyoWgLcAqkUv_bnWRRGgpLpnocx0h4RSalKBl4jrA8v6Kc02BAOkjKicY";

const pageTransition = {
  center: {
    x: 0,
    opacity: 1,
    rotateY: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  enter: (direction: number) => ({
    x: direction >= 0 ? "18%" : "-18%",
    opacity: 0,
    rotateY: direction >= 0 ? -10 : 10,
    scale: 0.985,
    filter: "blur(6px)",
  }),
  exit: (direction: number) => ({
    x: direction >= 0 ? "-10%" : "10%",
    opacity: 0,
    rotateY: direction >= 0 ? 8 : -8,
    scale: 0.985,
    filter: "blur(5px)",
  }),
} as const;

const pageSpring = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.92,
} as const;

const SocialShell = () => {
  const outlet = useOutlet();
  const location = useLocation();
  const routeIndex = getSocialRouteIndex(location.pathname);
  const previousRouteIndexRef = useRef(routeIndex);
  const direction = routeIndex === previousRouteIndexRef.current ? 0 : routeIndex > previousRouteIndexRef.current ? 1 : -1;
  const isHome = location.pathname === "/app";

  useEffect(() => {
    previousRouteIndexRef.current = routeIndex;
  }, [routeIndex]);

  return (
    <div className="app-nocturne relative min-h-screen overflow-x-hidden font-['Manrope'] text-foreground">
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black/40" />

      {isHome ? (
        <main className="relative min-h-screen">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={location.pathname}
              custom={direction}
              variants={pageTransition}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageSpring}
              className="relative min-h-screen"
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      ) : (
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:flex lg:gap-6 lg:px-8 lg:pt-8">
          <SocialDesktopRail />
          <main className="min-w-0 flex-1">
            <div className="glass-panel min-h-[calc(100vh-6rem)] overflow-hidden rounded-[2rem] border border-white/10 px-1 py-1 shadow-card">
              <div className="relative min-h-[calc(100vh-6.5rem)] rounded-[1.75rem] bg-black/30 [perspective:1800px]">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div
                    key={location.pathname}
                    custom={direction}
                    variants={pageTransition}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={pageSpring}
                    className="relative min-h-[calc(100vh-6.5rem)]"
                  >
                    {outlet}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </main>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default SocialShell;
