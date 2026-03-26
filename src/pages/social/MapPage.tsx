import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LoaderCircle, MapPin, Navigation, Ticket } from "lucide-react";
import { useCatalogEvents } from "@/hooks/use-catalog-events";
import { geocodeEvents, loadGoogleMapsSdk, type EventMapLocation } from "@/lib/google-maps";

const MapPage = () => {
  const { events, isLoading } = useCatalogEvents();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [locations, setLocations] = useState<EventMapLocation[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Carregando mapa...");
  const [isMapBooting, setIsMapBooting] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedLocation = useMemo(
    () => locations.find((location) => location.event.slug === selectedSlug) ?? locations[0] ?? null,
    [locations, selectedSlug],
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrapMap = async () => {
      try {
        setErrorMessage(null);
        setStatusMessage("Carregando mapa...");
        const maps = await loadGoogleMapsSdk();

        if (cancelled || !mapContainerRef.current) {
          return;
        }

        const map = new maps.Map(mapContainerRef.current, {
          center: { lat: -14.235, lng: -51.9253 },
          zoom: 4,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#101010" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#d4d4d4" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#101010" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#1b1b1b" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#161616" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1f33" }] },
          ],
        });

        mapRef.current = map;
        infoWindowRef.current = new maps.InfoWindow();
        setStatusMessage("Geocodificando eventos...");

        const nextLocations = await geocodeEvents(events);

        if (cancelled) {
          return;
        }

        setLocations(nextLocations);
        setSelectedSlug(nextLocations[0]?.event.slug ?? null);
        setStatusMessage(nextLocations.length > 0 ? "Mapa pronto" : "Sem localizações válidas");
        setIsMapBooting(false);

        if (nextLocations.length === 0) {
          return;
        }

        const bounds = new maps.LatLngBounds();

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = nextLocations.map((location) => {
          const marker = new maps.Marker({
            position: location.coordinates,
            map,
            title: location.event.title,
            animation: maps.Animation.DROP,
          });

          marker.addListener("click", () => {
            setSelectedSlug(location.event.slug);
            infoWindowRef.current?.setContent(
              `<div style="padding:8px 10px;min-width:220px"><div style="font-weight:700;color:#111827">${location.event.title}</div><div style="margin-top:4px;color:#4b5563;font-size:12px">${location.event.venueName} • ${location.event.city}</div><div style="margin-top:8px;color:#111827;font-size:12px">${location.event.details.address}</div></div>`,
            );
            infoWindowRef.current?.open({
              map,
              anchor: marker,
            });
          });

          bounds.extend(location.coordinates);
          return marker;
        });

        map.fitBounds(bounds, 80);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setIsMapBooting(false);
        setErrorMessage(error instanceof Error ? error.message : "Falha ao carregar Google Maps.");
      }
    };

    void bootstrapMap();

    return () => {
      cancelled = true;
    };
  }, [events]);

  useEffect(() => {
    if (!selectedLocation || !mapRef.current || !window.google?.maps) {
      return;
    }

    mapRef.current.panTo(selectedLocation.coordinates);
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom?.() ?? 10, 10));
  }, [selectedLocation]);

  return (
    <div className="space-y-4 safe-top lg:px-6 lg:pb-6">
      <div className="px-4 pt-4 lg:px-0 lg:pt-6">
        <h1 className="text-xl font-bold text-foreground font-display">Mapa</h1>
        <p className="mt-1 text-xs text-muted-foreground">Eventos publicados e rolês da sua rede espalhados pelo mapa</p>
      </div>

      <div className="grid gap-4 px-4 lg:px-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-[1.9rem] border border-white/5 bg-surface/70 shadow-card">
          <div className="relative min-h-[26rem] sm:min-h-[32rem]">
            <div ref={mapContainerRef} className="absolute inset-0" />
            {isMapBooting ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                  <LoaderCircle className="h-7 w-7 animate-spin text-social" />
                </div>
                <p className="text-sm font-medium text-foreground">{statusMessage}</p>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/88 p-6 text-center">
                <div className="max-w-sm space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
                    <MapPin className="h-8 w-8 text-muted-foreground/45" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{errorMessage}</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Confira a chave `VITE_GOOGLE_MAPS_API_KEY` e as restrições de origem no Google Cloud.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-white/5 bg-surface/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-social">Mapa vivo</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background/55 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Eventos localizados</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{locations.length}</p>
              </div>
              <div className="rounded-2xl bg-background/55 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Catálogo</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{events.length}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-background/55 p-3 text-[11px] leading-5 text-muted-foreground">
              {isLoading ? "Sincronizando catálogo..." : "Clique em um evento para focar no mapa e abrir a rota de detalhes."}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/5 bg-surface/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Eventos no mapa</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">Locais publicados</h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {locations.length > 0 ? (
                locations.map((location) => {
                  const isSelected = selectedLocation?.event.slug === location.event.slug;

                  return (
                    <button
                      key={location.event.id}
                      onClick={() => setSelectedSlug(location.event.slug)}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-social/40 bg-social/10"
                          : "border-white/5 bg-background/55 hover:bg-background/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{location.event.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{location.event.venueName} • {location.event.city}</p>
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-background/70">
                          <Navigation className="h-4 w-4 text-social" />
                        </div>
                      </div>

                      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{location.event.details.address}</p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-social">
                          {location.event.weekday} • {location.event.day} {location.event.month}
                        </span>
                        <Link
                          to={`/eventos/${location.event.slug}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground"
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          Ver evento
                        </Link>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex min-h-[14rem] flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-border bg-background/40 px-4 py-12 text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Nenhum evento com localização válida encontrado
                  </p>
                  <p className="max-w-xs text-[11px] text-muted-foreground/70">
                    Assim que houver eventos com endereço geocodificável, eles aparecem aqui automaticamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MapPage;
