import type { EventSeat, EventSeatMap, EventSeatSection, EventSeatStatus, EventSeatTag } from "@/data/events";

type SectionTone = EventSeatSection["tone"];

const DEFAULT_SECTION_TONES: SectionTone[] = ["orange", "slate", "emerald", "violet"];
const ACCESSIBLE_TAGS: EventSeatTag[] = ["wheelchair", "low-vision", "reduced-mobility"];

export interface ByintiImportedSection {
  id: string;
  sourceId: string;
  sourceName: string;
  name: string;
  shortLabel: string;
  seatCount: number;
  availableSeatCount: number;
  mapArea?: EventSeatSection["mapArea"];
}

export interface ByintiSeatMapImportDraft {
  source: "byinti-svg";
  hallName: string;
  stageLabel: string;
  viewport: NonNullable<EventSeatMap["viewport"]>;
  sections: ByintiImportedSection[];
  seats: EventSeat[];
  warnings: string[];
}

export interface ByintiSectionPricingRule {
  sectionId: string;
  price: number;
  tone: SectionTone;
  name?: string;
  shortLabel?: string;
  description?: string;
}

type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const normalizeToken = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createSectionId = (value: string, fallbackIndex: number) => normalizeToken(value) || `setor-${fallbackIndex + 1}`;

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const prettifySectionName = (value: string) =>
  toTitleCase(
    value
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

const abbreviateSectionName = (value: string) => {
  const cleanValue = value.trim();
  if (cleanValue.length <= 18) {
    return cleanValue;
  }

  return cleanValue
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 8);
};

const getNumericAttribute = (element: Element, attributeName: string) => {
  const rawValue = element.getAttribute(attributeName);
  if (!rawValue) {
    return null;
  }

  const numericValue = Number(rawValue.replace(/[^\d.-]+/g, ""));
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getViewport = (svg: Element) => {
  const width = getNumericAttribute(svg, "width") ?? getNumericAttribute(svg, "viewBox") ?? 1600;
  const height = getNumericAttribute(svg, "height") ?? 1000;

  return {
    width,
    height,
  };
};

const parsePathBoundingBox = (pathData: string | null): BoundingBox | null => {
  if (!pathData) {
    return null;
  }

  const numbers = Array.from(pathData.matchAll(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi), (match) => Number(match[0])).filter(
    (value) => Number.isFinite(value),
  );

  if (numbers.length < 2) {
    return null;
  }

  const xs: number[] = [];
  const ys: number[] = [];

  for (let index = 0; index < numbers.length - 1; index += 2) {
    xs.push(numbers[index]);
    ys.push(numbers[index + 1]);
  }

  if (xs.length === 0 || ys.length === 0) {
    return null;
  }

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
};

const toMapArea = (boundingBox: BoundingBox | null): EventSeatSection["mapArea"] | undefined => {
  if (!boundingBox) {
    return undefined;
  }

  return {
    kind: "block",
    x: boundingBox.minX,
    y: boundingBox.minY,
    width: Math.max(1, boundingBox.maxX - boundingBox.minX),
    height: Math.max(1, boundingBox.maxY - boundingBox.minY),
    labelX: boundingBox.minX + (boundingBox.maxX - boundingBox.minX) / 2,
    labelY: boundingBox.minY + (boundingBox.maxY - boundingBox.minY) / 2,
  };
};

const toSeatPosition = (boundingBox: BoundingBox | null): EventSeat["position"] | undefined => {
  if (!boundingBox) {
    return undefined;
  }

  return {
    x: boundingBox.minX + (boundingBox.maxX - boundingBox.minX) / 2,
    y: boundingBox.minY + (boundingBox.maxY - boundingBox.minY) / 2,
  };
};

const splitTooltip = (tooltip: string | null) =>
  (tooltip ?? "")
    .split(/\(br\)|<br\s*\/?>|\r?\n/gi)
    .map((part) => part.trim())
    .filter(Boolean);

const inferSeatTags = (parts: string[]) => {
  const searchableText = parts
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const tags: EventSeatTag[] = [];

  if (searchableText.includes("visao parcial")) {
    tags.push("partial-view");
  }

  if (searchableText.includes("cadeirante")) {
    tags.push("wheelchair");
  }

  if (searchableText.includes("baixa visao")) {
    tags.push("low-vision");
  }

  if (searchableText.includes("mobilidade reduzida")) {
    tags.push("reduced-mobility");
  }

  if (searchableText.includes("obeso") || searchableText.includes("plus size") || searchableText.includes("assento ampliado")) {
    tags.push("plus-size");
  }

  return tags;
};

const inferSeatStatus = (element: Element, tags: EventSeatTag[]): EventSeatStatus => {
  const available = element.getAttribute("data-available");
  const inCart = element.getAttribute("data-in-cart");
  const locked = element.getAttribute("data-locked") === "true";
  const hasAccessibleTag = tags.some((tag) => ACCESSIBLE_TAGS.includes(tag));

  if (inCart === "1") {
    return "reserved";
  }

  if (available === "1") {
    return hasAccessibleTag ? "accessible" : "available";
  }

  if (locked || available === "0") {
    return "sold";
  }

  return hasAccessibleTag ? "accessible" : "available";
};

const parseSeatLabel = (rawLabel: string, seatIndex: number) => {
  const cleanLabel = rawLabel.trim();
  const primaryMatch = cleanLabel.match(/^(.+?)-(\d+)$/);
  if (primaryMatch) {
    return {
      row: primaryMatch[1].trim(),
      number: Number(primaryMatch[2]),
      label: cleanLabel,
    };
  }

  const fallbackNumber = Number(cleanLabel.match(/(\d+)/)?.[1] ?? seatIndex + 1);
  const fallbackRow = cleanLabel.replace(/\d+/g, "").replace(/[-\s]+$/g, "").trim() || "S";

  return {
    row: fallbackRow,
    number: Number.isFinite(fallbackNumber) ? fallbackNumber : seatIndex + 1,
    label: cleanLabel || `${fallbackRow}-${fallbackNumber}`,
  };
};

const createSeatId = (rawId: string | null, fallbackIndex: number) => {
  const cleanId = rawId?.trim();
  return cleanId && cleanId.length > 0 ? cleanId : `seat-${fallbackIndex + 1}`;
};

const getTextContent = (element: Element | null | undefined) => element?.textContent?.replace(/\s+/g, " ").trim() ?? "";

const getSectionDisplayName = (sectionRoot: Element | null, sourceName: string) => {
  if (!sectionRoot) {
    return prettifySectionName(sourceName);
  }

  const textNodes = Array.from(sectionRoot.querySelectorAll("text"))
    .map((node) => getTextContent(node))
    .filter((text) => text.length > 1 && !/\d+\/\d+/.test(text) && !/assentos disponiveis/i.test(text));

  return textNodes[0] ?? prettifySectionName(sourceName);
};

const ensureParser = () => {
  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser nao esta disponivel neste ambiente.");
  }

  return new DOMParser();
};

