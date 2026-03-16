import { useCallback } from "react";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BannerData } from "@/data/events";

interface HeroBannerProps {
  banners: BannerData[];
}

const HeroBanner = ({ banners }: HeroBannerProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="flex-none w-full">
              <a href={banner.href} title={banner.title} className="block">
                <img
                  src={banner.image}
                  alt={banner.title}
                  loading="lazy"
                  className="w-full object-cover"
                  style={{ aspectRatio: "1280 / 370" }}
                />
              </a>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-5 h-5 text-card" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Proximo"
      >
        <ChevronRight className="w-5 h-5 text-card" />
      </button>
    </div>
  );
};

export default HeroBanner;
