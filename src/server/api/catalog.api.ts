import { getEventBySlug, type EventData, type RuntimeEventData } from "@/data/events";
import { hydrateEventInventory } from "@/server/seat-inventory.service";
import { loadSeatMapData } from "@/server/seat-map-loader";

export interface CatalogListInput {
  city?: string;
  category?: string;
}

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export const getCatalogEventBySlug = async (slug?: string): Promise<EventData | null> => getEventBySlug(slug) ?? null;

export const getRuntimeEventBySlug = async (
  slug?: string,
  options?: {
    holdToken?: string | null;
  },
): Promise<RuntimeEventData | null> => {
  const event = getEventBySlug(slug);

  if (!event) {
    return null;
  }

  const seatMap = await loadSeatMapData(event.seatMap);

  return hydrateEventInventory(
    {
      ...event,
      seatMap,
    },
    options?.holdToken ?? undefined,
  );
};

export const listCatalogEvents = async (input?: CatalogListInput): Promise<EventData[]> => {
  const { events } = await import("@/data/events");
  const normalizedCity = normalize(input?.city);
  const normalizedCategory = normalize(input?.category);

  return events.filter((event) => {
    const cityMatches = normalizedCity ? normalize(event.city).includes(normalizedCity) : true;
    const categoryMatches = normalizedCategory ? normalize(event.category) === normalizedCategory : true;
    return cityMatches && categoryMatches;
  });
};