const getSvgRoot = (markup: string) => {
  const parser = ensureParser();
  const htmlDocument = parser.parseFromString(markup, "text/html");
  const htmlSvg = htmlDocument.querySelector("#MapRender") ?? htmlDocument.querySelector("svg");

  if (htmlSvg) {
    return { document: htmlDocument, svg: htmlSvg };
  }

  const svgDocument = parser.parseFromString(markup, "image/svg+xml");
  if (svgDocument.documentElement?.tagName.toLowerCase() === "svg") {
    return { document: svgDocument, svg: svgDocument.documentElement };
  }

  throw new Error("Nao encontrei um <svg> valido no markup informado.");
};

const countAvailableSeats = (seats: EventSeat[]) => seats.filter((seat) => seat.status === "available" || seat.status === "accessible").length;

export const parseByintiSeatMapMarkup = (markup: string): ByintiSeatMapImportDraft => {
  if (!markup.trim()) {
    throw new Error("Cole o HTML ou SVG do mapa antes de importar.");
  }

  const { document, svg } = getSvgRoot(markup);
  const seatGroups = Array.from(svg.querySelectorAll("[data-seatgroup]"));

  if (seatGroups.length === 0) {
    throw new Error("Nenhum grupo de assentos foi encontrado no markup.");
  }

  const hallName = getTextContent(document.querySelector(".q-toolbar-title")) || "Mapa importado";
  const stageLabel = getTextContent(svg.querySelector('g[id^="PALCO"] text')) || "Palco";
  const viewport = getViewport(svg);
  const sections: ByintiImportedSection[] = [];
  const seats: EventSeat[] = [];
  const warnings: string[] = [];
  const seenSectionIds = new Set<string>();
  const seenSeatIds = new Set<string>();

  seatGroups.forEach((seatGroup, sectionIndex) => {
    const sourceName = seatGroup.getAttribute("data-seatgroup")?.trim() || seatGroup.getAttribute("id")?.trim() || `Setor ${sectionIndex + 1}`;
    let sectionId = createSectionId(sourceName, sectionIndex);

    while (seenSectionIds.has(sectionId)) {
      sectionId = `${sectionId}-${sectionIndex + 1}`;
    }

    seenSectionIds.add(sectionId);

    const sectionRoot =
      Array.from(svg.querySelectorAll("g")).find((element) => element.getAttribute("id") === sourceName) ?? seatGroup.closest("g");

    const sectionSeats = Array.from(seatGroup.querySelectorAll("[data-seat-id]"));
    if (sectionSeats.length === 0) {
      warnings.push(`O setor ${sourceName} foi detectado sem assentos validos.`);
      return;
    }

    const importedSectionName = getSectionDisplayName(sectionRoot, sourceName);
    const importedSeats = sectionSeats.map((seatElement, seatIndex) => {
      const tooltipParts = splitTooltip(seatElement.getAttribute("data-tooltip"));
      const rawSeatLabel = tooltipParts[tooltipParts.length - 1] ?? seatElement.getAttribute("id") ?? `Assento ${seatIndex + 1}`;
      const areaLabel = tooltipParts[1] ?? importedSectionName;
      const seatTags = inferSeatTags(tooltipParts);
      const seatBox = parsePathBoundingBox(seatElement.getAttribute("d"));
      const parsedSeatLabel = parseSeatLabel(rawSeatLabel, seatIndex);

      let seatId = createSeatId(seatElement.getAttribute("data-seat-id"), seatIndex);
      while (seenSeatIds.has(seatId)) {
        seatId = `${seatId}-${seatIndex + 1}`;
      }

      seenSeatIds.add(seatId);

      return {
        id: seatId,
        label: parsedSeatLabel.label,
        row: parsedSeatLabel.row,
        number: parsedSeatLabel.number,
        sectionId,
        status: inferSeatStatus(seatElement, seatTags),
        area: areaLabel,
        tags: seatTags.length > 0 ? seatTags : undefined,
        position: toSeatPosition(seatBox),
      } satisfies EventSeat;
    });

    const areaPath = sectionRoot?.querySelector('[data-sectorarea="true"]');
    sections.push({
      id: sectionId,
      sourceId: sourceName,
      sourceName,
      name: importedSectionName,
      shortLabel: abbreviateSectionName(importedSectionName),
      seatCount: importedSeats.length,
      availableSeatCount: countAvailableSeats(importedSeats),
      mapArea: toMapArea(parsePathBoundingBox(areaPath?.getAttribute("d") ?? null)),
    });

    seats.push(...importedSeats);
  });

  if (sections.length === 0 || seats.length === 0) {
    throw new Error("O parser nao conseguiu montar setores e assentos a partir do markup informado.");
  }

  return {
    source: "byinti-svg",
    hallName,
    stageLabel,
    viewport,
    sections,
    seats,
    warnings,
  };
};

