import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";
import BottomNav from "@/components/social/BottomNav";
import { getSocialRouteIndex } from "@/components/social/navigation";

const backgroundImage =
  "https://lh3.googleusercontent.com/aida/ADBb0ujjRIWQIYy1FeWu-Mtq7SifGiLts-cv6qhQbB6-NWCURug0u3T2q7nbr4eCxQFg_DXSd7IgXJOZQSvOWzlowBvTHXeUdcC3GNpu_1ETi6GPcPQbS-UJU344RNPn-43y6hdlG59zopaEV_w1tEN9JQU7u1a9v24Pd1Qzt9UJo52r4a_gyrggFmqfHXGNr2RoPv-iS_fY63Px45QJs1-qDnQyoWgLcAqkUv_bnWRRGgpLpnocx0h4RSalKBl4jrA8v6Kc02BAOkjKicY";
const backgroundVideoMobileMp4 = "/media/travis-fein-live-bg-mobile.mp4";
const backgroundVideoMp4 = "/media/travis-fein-live-bg-optimized.mp4";
const backgroundVideoPoster = "/media/travis-fein-live-bg-poster.webp";

const SocialShell = () => {
  const outlet = useOutlet();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
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
  const pageTransition = shouldReduceMotion
    ? {
        center: { x: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
        enter: { x: 0, opacity: 0, scale: 1, filter: "blur(0px)" },
        exit: { x: 0, opacity: 0, scale: 1, filter: "blur(0px)" },
      }
    : {
        center: {
          x: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
        },
        enter: (direction: number) => ({
          x: direction >= 0 ? 84 : -84,
          opacity: 0.02,
          scale: 0.985,
          filter: "blur(8px)",
        }),
        exit: (direction: number) => ({
          x: direction >= 0 ? -56 : 56,
          opacity: 0.02,
          scale: 0.99,
          filter: "blur(6px)",
        }),
      };
  const pageSpring = shouldReduceMotion
    ? {
        duration: 0.16,
        ease: "easeOut",
      }
    : {
        x: {
          type: "spring",
          stiffness: 240,
          damping: 28,
          mass: 0.92,
        },
        opacity: {
          duration: 0.26,
          ease: [0.22, 1, 0.36, 1],
        },
        scale: {
          duration: 0.32,
          ease: [0.22, 1, 0.36, 1],
        },
        filter: {
          duration: 0.28,
          ease: "easeOut",
        },
      };

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
    <div className="app-nocturne relative min-h-screen overflow-x-hidden bg-transparent font-['Manrope'] text-foreground">
      <div
        className={`pointer-events-none fixed inset-0 z-0 bg-black bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
          isHome ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url(${backgroundVideoPoster}), url(${backgroundImage})` }}
      />
      {canUseVideoBackground ? (
        <video
          key={activeBackgroundVideo}
          ref={videoRef}
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-[5] h-full w-full scale-100 object-cover transition-opacity duration-1000 ease-out md:scale-[1.02] ${
            isHome && videoReady ? "opacity-100" : "opacity-0"
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
      <div className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-500 ${isHome ? "bg-black/52 opacity-100" : "opacity-0"}`} />
      <div
        className={`pointer-events-none fixed inset-0 z-[11] transition-opacity duration-500 ${
          isHome
            ? "opacity-100 bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.12),transparent_38%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.2))]"
            : "opacity-0"
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top_left,rgba(153,238,0,0.1),transparent_26%),radial-gradient(circle_at_top_right,rgba(255,116,57,0.13),transparent_24%)] transition-opacity duration-500 ${
          isHome ? "opacity-0" : "opacity-100"
        }`}
      />

      <div className={`relative z-20 ${isHome ? "min-h-screen overflow-x-hidden" : "mx-auto w-full max-w-7xl px-4 pb-32 sm:px-6 lg:px-8"}`}>
        <main className={`relative min-h-screen overflow-hidden ${isHome ? "" : "py-4 lg:py-8"}`}>
          <div className={`relative min-h-screen overflow-hidden [perspective:1800px] ${isHome ? "" : "lg:min-h-[calc(100vh-4rem)]"}`}>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={location.pathname}
                custom={direction}
                variants={pageTransition}
                initial="enter"
                animate="center"
                exit="exit"
                transition={pageSpring}
                className={`relative min-h-screen origin-center will-change-transform ${isHome ? "" : "lg:min-h-[calc(100vh-4rem)]"}`}
              >
                {!isHome ? (
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: shouldReduceMotion ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0.12 : 0.24, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(90deg,rgba(153,238,0,0.05),transparent_18%,transparent_82%,rgba(255,116,57,0.05))]"
                  />
                ) : null}
                {outlet}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default SocialShell;
