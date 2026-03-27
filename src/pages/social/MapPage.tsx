import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LoaderCircle, MapPin, Navigation, Ticket } from "lucide-react";
import SocialPageHero from "@/components/social/SocialPageHero";
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

        if (cancelled || !mapContainerRef.current) return;

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
        if (cancelled) return;

        setLocations(nextLocations);
        setSelectedSlug(nextLocations[0]?.event.slug ?? null);
        setStatusMessage(nextLocations.length > 0 ? "Mapa pronto" : "Sem localizacoes validas");
        setIsMapBooting(false);

        if (nextLocations.length === 0) return;

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
              `<div style="padding:8px 10px;min-width:220px"><div style="font-weight:700;color:#111827">${location.event.title}</div><div style="margin-top:4px;color:#4b5563;font-size:12px">${location.event.venueName} - ${location.event.city}</div><div style="margin-top:8px;color:#111827;font-size:12px">${location.event.details.address}</div></div>`,
            );
            infoWindowRef.current?.open({ map, anchor: marker });
          });

          bounds.extend(location.coordinates);
          return marker;
        });

        map.fitBounds(bounds, 80);
      } catch (error) {
        if (cancelled) return;
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
    if (!selectedLocation || !mapRef.current || !window.google?.maps) return;
    mapRef.current.panTo(selectedLocation.coordinates);
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom?.() ?? 10, 10));
  }, [selectedLocation]);

  return (
    <div className="space-y-5 safe-top lg:px-6 lg:pb-6">
      <div className="px-4 pt-4 lg:px-0 lg:pt-6">
        <SocialPageHero
          eyebrow="Mapa ao vivo"
          title="Explore os pontos quentes da sua rede"
          subtitle="A mesma atmosfera da home agora guia a descoberta no mapa: eventos, locais e rotas de acesso aparecem com destaque claro, sem alterar o fundo global."
          action={
            <div className="hidden h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/10 bg-black/55 text-white md:flex">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
          }
          footer={
            <div className="grid gap-3 md:grid-cols-3">
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Eventos localizados</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">{locations.length}</p>
                <p className="mt-1 text-xs text-white/45">Pontos com endereco valido no mapa.</p>
              </div>
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">Catalogo</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">{events.length}</p>
                <p className="mt-1 text-xs text-white/45">Eventos carregados para descoberta e navegacao.</p>
              </div>
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Status</p>
                <p className="mt-3 text-lg font-bold text-white">{errorMessage ? "Configurar Google Maps" : isMapBooting ? "Sincronizando mapa" : "Mapa pronto"}</p>
                <p className="mt-1 text-xs text-white/45">Selecione um evento para focar, abrir detalhes ou navegar.</p>
              </div>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 px-4 lg:px-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-black/60 shadow-[0_28px_80px_-48px_rgba(0,0,0,1)] backdrop-blur-2xl">
          <div className="relative min-h-[26rem] sm:min-h-[32rem]">
            <div ref={mapContainerRef} className="absolute inset-0" />
            {isMapBooting ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
                </div>
                <p className="text-sm font-medium text-white">{statusMessage}</p>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-6 text-center">
                <div className="max-w-sm space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <MapPin className="h-8 w-8 text-white/30" />
                  </div>
                  <p className="text-sm font-medium text-white">{errorMessage}</p>
                  <p className="text-[11px] text-white/45">
                    Confira a chave `VITE_GOOGLE_MAPS_API_KEY` e as restricoes de origem no Google Cloud.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="nocturne-panel p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Mapa vivo</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="nocturne-kpi p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Eventos localizados</p>
                <p className="mt-2 text-2xl font-semibold text-white">{locations.length}</p>
              </div>
              <div className="nocturne-kpi p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Catalogo</p>
                <p className="mt-2 text-2xl font-semibold text-white">{events.length}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[11px] leading-5 text-white/50">
              {isLoading ? "Sincronizando catalogo..." : "Clique em um evento para focar no mapa e abrir a rota de detalhes."}
            </div>
          </div>

          <div className="nocturne-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Eventos no mapa</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Locais publicados</h2>
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
                          ? "border-primary/30 bg-primary/10"
                          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{location.event.title}</p>
                          <p className="mt-1 text-xs text-white/45">
                            {location.event.venueName} - {location.event.city}
                          </p>
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35">
                          <Navigation className="h-4 w-4 text-primary" />
                        </div>
                      </div>

                      <p className="mt-3 text-[11px] leading-5 text-white/50">{location.event.details.address}</p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                          {location.event.weekday} - {location.event.day} {location.event.month}
                        </span>
                        <Link
                          to={`/eventos/${location.event.slug}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-white"
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          Ver evento
                        </Link>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="nocturne-empty-state flex min-h-[14rem] flex-col items-center justify-center gap-3 px-4 py-12">
                  <MapPin className="h-8 w-8 text-white/25" />
                  <p className="text-sm font-medium text-white/60">Nenhum evento com localizacao valida encontrado</p>
                  <p className="max-w-xs text-[11px] text-white/40">
                    Assim que houver eventos com endereco geocodificavel, eles aparecem aqui automaticamente.
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
