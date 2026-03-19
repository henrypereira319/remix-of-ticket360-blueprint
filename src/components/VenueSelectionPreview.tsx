import type { EventSeatMap, EventSeatSection } from "@/data/events";

interface VenueSelectionPreviewProps {
  seatMap: EventSeatMap;
  selectedSectionId: string | null;
  sectionMeta?: Record<string, { available: number; capacity: number }>;
  onSelectSection?: (sectionId: string) => void;
}

const toneStyles = {
  orange: { fill: "rgba(249, 115, 22, 0.18)", stroke: "rgba(194, 65, 12, 0.7)", label: "text-orange-900" },
  slate: { fill: "rgba(71, 85, 105, 0.18)", stroke: "rgba(30, 41, 59, 0.62)", label: "text-slate-800" },
  emerald: { fill: "rgba(16, 185, 129, 0.16)", stroke: "rgba(5, 150, 105, 0.62)", label: "text-emerald-900" },
  violet: { fill: "rgba(139, 92, 246, 0.16)", stroke: "rgba(109, 40, 217, 0.62)", label: "text-violet-900" },
} as const;

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

const getSectionOpacity = (selectedSectionId: string | null, sectionId: string) =>
  !selectedSectionId || selectedSectionId === sectionId ? 1 : 0.24;

const renderSectionShape = (section: EventSeatSection, selectedSectionId: string | null) => {
  if (!section.mapArea) {
    return null;
  }

  const area = section.mapArea;
  const tone = toneStyles[section.tone];
  const opacity = getSectionOpacity(selectedSectionId, section.id);
  const strokeWidth = selectedSectionId === section.id ? 4 : 2.5;

  if (area.kind === "fan") {
    return (
      <path
        key={section.id}
        d={createFanPath(area)}
        fill={tone.fill}
        stroke={tone.stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }

  if (area.kind === "arc-band") {
    return (
      <path
        key={section.id}
        d={createArcBandPath(area)}
        fill={tone.fill}
        stroke={tone.stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }

  if (area.kind === "paired-boxes") {
    const width = area.width * (area.boxWidthRatio ?? 0.16);
    const leftX = area.x;
    const rightX = area.x + area.width - width;

    return (
      <g key={section.id} opacity={opacity}>
        <rect x={leftX} y={area.y} width={width} height={area.height} rx={26} fill={tone.fill} stroke={tone.stroke} strokeWidth={strokeWidth} />
        <rect x={rightX} y={area.y} width={width} height={area.height} rx={26} fill={tone.fill} stroke={tone.stroke} strokeWidth={strokeWidth} />
      </g>
    );
  }

  return (
    <rect
      key={section.id}
      x={area.x}
      y={area.y}
      width={area.width}
      height={area.height}
      rx={26}
      fill={tone.fill}
      stroke={tone.stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
};

const VenueSelectionPreview = ({
  seatMap,
  selectedSectionId,
  sectionMeta = {},
  onSelectSection,
}: VenueSelectionPreviewProps) => {
  const viewport = seatMap.viewport ?? { width: 1000, height: 760 };
  const selectedSection = seatMap.sections.find((section) => section.id === selectedSectionId) ?? seatMap.sections[0] ?? null;
  const hasMapAreas = seatMap.sections.some((section) => section.mapArea);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visão da sala</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Prévia do venue com o setor selecionado em destaque, no mesmo papel visual que o Sympla usa antes da escolha fina dos assentos.
        </p>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(248,250,252,1)_45%,_rgba(241,245,249,1)_100%)] p-5">
        {seatMap.backgroundImage ? (
          <img
            src={seatMap.backgroundImage}
            alt={`Visão da sala ${seatMap.hallName}`}
            className="absolute inset-0 h-full w-full object-contain p-4"
            draggable={false}
          />
        ) : null}

        {hasMapAreas ? (
          <svg viewBox={`0 0 ${viewport.width} ${viewport.height}`} className="absolute inset-0 h-full w-full">
            {!seatMap.backgroundImage ? (
              <>
                <path
                  d={`M ${viewport.width * 0.18} ${viewport.height * 0.08} Q ${viewport.width / 2} ${viewport.height * 0.01} ${viewport.width * 0.82} ${viewport.height * 0.08} L ${viewport.width * 0.76} ${viewport.height * 0.14} Q ${viewport.width / 2} ${viewport.height * 0.1} ${viewport.width * 0.24} ${viewport.height * 0.14} Z`}
                  fill="rgba(15, 23, 42, 0.12)"
                  stroke="rgba(15, 23, 42, 0.25)"
                  strokeWidth="3"
                />
                <text
                  x={viewport.width / 2}
                  y={viewport.height * 0.12}
                  textAnchor="middle"
                  fontSize="22"
                  fontWeight="700"
                  fill="#0f172a"
                >
                  {seatMap.stageLabel}
                </text>
              </>
            ) : null}

            {seatMap.sections.map((section) => renderSectionShape(section, selectedSectionId))}
          </svg>
        ) : (
          <div className="relative flex h-full flex-col justify-center gap-4 px-6">
            <div className="rounded-[1.25rem] border border-slate-300 bg-slate-900 px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.22em] text-white">
              {seatMap.stageLabel}
            </div>

            {seatMap.sections.map((section) => {
              const isSelected = section.id === selectedSectionId;
              const tone = toneStyles[section.tone];

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSelectSection?.(section.id)}
                  className="rounded-[1.15rem] border px-4 py-4 text-left transition-transform hover:scale-[1.01]"
                  style={{
                    borderColor: isSelected ? tone.stroke : "rgba(148, 163, 184, 0.35)",
                    backgroundColor: isSelected ? tone.fill : "rgba(255,255,255,0.84)",
                    opacity: getSectionOpacity(selectedSectionId, section.id),
                  }}
                >
                  <p className={`text-sm font-semibold ${tone.label}`}>{section.name}</p>
                  <p className="mt-1 text-xs text-slate-600">Seleção por setor antes do mapa detalhado</p>
                </button>
              );
            })}
          </div>
        )}

        {hasMapAreas
          ? seatMap.sections
              .filter((section) => section.mapArea)
              .map((section) => {
                const area = section.mapArea!;
                const tone = toneStyles[section.tone];
                const opacity = getSectionOpacity(selectedSectionId, section.id);

                return (
                  <button
                    key={`${section.id}-label`}
                    type="button"
                    onClick={() => onSelectSection?.(section.id)}
                    className="absolute z-20 rounded-full border border-white/80 bg-white/92 px-3 py-1 text-xs font-semibold shadow-sm transition-transform hover:scale-[1.03]"
                    style={{
                      left: `${((area.labelX ?? area.x + area.width / 2) / viewport.width) * 100}%`,
                      top: `${((area.labelY ?? area.y + area.height / 2) / viewport.height) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      opacity,
                    }}
                  >
                    <span className={tone.label}>{section.shortLabel}</span>
                  </button>
                );
              })
          : null}

        {selectedSection ? (
          <div className="absolute inset-x-4 bottom-4 z-20 rounded-[1.25rem] border border-white/80 bg-white/94 px-4 py-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedSection.name}</p>
                <p className="text-xs text-slate-600">
                  {sectionMeta[selectedSection.id]?.available ?? 0} de {sectionMeta[selectedSection.id]?.capacity ?? 0} lugares liberados
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">A partir de R$ {selectedSection.price.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VenueSelectionPreview;
