import { useRef } from "react";
import type { ReactNode } from "react";

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
      {/* Sticky map area - stays pinned while user scrolls */}
      <div className="relative" style={{ height: "200vh" }}>
        <div className="sticky top-0 h-screen w-full">
          {mapSection}
        </div>
      </div>

      {/* Checkout content scrolls over the map naturally */}
      <div className="relative z-10">
        {checkoutSection}
      </div>

      {/* Floating bar at bottom */}
      {floatingBar}
    </div>
  );
};

export default SeatJourneyShell;
