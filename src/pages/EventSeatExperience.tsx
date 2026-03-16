import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  SeatJourneyShell,
  SeatJourneyMap,
  SeatJourneyCheckout,
  SeatJourneyFloatingBar,
} from "@/components/seat-journey";
import { getEventBySlug } from "@/data/events";
import {
  getCheckoutPricing,
  getSeatById,
  getSelectionSummary,
  parseSeatIdsParam,
  parseTicketCategoriesParam,
  sanitizeSelectedSeatIds,
  sanitizeTicketCategories,
  serializeSeatIds,
  serializeTicketCategories,
  type TicketCategory,
} from "@/lib/ticketing";
import NotFound from "./NotFound";

const selectableStatuses = new Set(["available", "accessible"]);

const EventSeatExperience = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const event = getEventBySlug(slug);
  const checkoutRef = useRef<HTMLDivElement>(null);

  if (!event) {
    return <NotFound />;
  }

  const initialSeatIds = sanitizeSelectedSeatIds(event, parseSeatIdsParam(searchParams.get("assentos")));
  const initialTicketCategories = sanitizeTicketCategories(
    event,
    initialSeatIds,
    parseTicketCategoriesParam(searchParams.get("tipos")),
  );

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(initialSeatIds);
  const [selectedTicketCategories, setSelectedTicketCategories] =
    useState<Record<string, TicketCategory>>(initialTicketCategories);

  const searchKey = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    const nextSeatIds = sanitizeSelectedSeatIds(event, parseSeatIdsParam(params.get("assentos")));
    setSelectedSeatIds(nextSeatIds);
    setSelectedTicketCategories(
      sanitizeTicketCategories(event, nextSeatIds, parseTicketCategoriesParam(params.get("tipos"))),
    );
  }, [event.id, searchKey]);

  const updateSelectedSeatIds = (updater: (current: string[]) => string[]) => {
    setSelectedSeatIds((currentSelection) => {
      const nextSelection = updater(currentSelection);
      setSelectedTicketCategories((currentCategories) =>
        sanitizeTicketCategories(event, nextSelection, currentCategories),
      );
      return nextSelection;
    });
  };

  const handleToggleSeat = (seatId: string) => {
    const seat = getSeatById(event, seatId);
    if (!seat || !selectableStatuses.has(seat.status)) return;

    updateSelectedSeatIds((current) =>
      current.includes(seatId)
        ? current.filter((id) => id !== seatId)
        : [...current, seatId],
    );
  };

  const handleTicketCategoryChange = (seatId: string, category: TicketCategory) => {
    setSelectedTicketCategories((current) => ({ ...current, [seatId]: category }));
  };

  const scrollToCheckout = () => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToMap = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selection = getSelectionSummary(event, selectedSeatIds, selectedTicketCategories);
  const pricing = getCheckoutPricing(selection.total, selection.items.length);

  const checkoutParams = new URLSearchParams();
  checkoutParams.set("assentos", serializeSeatIds(selectedSeatIds));
  checkoutParams.set("tipos", serializeTicketCategories(selectedSeatIds, selectedTicketCategories));

  return (
    <SeatJourneyShell
      mapSection={
        <SeatJourneyMap
          seatMap={event.seatMap}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
        />
      }
      checkoutSection={
        <div ref={checkoutRef}>
          <SeatJourneyCheckout
            event={event}
            items={selection.items}
            pricing={pricing}
            selectedTicketCategories={selectedTicketCategories}
            onTicketCategoryChange={handleTicketCategoryChange}
            onScrollToMap={scrollToMap}
            checkoutUrl={`/eventos/${event.slug}/checkout?${checkoutParams.toString()}`}
          />
        </div>
      }
      floatingBar={
        <SeatJourneyFloatingBar
          itemCount={selection.items.length}
          total={pricing.total}
          hasSelection={selection.items.length > 0}
          onScrollToCheckout={scrollToCheckout}
        />
      }
    />
  );
};

export default EventSeatExperience;
