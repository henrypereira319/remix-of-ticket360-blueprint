import type { EventSeatMap, EventSeatMapData } from "@/data/events";

const geometryCache = new Map<string, Promise<EventSeatMapData>>();

const hasInlineGeometry = (seatMap: EventSeatMap): seatMap is EventSeatMapData => "seats" in seatMap;

export const loadSeatMapData = async (seatMap: EventSeatMap): Promise<EventSeatMapData> => {
  if (hasInlineGeometry(seatMap)) {
    return seatMap;
  }

  if (!seatMap.geometryPath) {
    throw new Error("O mapa nao possui uma fonte de geometria configurada.");
  }

  if (!geometryCache.has(seatMap.geometryPath)) {
    geometryCache.set(
      seatMap.geometryPath,
      fetch(seatMap.geometryPath)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Falha ao carregar a geometria do mapa (${response.status}).`);
          }

          return response.json() as Promise<EventSeatMapData>;
        })
        .then((geometry) => ({
          ...geometry,
          ...seatMap,
          seats: geometry.seats,
          backgroundMarkup: geometry.backgroundMarkup,
        })),
    );
  }

  return geometryCache.get(seatMap.geometryPath)!;
};
