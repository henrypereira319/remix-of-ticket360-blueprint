import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";
import BottomNav from "@/components/social/BottomNav";
import { getSocialRouteIndex } from "@/components/social/navigation";
import SocialDesktopRail from "@/components/social/SocialDesktopRail";

const backgroundImage =
  "https://lh3.googleusercontent.com/aida/ADBb0ujjRIWQIYy1FeWu-Mtq7SifGiLts-cv6qhQbB6-NWCURug0u3T2q7nbr4eCxQFg_DXSd7IgXJOZQSvOWzlowBvTHXeUdcC3GNpu_1ETi6GPcPQbS-UJU344RNPn-43y6hdlG59zopaEV_w1tEN9JQU7u1a9v24Pd1Qzt9UJo52r4a_gyrggFmqfHXGNr2RoPv-iS_fY63Px45QJs1-qDnQyoWgLcAqkUv_bnWRRGgpLpnocx0h4RSalKBl4jrA8v6Kc02BAOkjKicY";
const backgroundVideoMobileMp4 = "/media/travis-fein-live-bg-mobile.mp4";
const backgroundVideoMp4 = "/media/travis-fein-live-bg-optimized.mp4";
const backgroundVideoPoster = "/media/travis-fein-live-bg-poster.webp";

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const direction = routeIndex === previousRouteIndexRef.current ? 0 : routeIndex > previousRouteIndexRef.current ? 1 : -1;
  const isHome = location.pathname === "/app";
  const [canUseVideoBackground, setCanUseVideoBackground] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });
  const [videoReady, setVideoReady] = useState(false);
  const activeBackgroundVideo = isMobileViewport ? backgroundVideoMobileMp4 : backgroundVideoMp4;

  useEffect(() => {
    previousRouteIndexRef.current = routeIndex;
  }, [routeIndex]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewportQuery = window.matchMedia("(max-width: 768px)");
    const connection = navigator.connection as
      | {
          saveData?: boolean;
          effectiveType?: string;
          addEventListener?: (type: string, listener: () => void) => void;
          removeEventListener?: (type: string, listener: () => void) => void;
        }
      | undefined;

    const updatePreference = () => {
      const slowConnection = connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
      setCanUseVideoBackground(!mediaQuery.matches && !slowConnection);
      setIsMobileViewport(viewportQuery.matches);
    };

    updatePreference();

    const handleMediaChange = () => updatePreference();
    mediaQuery.addEventListener("change", handleMediaChange);
    viewportQuery.addEventListener("change", handleMediaChange);
    connection?.addEventListener?.("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      viewportQuery.removeEventListener("change", handleMediaChange);
      connection?.removeEventListener?.("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!isHome) {
      setVideoReady(false);
    }
  }, [isHome]);

  useEffect(() => {
    setVideoReady(false);
  }, [activeBackgroundVideo, canUseVideoBackground, isHome]);

  useEffect(() => {
    if (!isHome || !canUseVideoBackground) {
      videoRef.current?.pause();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");

    const syncPlayback = () => {
      if (document.hidden) {
        video.pause();
        return;
      }

      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Keep the poster/background visible while the browser settles autoplay.
        });
      }
    };

    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, [activeBackgroundVideo, canUseVideoBackground, isHome]);

  useEffect(() => {
    if (!isHome || !canUseVideoBackground) return;

    const tryResumePlayback = () => {
      const video = videoRef.current;
      if (!video || document.hidden || !video.paused) return;

      video.play().catch(() => {
        // Some mobile browsers require a more explicit user gesture. We'll keep listening until one succeeds.
      });
    };

    window.addEventListener("touchstart", tryResumePlayback, { passive: true });
    window.addEventListener("pointerdown", tryResumePlayback, { passive: true });
    window.addEventListener("scroll", tryResumePlayback, { passive: true });

    return () => {
      window.removeEventListener("touchstart", tryResumePlayback);
      window.removeEventListener("pointerdown", tryResumePlayback);
      window.removeEventListener("scroll", tryResumePlayback);
    };
  }, [canUseVideoBackground, isHome]);

  const handleVideoReady = () => {
    if (videoRef.current) {
      videoRef.current.defaultPlaybackRate = 0.82;
      videoRef.current.playbackRate = 0.82;
      videoRef.current.play().catch(() => {
        // The background can stay on the poster until the browser allows playback.
      });
    }
  };

  const handleVideoPlaying = () => {
    if (videoRef.current) {
      videoRef.current.defaultPlaybackRate = 0.82;
      videoRef.current.playbackRate = 0.82;
    }
    setVideoReady(true);
  };

  return (
    <div className={`relative min-h-screen overflow-x-hidden text-foreground ${isHome ? "bg-transparent" : "bg-background"}`}>
      {isHome ? (
        <div className="app-nocturne relative isolate min-h-screen overflow-x-hidden font-['Manrope'] text-foreground">
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-black bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundVideoPoster}), url(${backgroundImage})` }}
          />
          {canUseVideoBackground ? (
            <video
              key={activeBackgroundVideo}
              ref={videoRef}
              aria-hidden="true"
              className={`pointer-events-none fixed inset-0 z-[5] h-full w-full scale-100 object-cover transition-opacity duration-1000 ease-out md:scale-[1.02] ${
                videoReady ? "opacity-100" : "opacity-0"
              }`}
              autoPlay
              loop
              muted
              playsInline
              preload={isMobileViewport ? "metadata" : "auto"}
              src={activeBackgroundVideo}
              poster={backgroundVideoPoster}
              disablePictureInPicture
              disableRemotePlayback
              onLoadedMetadata={handleVideoReady}
              onCanPlay={handleVideoReady}
              onLoadedData={handleVideoReady}
              onPlaying={handleVideoPlaying}
              onTimeUpdate={handleVideoPlaying}
              onPause={() => {
                if ((videoRef.current?.currentTime ?? 0) === 0) {
                  setVideoReady(false);
                }
              }}
              onError={() => setVideoReady(false)}
              style={{ transform: "translateZ(0)", willChange: "opacity" }}
            />
          ) : null}
          <div className="pointer-events-none fixed inset-0 z-10 bg-black/52" />
          <div className="pointer-events-none fixed inset-0 z-[11] bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.12),transparent_38%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.2))]" />

          <main className="relative z-20 min-h-screen">
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
        </div>
      ) : (
        <>
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
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default SocialShell;
