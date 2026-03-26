import type { EventData } from "@/data/events";

const GOOGLE_MAPS_SCRIPT_ID = "eventhub-google-maps";
const GOOGLE_MAPS_CALLBACK_NAME = "__eventhubGoogleMapsReady";
const GEOCODE_CACHE_KEY = "eventhub.google-maps.geocode-cache";

type Coordinates = {
  lat: number;
  lng: number;
};

export interface EventMapLocation {
  event: EventData;
  coordinates: Coordinates;
  sourceLabel: string;
}

let mapsScriptPromise: Promise<any> | null = null;

const resolveLoadedMaps = () => {
  if (!window.google?.maps?.Map) {
    throw new Error("Google Maps carregou sem disponibilizar a biblioteca principal.");
  }

  return window.google.maps;
};

const readGeocodeCache = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(GEOCODE_CACHE_KEY) ?? "{}") as Record<string, Coordinates>;
  } catch {
    return {};
  }
};

const writeGeocodeCache = (cache: Record<string, Coordinates>) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
};

export const loadGoogleMapsSdk = async () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

  if (!apiKey) {
    throw new Error("Google Maps nao configurado. Defina VITE_GOOGLE_MAPS_API_KEY.");
  }

  if (typeof window === "undefined") {
    throw new Error("Google Maps so pode carregar no navegador.");
  }

  if (window.google?.maps) {
    return window.google.maps;
  }

  if (!mapsScriptPromise) {
    mapsScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
      const readyCallback = () => {
        try {
          resolve(resolveLoadedMaps());
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Falha ao inicializar o SDK do Google Maps."));
        } finally {
          try {
            delete (window as Window & Record<string, unknown>)[GOOGLE_MAPS_CALLBACK_NAME];
          } catch {
            (window as Window & Record<string, unknown>)[GOOGLE_MAPS_CALLBACK_NAME] = undefined;
          }
        }
      };

      (window as Window & Record<string, unknown>)[GOOGLE_MAPS_CALLBACK_NAME] = readyCallback;

      if (existingScript) {
        if (window.google?.maps?.Map) {
          readyCallback();
          return;
        }

        existingScript.addEventListener("error", () => reject(new Error("Falha ao carregar o SDK do Google Maps.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.id = GOOGLE_MAPS_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        apiKey,
      )}&loading=async&callback=${GOOGLE_MAPS_CALLBACK_NAME}`;
      script.onerror = () => reject(new Error("Falha ao carregar o SDK do Google Maps."));
      document.head.appendChild(script);
    });
  }

  return mapsScriptPromise;
};

const getEventGeocodeQuery = (event: EventData) => event.details.address || `${event.venueName}, ${event.city}, Brasil`;

export const geocodeEvents = async (events: EventData[]) => {
  if (events.length === 0) {
    return [];
  }

  const maps = await loadGoogleMapsSdk();
  const geocoder = new maps.Geocoder();
  const cache = readGeocodeCache();

  const locations = await Promise.all(
    events.map<EventMapLocation | null>(async (event) => {
      const query = getEventGeocodeQuery(event);
      const cachedCoordinates = cache[query];

      if (cachedCoordinates) {
        return {
          event,
          coordinates: cachedCoordinates,
          sourceLabel: query,
        };
      }

      try {
        const response = await geocoder.geocode({ address: query });
        const result = response.results?.[0];
        const location = result?.geometry?.location;

        if (!location) {
          return null;
        }

        const coordinates = {
          lat: location.lat(),
          lng: location.lng(),
        };

        cache[query] = coordinates;

        return {
          event,
          coordinates,
          sourceLabel: query,
        };
      } catch (error) {
        console.warn(`Falha ao geocodificar ${event.slug}.`, error);
        return null;
      }
    }),
  );

  writeGeocodeCache(cache);

  return locations.filter((location): location is EventMapLocation => Boolean(location));
};
