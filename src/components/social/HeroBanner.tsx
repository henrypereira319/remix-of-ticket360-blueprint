import type { HeroEvent } from "@/data/social-mock";

interface HeroBannerProps {
  event: HeroEvent;
}

const SocialHeroBanner = ({ event }: HeroBannerProps) => (
  <div className="relative mx-4 overflow-hidden rounded-2xl">
    <img
      src={event.image}
      alt={event.name}
      className="h-48 w-full object-cover"
      loading="eager"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 p-4">
      <p className="text-3xl font-bold tracking-tight text-white font-display">
        {event.name}
      </p>
      <p className="text-lg font-bold tracking-widest text-white/90 uppercase">
        {event.tagline}
      </p>
    </div>
  </div>
);

export default SocialHeroBanner;
