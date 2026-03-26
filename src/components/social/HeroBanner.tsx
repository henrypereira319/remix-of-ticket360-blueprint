import type { ReactNode } from "react";
import type { HeroEvent } from "@/data/social-mock";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  event: HeroEvent;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
  className?: string;
}

const SocialHeroBanner = ({ event, headerSlot, footerSlot, className }: HeroBannerProps) => (
  <div className={cn("relative mx-4 overflow-hidden rounded-2xl lg:mx-0 lg:rounded-[2rem]", className)}>
    <img
      src={event.image}
      alt={event.name}
      className="h-[29rem] w-full object-cover sm:h-[33rem] lg:h-[38rem] xl:h-[41rem]"
      loading="eager"
    />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.12)_28%,rgba(0,0,0,0.72)_76%,rgba(0,0,0,0.92)_100%)]" />

    {headerSlot ? <div className="absolute inset-x-0 top-0 p-4 sm:p-5 lg:p-6">{headerSlot}</div> : null}

    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6">
      <div className="max-w-2xl">
        <p className="text-3xl font-bold tracking-tight text-white font-display sm:text-4xl xl:text-5xl">
          {event.name}
        </p>
        <p className="text-lg font-bold tracking-[0.28em] text-white/90 uppercase sm:text-xl">
          {event.tagline}
        </p>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-white/70 sm:text-sm">
          {event.date}
        </p>
      </div>

      {footerSlot ? <div className="mt-6 space-y-3 sm:mt-7">{footerSlot}</div> : null}
    </div>
  </div>
);

export default SocialHeroBanner;
