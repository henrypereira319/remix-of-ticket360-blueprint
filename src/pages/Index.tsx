import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SectionSeparator from "@/components/SectionSeparator";
import HighlightsCarousel from "@/components/HighlightsCarousel";
import HeroBanner from "@/components/HeroBanner";
import EventGrid from "@/components/EventGrid";
import { highlights, banners, events } from "@/data/events";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-4 space-y-4">
        {/* Destaques */}
        <SectionSeparator title="Destaques" />
        <HighlightsCarousel highlights={highlights} />

        {/* Separator line */}
        <div className="border-b border-separator" />

        {/* Hero Banner */}
        <HeroBanner banners={banners} />

        {/* Próximos Eventos */}
        <SectionSeparator title="Próximos Eventos" />
        <EventGrid events={events} />
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