export const createDefaultSectionPricingRules = (
  draft: ByintiSeatMapImportDraft,
  basePrice = 150,
): ByintiSectionPricingRule[] =>
  draft.sections.map((section, index) => ({
    sectionId: section.id,
    price: basePrice,
    tone: DEFAULT_SECTION_TONES[index % DEFAULT_SECTION_TONES.length],
    name: section.name,
    shortLabel: section.shortLabel,
  }));

export const buildSeatMapFromByintiImport = (
  draft: ByintiSeatMapImportDraft,
  rules: ByintiSectionPricingRule[],
): EventSeatMap => {
  const rulesBySectionId = new Map(rules.map((rule) => [rule.sectionId, rule]));
  const sections = draft.sections.map((section, index) => {
    const sectionRule = rulesBySectionId.get(section.id);

    return {
      id: section.id,
      name: sectionRule?.name?.trim() || section.name,
      shortLabel: sectionRule?.shortLabel?.trim() || section.shortLabel,
      price: sectionRule?.price ?? 0,
      tone: sectionRule?.tone ?? DEFAULT_SECTION_TONES[index % DEFAULT_SECTION_TONES.length],
      description: sectionRule?.description?.trim() || undefined,
      mapArea: section.mapArea,
    } satisfies EventSeatSection;
  });

  return {
    hallName: draft.hallName,
    stageLabel: draft.stageLabel,
    sections,
    seats: draft.seats,
    notes: [
      "Mapa importado de SVG/HTML hidratado.",
      "Preco aplicado por regra de setor.",
      ...draft.warnings,
    ],
    variant: "theater",
    viewport: draft.viewport,
  };
};

export const countAccessibleSeats = (seatMap: EventSeatMap) =>
  seatMap.seats.filter(
    (seat) =>
      seat.status === "accessible" ||
      seat.tags?.some((tag) => tag === "wheelchair" || tag === "low-vision" || tag === "reduced-mobility"),
  ).length;

export const countPartialViewSeats = (seatMap: EventSeatMap) =>
  seatMap.seats.filter((seat) => seat.tags?.includes("partial-view")).length;
