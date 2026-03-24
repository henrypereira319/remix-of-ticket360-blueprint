import { useEffect, useState } from "react";
import type { EventData } from "@/data/events";
import { getCatalogEventBySlug } from "@/server/api/catalog.api";

export const useCatalogEvent = (slug?: string) => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(slug));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const nextEvent = await getCatalogEventBySlug(slug);

      if (!cancelled) {
        setEvent(nextEvent);
        setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return {
    event,
    isLoading,
  };
};
