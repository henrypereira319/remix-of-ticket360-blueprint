import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface SeatJourneyShellProps {
  mapSection: ReactNode;
  checkoutSection: ReactNode;
  floatingBar?: ReactNode;
}

/**
 * Shell da jornada de assentos com sticky scrolling.
 * O mapa fica preso (sticky) no topo enquanto o conteúdo de checkout
 * rola naturalmente por cima, criando uma jornada contínua.
 */
const SeatJourneyShell = ({ mapSection, checkoutSection, floatingBar }: SeatJourneyShellProps) => {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Sticky map area — stays pinned while user scrolls past */}
      <div className="relative" style={{ height: "150vh" }}>
        <div className="sticky top-0 z-0 h-screen w-full">
          {mapSection}
        </div>
      </div>

      {/* Visual scroll hint anchored at the boundary */}
      <div className="pointer-events-none relative z-10 -mt-16 flex justify-center pb-2">
        <div className="flex flex-col items-center gap-1 rounded-full bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-sm">
          <ChevronDown className="h-4 w-4 animate-bounce" />
          Role para revisar o pedido
        </div>
      </div>

      {/* Checkout content slides over the map with a clean edge */}
      <div className="relative z-10 rounded-t-3xl border-t border-border bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        {checkoutSection}
      </div>

      {/* Floating bar at bottom */}
      {floatingBar}
    </div>
  );
};

export default SeatJourneyShell;
