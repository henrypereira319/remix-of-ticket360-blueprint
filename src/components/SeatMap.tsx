import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Accessibility, Check, CircleDot, Eye, Info, Minus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { EventSeat, EventSeatMap, EventSeatSection, EventSeatTag } from "@/data/events";
import { formatCurrency } from "@/lib/ticketing";

interface SeatMapProps {
  seatMap: EventSeatMap;
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
  immersive?: boolean;
  fullBleed?: boolean;
}

const toneClasses = {
  orange: {
    badge: "bg-primary text-primary-foreground",
    seat: "bg-primary/10 text-foreground hover:bg-primary/20",
  },
  slate: {
    badge: "bg-foreground text-card",
    seat: "bg-muted text-foreground hover:bg-secondary",
  },
  emerald: {
    badge: "bg-emerald-600 text-white",
    seat: "bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  },
  violet: {
    badge: "bg-violet-600 text-white",
    seat: "bg-violet-50 text-violet-900 hover:bg-violet-100",
  },
} as const;

const boardToneStyles = {
  orange: {
    fill: "rgba(249, 115, 22, 0.13)",
    stroke: "rgba(249, 115, 22, 0.42)",
    text: "#9a3412",
  },
  slate: {
    fill: "rgba(71, 85, 105, 0.13)",
    stroke: "rgba(51, 65, 85, 0.38)",
    text: "#1e293b",
  },
  emerald: {
    fill: "rgba(16, 185, 129, 0.12)",
    stroke: "rgba(5, 150, 105, 0.35)",
    text: "#065f46",
  },
  violet: {
    fill: "rgba(139, 92, 246, 0.12)",
    stroke: "rgba(124, 58, 237, 0.35)",
    text: "#5b21b6",
  },
} as const;

const fullBleedBoardToneStyles = {
  orange: {
    fill: "rgba(249, 115, 22, 0.16)",
    stroke: "rgba(194, 65, 12, 0.68)",
    text: "#9a3412",
  },
  slate: {
    fill: "rgba(71, 85, 105, 0.13)",
    stroke: "rgba(30, 41, 59, 0.62)",
    text: "#0f172a",
  },
  emerald: {
    fill: "rgba(16, 185, 129, 0.15)",
    stroke: "rgba(4, 120, 87, 0.62)",
    text: "#065f46",
  },
  violet: {
    fill: "rgba(139, 92, 246, 0.15)",
    stroke: "rgba(109, 40, 217, 0.64)",
    text: "#5b21b6",
  },
} as const;

const selectableStatuses = new Set(["available", "accessible"]);

const seatTagLabels: Record<EventSeatTag, string> = {
  "partial-view": "Visao parcial",
  wheelchair: "Cadeirante",
  "low-vision": "Baixa visao",
  "reduced-mobility": "Mobilidade reduzida",
  "plus-size": "Assento ampliado",
};

const statusLabels = {
  available: "Disponivel",
  accessible: "Acessivel",
  reserved: "Reservado",
  sold: "Indisponivel",
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getSeatDisplayLabel = (seat: EventSeat) => {
  if (!seat.label.includes("-")) {
    return seat.label;
  }

  return seat.label.split("-").slice(1).join("-");
};

const getSeatStatusClassName = (seat: EventSeat, section: EventSeatSection) => {
  if (seat.status === "sold") {
    return "border border-transparent bg-muted text-muted-foreground line-through";
  }

  if (seat.status === "reserved") {
    return "border border-amber-300 bg-amber-100 text-amber-900";
  }

  if (seat.status === "accessible") {
    return "border border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100";
  }

  return `border border-border/50 ${toneClasses[section.tone].seat}`;
};

const buildSeatTooltip = (seat: EventSeat, section: EventSeatSection) => {
  const tags = seat.tags?.map((tag) => seatTagLabels[tag]).join(", ");

  return [section.name, seat.area, `Assento ${seat.label}`, tags].filter(Boolean).join(" | ");
};

const getSectionMetrics = (seatMap: EventSeatMap, sectionId: string) => {
  const sectionSeats = seatMap.seats.filter((seat) => seat.sectionId === sectionId);
  const availableSeats = sectionSeats.filter((seat) => selectableStatuses.has(seat.status)).length;

  return {
    capacity: sectionSeats.length,
    availableSeats,
  };
};

const createFanPath = (area: NonNullable<EventSeatSection["mapArea"]>) => {
  const topY = area.y + area.height * 0.16;

  return [
    `M ${area.x} ${topY}`,
    `Q ${area.x + area.width / 2} ${area.y - area.height * 0.16} ${area.x + area.width} ${topY}`,
    `L ${area.x + area.width * 0.9} ${area.y + area.height}`,
    `Q ${area.x + area.width / 2} ${area.y + area.height * 1.06} ${area.x + area.width * 0.1} ${area.y + area.height}`,
    "Z",
  ].join(" ");
};

const createArcBandPath = (area: NonNullable<EventSeatSection["mapArea"]>) => {
  const topCurveY = area.y + area.height * 0.08;
  const innerCurveY = area.y + area.height * 0.34;
  const bottomY = area.y + area.height;

  return [
    `M ${area.x + area.width * 0.06} ${bottomY}`,
    `Q ${area.x + area.width / 2} ${topCurveY} ${area.x + area.width * 0.94} ${bottomY}`,
    `L ${area.x + area.width * 0.78} ${bottomY}`,
    `Q ${area.x + area.width / 2} ${innerCurveY} ${area.x + area.width * 0.22} ${bottomY}`,
    "Z",
  ].join(" ");
};

const getSectionBackdropOpacity = (focusedSectionId: string | null, sectionId: string) =>
  !focusedSectionId || focusedSectionId === sectionId ? 1 : 0.22;

const SeatMap = ({
  seatMap,
  selectedSeatIds,
  onToggleSeat,
  immersive = false,
  fullBleed = false,
}: SeatMapProps) => {
  const theaterLayout = seatMap.variant === "theater";
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [inspectedSeatId, setInspectedSeatId] = useState<string | null>(null);
  const fullBleedViewportRef = useRef<HTMLDivElement | null>(null);
  const [fullBleedFrameSize, setFullBleedFrameSize] = useState({ width: 0, height: 0 });

  const visibleSections = focusedSectionId
    ? seatMap.sections.filter((section) => section.id === focusedSectionId)
    : seatMap.sections;

  const featuredSeat =
    seatMap.seats.find((seat) => seat.id === inspectedSeatId) ??
    seatMap.seats.find((seat) => seat.id === selectedSeatIds[selectedSeatIds.length - 1]);

  const featuredSection = featuredSeat
    ? seatMap.sections.find((section) => section.id === featuredSeat.sectionId) ?? null
    : null;

  const denseTheaterMap = theaterLayout && seatMap.seats.length > 400;
  const seatButtonSize = theaterLayout
    ? clamp((denseTheaterMap ? 14 : 44) + zoomLevel * (denseTheaterMap ? 4 : 6), denseTheaterMap ? 10 : 34, denseTheaterMap ? 34 : 72)
    : clamp(40 + zoomLevel * 6, 34, 72);
  const viewport = seatMap.viewport ?? { width: 1000, height: 760 };
  const theaterSeatFontSize = seatButtonSize >= 28 ? "9px" : seatButtonSize >= 20 ? "8px" : "7px";
  const hasPartialViewSeats = seatMap.seats.some((seat) => seat.tags?.includes("partial-view"));
  const hasReducedMobilitySeats = seatMap.seats.some((seat) => seat.tags?.includes("reduced-mobility"));
  const hasExpandedSeats = seatMap.seats.some((seat) => seat.tags?.includes("plus-size"));
  const hasAccessibilityTags = seatMap.seats.some((seat) =>
    seat.tags?.some((tag) => tag === "wheelchair" || tag === "low-vision" || tag === "reduced-mobility"),
  );
  const selectedCount = selectedSeatIds.length;
  const selectableSeatCount = seatMap.seats.filter((seat) => selectableStatuses.has(seat.status)).length;
  const shouldRenderDenseSeatLabels = !denseTheaterMap || Boolean(focusedSectionId) || zoomLevel >= 2;
  const useFullBleedTheater = theaterLayout && fullBleed;
  const availableFrameWidth = Math.max(fullBleedFrameSize.width - 64, 320);
  const availableFrameHeight = Math.max(fullBleedFrameSize.height - 176, 280);
  const fitScale = Math.min(availableFrameWidth / viewport.width, availableFrameHeight / viewport.height);
  const fullBleedScale = clamp(Number.isFinite(fitScale) ? fitScale : 1, 0.42, 1.1);

  useEffect(() => {
    if (!useFullBleedTheater) {
      return;
    }

    const frame = fullBleedViewportRef.current;

    if (!frame) {
      return;
    }

    const updateFrameSize = () => {
      const nextWidth = frame.clientWidth;
      const nextHeight = frame.clientHeight;

      setFullBleedFrameSize((currentSize) =>
        currentSize.width === nextWidth && currentSize.height === nextHeight
          ? currentSize
          : { width: nextWidth, height: nextHeight },
      );
    };

    updateFrameSize();

    const observer = new ResizeObserver(() => {
      updateFrameSize();
    });

    observer.observe(frame);

    return () => {
      observer.disconnect();
    };
  }, [useFullBleedTheater]);

  const renderSectionBackdrop = (section: EventSeatSection) => {
    if (!section.mapArea) {
      return null;
    }

    const tone = useFullBleedTheater ? fullBleedBoardToneStyles[section.tone] : boardToneStyles[section.tone];
    const opacity = getSectionBackdropOpacity(focusedSectionId, section.id);
    const strokeWidth = useFullBleedTheater ? 4 : 3;

    if (section.mapArea.kind === "fan") {
      return (
        <g key={section.id} opacity={opacity}>
          <path d={createFanPath(section.mapArea)} fill={tone.fill} stroke={tone.stroke} strokeWidth={strokeWidth} />
        </g>
      );
    }

    if (section.mapArea.kind === "arc-band") {
      return (
        <g key={section.id} opacity={opacity}>
          <path d={createArcBandPath(section.mapArea)} fill={tone.fill} stroke={tone.stroke} strokeWidth={strokeWidth} />
        </g>
      );
    }

    if (section.mapArea.kind === "paired-boxes") {
      const leftX = section.mapArea.x;
      const width = section.mapArea.width * (section.mapArea.boxWidthRatio ?? 0.16);
      const rightX = section.mapArea.x + section.mapArea.width - width;

      return (
        <g key={section.id} opacity={opacity}>
          <rect
            x={leftX}
            y={section.mapArea.y}
            width={width}
            height={section.mapArea.height}
            rx={28}
            fill={tone.fill}
            stroke={tone.stroke}
            strokeWidth={strokeWidth}
          />
          <rect
            x={rightX}
            y={section.mapArea.y}
            width={width}
            height={section.mapArea.height}
            rx={28}
            fill={tone.fill}
            stroke={tone.stroke}
            strokeWidth={strokeWidth}
          />
        </g>
      );
    }

    return (
      <rect
        key={section.id}
        x={section.mapArea.x}
        y={section.mapArea.y}
        width={section.mapArea.width}
        height={section.mapArea.height}
        rx={28}
        fill={tone.fill}
        stroke={tone.stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  };

  const renderTheaterCanvas = (className: string, style?: CSSProperties) => (
    <div className={className} style={style}>
      <div className="absolute inset-x-[14%] top-[5%] z-10 rounded-b-[2rem] border border-border/60 bg-foreground px-6 py-4 text-center text-card shadow-lg">
        <p className="text-[11px] uppercase tracking-[0.28em] text-card/70">Palco</p>
        <p className="mt-1 text-sm font-medium text-card">{seatMap.stageLabel}</p>
      </div>

      <svg
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="stage-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        <path
          d={`M 180 86 Q ${viewport.width / 2} 14 820 86 L 754 140 Q ${viewport.width / 2} 96 246 140 Z`}
          fill={useFullBleedTheater ? "rgba(15, 23, 42, 0.08)" : "rgba(15, 23, 42, 0.12)"}
          stroke={useFullBleedTheater ? "rgba(15, 23, 42, 0.26)" : "rgba(15, 23, 42, 0.16)"}
          strokeWidth={useFullBleedTheater ? 3 : 2}
        />
        <path
          d={`M 180 86 Q ${viewport.width / 2} 14 820 86`}
          fill="none"
          stroke={useFullBleedTheater ? "rgba(15, 23, 42, 0.45)" : "rgba(15, 23, 42, 0.25)"}
          strokeWidth={useFullBleedTheater ? 4 : 3}
        />

        {seatMap.sections.map((section) => renderSectionBackdrop(section))}
      </svg>

      {!useFullBleedTheater
        ? seatMap.sections
            .filter((section) => section.mapArea)
            .map((section) => {
              const mapArea = section.mapArea!;
              const opacity = getSectionBackdropOpacity(focusedSectionId, section.id);
              const tone = boardToneStyles[section.tone];

              return (
                <button
                  key={`${section.id}-label`}
                  type="button"
                  aria-pressed={focusedSectionId === section.id}
                  onClick={() =>
                    setFocusedSectionId((currentSectionId) => (currentSectionId === section.id ? null : section.id))
                  }
                  className="absolute z-20 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur transition-transform hover:scale-[1.02]"
                  style={{
                    left: `${((mapArea.labelX ?? mapArea.x + mapArea.width / 2) / viewport.width) * 100}%`,
                    top: `${((mapArea.labelY ?? mapArea.y + 18) / viewport.height) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    opacity,
                    color: tone.text,
                  }}
                >
                  {section.shortLabel}
                </button>
              );
            })
        : null}

      <div className="absolute inset-0 z-30">
        {seatMap.seats.map((seat) => {
          if (!seat.position) {
            return null;
          }

          const section = seatMap.sections.find((item) => item.id === seat.sectionId);

          if (!section) {
            return null;
          }

          const isSelected = selectedSeatIds.includes(seat.id);
          const isSelectable = selectableStatuses.has(seat.status);
          const isInspected = featuredSeat?.id === seat.id;
          const isDimmed = Boolean(focusedSectionId && focusedSectionId !== section.id);
          const showSeatLabel =
            !theaterLayout || shouldRenderDenseSeatLabels || isSelected || isInspected || seatButtonSize >= 24;

          return (
            <button
              key={seat.id}
              type="button"
              title={buildSeatTooltip(seat, section)}
              aria-label={`${section.name} Assento ${seat.label}${seat.area ? ` - ${seat.area}` : ""}`}
              disabled={!isSelectable}
              onMouseEnter={() => setInspectedSeatId(seat.id)}
              onFocus={() => setInspectedSeatId(seat.id)}
              onMouseLeave={() => setInspectedSeatId(null)}
              onClick={() => {
                setInspectedSeatId(seat.id);
                onToggleSeat(seat.id);
              }}
              className={[
                "absolute flex items-center justify-center rounded-full font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                getSeatStatusClassName(seat, section),
                isSelected && "border-foreground bg-foreground text-card hover:bg-foreground",
                isInspected && !isSelected && "ring-2 ring-primary/35",
                isDimmed && "opacity-35",
                !isSelectable && "cursor-not-allowed",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                left: `${(seat.position.x / viewport.width) * 100}%`,
                top: `${(seat.position.y / viewport.height) * 100}%`,
                width: `${seatButtonSize}px`,
                height: `${seatButtonSize}px`,
                fontSize: theaterSeatFontSize,
                transform: `translate(-50%, -50%) rotate(${seat.position.rotation ?? 0}deg)`,
              }}
            >
              {showSeatLabel ? getSeatDisplayLabel(seat) : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderTheaterBlueprint = () => (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-border bg-background p-4 shadow-sm">
        {renderTheaterCanvas(
          "relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(248,250,252,0.98)_35%,_rgba(241,245,249,1)_100%)]",
          { aspectRatio: `${viewport.width} / ${viewport.height}` },
        )}

        <div className="mt-4 rounded-2xl border border-border/70 bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Leitura do mapa</p>
          <p className="mt-2 text-sm leading-6 text-foreground">
            A planta destaca frisas laterais, anfiteatro superior e plateia central, seguindo a referencia do
            Theatro Municipal para a etapa 2D antes da evolucao 3D. O checkout fica liberado apenas depois da leitura
            do mapa e da selecao dos lugares.
          </p>
        </div>
      </div>

      {immersive ? (
        <div className="flex flex-wrap gap-2">
          {visibleSections.map((section) => {
            const metrics = getSectionMetrics(seatMap, section.id);

            return (
              <span
                key={section.id}
                className="rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground"
              >
                {section.shortLabel} {formatCurrency(section.price)} | {metrics.availableSeats}/{metrics.capacity}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {visibleSections.map((section) => {
            const metrics = getSectionMetrics(seatMap, section.id);
            const tone = toneClasses[section.tone];

            return (
              <div key={section.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>
                      {section.shortLabel}
                    </span>
                    <h4 className="mt-3 text-lg font-semibold text-foreground">{section.name}</h4>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">A partir de</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(section.price)}</p>
                  </div>
                </div>

                {section.description ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.description}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground">
                    {metrics.availableSeats} livres
                  </span>
                  <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground">
                    {metrics.capacity} totais
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderFullBleedLegend = () => (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
        {selectedCount} selecionado(s)
      </span>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
        {selectableSeatCount} disponiveis
      </span>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
        Acessivel
      </span>
      {hasPartialViewSeats ? (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
          Visao parcial
        </span>
      ) : null}
      {hasReducedMobilitySeats ? (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
          Mobilidade reduzida
        </span>
      ) : null}
      {hasExpandedSeats ? (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
          Assento ampliado
        </span>
      ) : null}
    </div>
  );

  if (useFullBleedTheater) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(248,250,252,1)_52%,_rgba(241,245,249,1)_100%)]">
        <div ref={fullBleedViewportRef} className="absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: `${viewport.width}px`,
              height: `${viewport.height}px`,
              transform: `translate(-50%, -50%) scale(${fullBleedScale})`,
              transformOrigin: "center center",
            }}
          >
            {renderTheaterCanvas(
              "relative h-full w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(248,250,252,1)_38%,_rgba(241,245,249,1)_100%)] shadow-[0_24px_72px_rgba(148,163,184,0.22)]",
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute right-4 top-4 z-40 sm:right-6 sm:top-6">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/88 px-2 py-1 text-slate-900 shadow-xl backdrop-blur">
            <button
              type="button"
              aria-label="Diminuir mapa de assentos"
              onClick={() => setZoomLevel((currentZoom) => clamp(currentZoom - 1, -1, 3))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Zoom</span>
            <button
              type="button"
              aria-label="Aumentar mapa de assentos"
              onClick={() => setZoomLevel((currentZoom) => clamp(currentZoom + 1, -1, 3))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 p-4 sm:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="pointer-events-auto max-w-xl rounded-[1.75rem] border border-slate-200/90 bg-white/88 p-4 text-slate-900 shadow-xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assento em foco</p>

              {featuredSeat && featuredSection ? (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">Assento {featuredSeat.label}</p>
                      <p className="text-sm text-slate-600">
                        {featuredSection.name}
                        {featuredSeat.area ? ` | ${featuredSeat.area}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(featuredSection.price)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium">
                      {statusLabels[featuredSeat.status]}
                    </span>
                    {featuredSeat.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium"
                      >
                        {seatTagLabels[tag]}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Navegue pelo mapa, use os filtros de setor e selecione um assento para inspecionar a leitura de
                  disponibilidade, acessibilidade e preco.
                </p>
              )}
            </div>

            <div className="pointer-events-auto rounded-[1.75rem] border border-slate-200/90 bg-white/88 p-4 shadow-xl backdrop-blur">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Leitura rapida</p>
              {renderFullBleedLegend()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStandardSeatGrid = () => (
    <div className="grid gap-4 xl:grid-cols-2">
      {visibleSections.map((section) => {
        const sectionSeats = seatMap.seats.filter((seat) => seat.sectionId === section.id);
        const rows = [...new Set(sectionSeats.map((seat) => seat.row))];
        const seatsPerRow = Math.max(...sectionSeats.map((seat) => seat.number));
        const tone = toneClasses[section.tone];

        return (
          <div key={section.id} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>
                  {section.shortLabel}
                </span>
                <h4 className="mt-3 text-lg font-semibold text-foreground">{section.name}</h4>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">A partir de</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(section.price)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row) => {
                const rowSeats = sectionSeats.filter((seat) => seat.row === row);

                return (
                  <div key={`${section.id}-${row}`} className="grid grid-cols-[1.5rem_1fr] items-center gap-3">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">{row}</span>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${seatsPerRow}, minmax(0, 1fr))` }}>
                      {rowSeats.map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.id);
                        const isSelectable = selectableStatuses.has(seat.status);

                        return (
                          <button
                            key={seat.id}
                            type="button"
                            aria-label={`${section.name} Assento ${seat.label}`}
                            disabled={!isSelectable}
                            onClick={() => onToggleSeat(seat.id)}
                            className={[
                              "h-10 rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                              getSeatStatusClassName(seat, section),
                              isSelected && "border-foreground bg-foreground text-card hover:bg-foreground",
                              !isSelectable && "cursor-not-allowed",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {seat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={immersive ? "space-y-3" : "space-y-4"}>
      <Card className="overflow-hidden border-border bg-card">
        <div className="bg-foreground px-6 py-5 text-center text-card">
          <p className="text-xs uppercase tracking-[0.25em] text-card/70">{seatMap.hallName}</p>
          <h3 className="mt-2 font-display text-2xl font-semibold">{seatMap.stageLabel}</h3>
        </div>

        <CardContent className={immersive ? "space-y-4 p-4" : "space-y-5 p-5"}>
          <div className="space-y-4 rounded-xl border border-border bg-background p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {theaterLayout ? "Blueprint cenografico 2D" : "Navegacao do mapa"}
                </p>
                <h4 className="mt-2 text-lg font-semibold text-foreground">
                  {theaterLayout
                    ? "Mapa de sala em planta, pronto para evoluir para uma camada premium em 3D."
                    : "Selecione seus assentos e acompanhe os detalhes pelo painel do mapa."}
                </h4>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {theaterLayout
                    ? `${seatMap.seats.length} assentos mapeados nesta planta. Primeiro escolha no mapa, depois siga para o checkout.`
                    : "O mapa de sala e a etapa anterior ao checkout e centraliza a decisao dos lugares."}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-card px-2 py-1">
                <button
                  type="button"
                  aria-label="Diminuir mapa de assentos"
                  onClick={() => setZoomLevel((currentZoom) => clamp(currentZoom - 1, -1, 3))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Zoom</span>
                <button
                  type="button"
                  aria-label="Aumentar mapa de assentos"
                  onClick={() => setZoomLevel((currentZoom) => clamp(currentZoom + 1, -1, 3))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={focusedSectionId === null}
                onClick={() => setFocusedSectionId(null)}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  focusedSectionId === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                Todos os setores
              </button>

              {seatMap.sections.map((section) => {
                const metrics = getSectionMetrics(seatMap, section.id);

                return (
                  <button
                    key={section.id}
                    type="button"
                    aria-pressed={focusedSectionId === section.id}
                    onClick={() => setFocusedSectionId(section.id)}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      focusedSectionId === section.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {section.name} ({metrics.availableSeats}/{metrics.capacity})
                  </button>
                );
              })}
            </div>
          </div>

          {theaterLayout ? renderTheaterBlueprint() : renderStandardSeatGrid()}

          <div className={immersive ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"}>
            <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
              <Info className="h-4 w-4 text-primary" />
              {selectedCount} selecionado(s) de {selectableSeatCount} disponiveis
            </div>
            <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
              <CircleDot className="h-4 w-4 text-primary" />
              Disponivel
            </div>
            <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-foreground" />
              Selecionado
            </div>
            <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
              <Minus className="h-4 w-4 text-amber-700" />
              Reservado
            </div>
            <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
              <Accessibility className="h-4 w-4 text-violet-700" />
              Acessivel
            </div>
            {hasPartialViewSeats ? (
              <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
                <Eye className="h-4 w-4 text-slate-700" />
                Visao parcial
              </div>
            ) : null}
            {hasAccessibilityTags ? (
              <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
                <Info className="h-4 w-4 text-primary" />
                Recursos assistivos
              </div>
            ) : null}
            {hasReducedMobilitySeats ? (
              <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
                <Accessibility className="h-4 w-4 text-violet-700" />
                Mobilidade reduzida
              </div>
            ) : null}
            {hasExpandedSeats ? (
              <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground">
                <CircleDot className="h-4 w-4 text-emerald-700" />
                Assento ampliado
              </div>
            ) : null}
          </div>

          <div className={immersive ? "grid gap-4 lg:grid-cols-[1fr_1fr]" : "grid gap-4 lg:grid-cols-[0.9fr_1.1fr]"}>
            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assento em foco</p>

              {featuredSeat && featuredSection ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">Assento {featuredSeat.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {featuredSection.name}
                        {featuredSeat.area ? ` | ${featuredSeat.area}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(featuredSection.price)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground">
                      {statusLabels[featuredSeat.status]}
                    </span>
                    {featuredSeat.tags?.map((tag) => (
                      <span key={tag} className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground">
                        {seatTagLabels[tag]}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Passe o mouse, navegue pelo teclado ou selecione um assento para ver o contexto do setor, a faixa de
                  preco e marcadores especiais.
                </p>
              )}
            </div>

            {!immersive ? (
              <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Leitura do mapa</p>
                {seatMap.notes.map((note) => (
                  <p key={note} className="rounded-lg bg-card px-3 py-2 text-sm leading-6 text-muted-foreground">
                    {note}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Regras desta etapa</p>
                <p className="rounded-lg bg-card px-3 py-2 text-sm leading-6 text-muted-foreground">
                  Primeiro selecione os assentos no mapa. Depois desca para revisar categoria, beneficio e detalhes do ingresso.
                </p>
                <p className="rounded-lg bg-card px-3 py-2 text-sm leading-6 text-muted-foreground">
                  O QR final continua dependente da validacao administrativa e nao nasce nesta etapa de exploracao.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatMap;
