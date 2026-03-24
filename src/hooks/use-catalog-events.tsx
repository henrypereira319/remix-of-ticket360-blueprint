import { useEffect, useState } from "react";
import type { EventData } from "@/data/events";
import { listCatalogEvents, type CatalogListInput } from "@/server/api/catalog.api";

export const useCatalogEvents = (input?: CatalogListInput) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const city = input?.city;
  const category = input?.category;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const nextEvents = await listCatalogEvents({
        city,
        category,
      });

      if (!cancelled) {
        setEvents(nextEvents);
        setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [category, city]);

  return {
    events,
    isLoading,
  };
};
