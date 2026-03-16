import SeatMap from "@/components/SeatMap";
import type { EventSeatMap } from "@/data/events";

interface SeatJourneyMapProps {
  seatMap: EventSeatMap;
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
}

/**
 * Full-screen map hero for the seat journey.
 * Clean, no overlays — the map is the protagonist.
 */
const SeatJourneyMap = ({ seatMap, selectedSeatIds, onToggleSeat }: SeatJourneyMapProps) => {
  return (
    <div className="h-full w-full">
      <SeatMap
        immersive
        fullBleed
        seatMap={seatMap}
        selectedSeatIds={selectedSeatIds}
        onToggleSeat={onToggleSeat}
      />
    </div>
  );
};

export default SeatJourneyMap;
