import { useEffect, useState } from "react";
import type { EventData, RuntimeEventData } from "@/data/events";
import { getCatalogEventBySlug, getRuntimeEventBySlug } from "@/server/api/catalog.api";
import { ordersApiChannels } from "@/server/api/orders.api";
import { inventoryApiChannels } from "@/server/api/inventory.api";

export const useEventRuntime = (slug?: string, holdToken?: string | null) => {
  const [version, setVersion] = useState(0);
  const [baseEvent, setBaseEvent] = useState<EventData | null>(null);
  const [event, setEvent] = useState<RuntimeEventData | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(slug));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [catalogEvent, runtimeEvent] = await Promise.all([
          getCatalogEventBySlug(slug),
          getRuntimeEventBySlug(slug, {
            holdToken,
          }),
        ]);

        if (!cancelled) {
          setBaseEvent(catalogEvent);
          setEvent(runtimeEvent);
        }
      } catch (loadError) {
        if (!cancelled) {
          setBaseEvent(null);
          setEvent(null);
          setError(loadError instanceof Error ? loadError : new Error("Falha ao carregar o evento."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [holdToken, slug, version]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const watchedChannels = new Set<string>([...inventoryApiChannels, ...ordersApiChannels]);
    const refresh = () => setVersion((current) => current + 1);

    const handleMutation = (event: Event) => {
      const detail = (event as CustomEvent<{ channel?: string }>).detail;
      const channel = detail?.channel;

      if (channel && watchedChannels.has(channel)) {
        refresh();
      }
    };

    const handleStorage = () => refresh();

    window.addEventListener("eventhub:storage-mutation", handleMutation as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("eventhub:storage-mutation", handleMutation as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    baseEvent,
    event,
    isLoading,
    error,
    refresh: () => setVersion((current) => current + 1),
  };
};
