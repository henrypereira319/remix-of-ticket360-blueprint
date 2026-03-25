import type { HeroEvent } from "@/data/social-mock";

interface HeroBannerProps {
  event: HeroEvent;
}

const SocialHeroBanner = ({ event }: HeroBannerProps) => (
  <div className="relative mx-4 overflow-hidden rounded-2xl lg:mx-0 lg:rounded-[2rem]">
    <img
      src={event.image}
      alt={event.name}
      className="h-48 w-full object-cover sm:h-56 lg:h-[22rem] xl:h-[24rem]"
      loading="eager"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 p-4">
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
  </div>
);

export default SocialHeroBanner;
