import highlight1 from "@/assets/highlight-1.jpg";
import highlight2 from "@/assets/highlight-2.jpg";
import highlight3 from "@/assets/highlight-3.jpg";
import highlight4 from "@/assets/highlight-4.jpg";
import highlight5 from "@/assets/highlight-5.jpg";
import highlight6 from "@/assets/highlight-6.jpg";

import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";
import event4 from "@/assets/event-4.jpg";
import event5 from "@/assets/event-5.jpg";
import event6 from "@/assets/event-6.jpg";
import event7 from "@/assets/event-7.jpg";
import event8 from "@/assets/event-8.jpg";

export type EventSeatStatus = "available" | "reserved" | "sold" | "accessible";
export type EventSeatTag = "partial-view" | "wheelchair" | "low-vision" | "reduced-mobility" | "plus-size";

export interface EventSeatSection {
  id: string;
  name: string;
  shortLabel: string;
  price: number;
  tone: "orange" | "slate" | "emerald" | "violet";
  description?: string;
  mapArea?: {
    kind: "fan" | "paired-boxes" | "arc-band" | "block";
    x: number;
    y: number;
    width: number;
    height: number;
    labelX?: number;
    labelY?: number;
    boxWidthRatio?: number;
  };
}

export interface EventSeat {
  id: string;
  label: string;
  row: string;
  number: number;
  sectionId: string;
  status: EventSeatStatus;
  area?: string;
  tags?: EventSeatTag[];
  position?: {
    x: number;
    y: number;
    rotation?: number;
  };
}

export interface EventSeatMap {
  hallName: string;
  stageLabel: string;
  sections: EventSeatSection[];
  seats: EventSeat[];
  notes: string[];
  variant?: "standard" | "theater";
  viewport?: {
    width: number;
    height: number;
  };
}

export interface EventDetailsContent {
  organizer: string;
  address: string;
  openingTime: string;
  ageRating: string;
  agePolicy: string;
  paymentInfo: string;
  salesInfo: string;
  infoParagraphs: string[];
  importantNotice: string;
  ticketPolicies: string[];
}

export interface EventData {
  id: string;
  slug: string;
  title: string;
  image: string;
  bannerImage: string;
  month: string;
  day: string;
  weekday: string;
  time: string;
  city: string;
  venueName: string;
  venueIcon?: string;
  summary: string;
  description: string;
  priceFrom: number;
  securityNotes: string[];
  seatMap: EventSeatMap;
  details: EventDetailsContent;
}

export interface HighlightData {
  id: string;
  title: string;
  image: string;
  href: string;
}

export interface BannerData {
  id: string;
  title: string;
  image: string;
  href: string;
}

type EventDetailsOverrides = Pick<EventDetailsContent, "organizer" | "address" | "openingTime"> &
  Partial<Omit<EventDetailsContent, "organizer" | "address" | "openingTime">>;

type EventSeed = Omit<EventData, "details"> & {
  detailsOverrides: EventDetailsOverrides;
};

const seatSections: EventSeatSection[] = [
  { id: "premium", name: "Premium", shortLabel: "Premium", price: 260, tone: "orange" },
  { id: "plateia-a", name: "Plateia A", shortLabel: "Plateia A", price: 190, tone: "slate" },
  { id: "plateia-b", name: "Plateia B", shortLabel: "Plateia B", price: 170, tone: "emerald" },
  { id: "acessivel", name: "Acessivel", shortLabel: "Acessivel", price: 150, tone: "violet" },
];

const seatBlueprint: Record<string, { rows: string[]; seatsPerRow: number; defaultStatus?: EventSeatStatus }> = {
  premium: { rows: ["A", "B", "C"], seatsPerRow: 6 },
  "plateia-a": { rows: ["D", "E", "F"], seatsPerRow: 7 },
  "plateia-b": { rows: ["G", "H", "I"], seatsPerRow: 7 },
  acessivel: { rows: ["J"], seatsPerRow: 4, defaultStatus: "accessible" },
};

const createSeatMap = (options: {
  hallName: string;
  stageLabel: string;
  soldSeatIds: string[];
  reservedSeatIds: string[];
}): EventSeatMap => {
  const soldSeatIds = new Set(options.soldSeatIds);
  const reservedSeatIds = new Set(options.reservedSeatIds);

  const seats = seatSections.flatMap((section) => {
    const config = seatBlueprint[section.id];

    return config.rows.flatMap((row) =>
      Array.from({ length: config.seatsPerRow }, (_, index) => {
        const number = index + 1;
        const seatId = `${section.id}-${row.toLowerCase()}${number}`;
        let status = config.defaultStatus ?? "available";

        if (soldSeatIds.has(seatId)) {
          status = "sold";
        } else if (reservedSeatIds.has(seatId)) {
          status = "reserved";
        }

        return {
          id: seatId,
          label: `${row}${number}`,
          row,
          number,
          sectionId: section.id,
          status,
          area: section.name,
        };
      }),
    );
  });

  return {
    hallName: options.hallName,
    stageLabel: options.stageLabel,
    sections: seatSections,
    seats,
    variant: "standard",
    notes: [
      "Assentos em cinza ja estao indisponiveis.",
      "Assentos roxos indicam lugares acessiveis.",
      "O QR do ingresso deve ser liberado apenas apos validacao administrativa.",
    ],
  };
};

type TheaterSeatRule = {
  start: number;
  end: number;
  areaLabel?: string;
  tags?: EventSeatTag[];
  status?: EventSeatStatus;
};

type TheaterRowBlueprint = {
  row: string;
  count: number;
  side?: "left" | "right";
  rules?: TheaterSeatRule[];
};

type TheaterSectionBlueprint = {
  section: EventSeatSection;
  layout: "fan" | "arc" | "mirrored" | "boxed";
  defaultAreaLabel: string;
  rows: TheaterRowBlueprint[];
  gridColumns?: number;
};

const theaterSectionBlueprints: TheaterSectionBlueprint[] = [
  {
    section: {
      id: "plateia",
      name: "Plateia",
      shortLabel: "Plateia",
      price: 280,
      tone: "orange",
      description: "Bloco principal com maior proximidade do palco e recursos dedicados de acessibilidade.",
      mapArea: {
        kind: "fan",
        x: 297,
        y: 420,
        width: 806,
        height: 549,
        labelX: 700,
        labelY: 543,
      },
    },
    layout: "fan",
    defaultAreaLabel: "Plateia",
    rows: [
      { row: "A", count: 26, rules: [{ start: 1, end: 4, areaLabel: "Plateia - Baixa visao", tags: ["low-vision"], status: "accessible" }] },
      { row: "B", count: 26 },
      { row: "C", count: 28 },
      { row: "D", count: 26 },
      { row: "E", count: 28 },
      { row: "F", count: 28 },
      { row: "G", count: 28 },
      { row: "H", count: 28 },
      { row: "I", count: 28, rules: [{ start: 1, end: 2, areaLabel: "Plateia - Cadeirante", tags: ["wheelchair"], status: "accessible" }] },
      { row: "J", count: 28 },
      { row: "K", count: 28 },
      { row: "L", count: 28 },
      { row: "M", count: 26 },
      { row: "N", count: 24 },
      {
        row: "O",
        count: 22,
        rules: [{ start: 21, end: 22, areaLabel: "Plateia - Mobilidade reduzida", tags: ["reduced-mobility"], status: "accessible" }],
      },
      {
        row: "P",
        count: 18,
        rules: [{ start: 17, end: 18, areaLabel: "Plateia - Mobilidade reduzida", tags: ["reduced-mobility"], status: "accessible" }],
      },
      { row: "Q", count: 16, rules: [{ start: 1, end: 8, areaLabel: "Plateia - Cadeirante", tags: ["wheelchair"], status: "accessible" }] },
      { row: "S", count: 14 },
      { row: "T", count: 16, rules: [{ start: 16, end: 16, areaLabel: "Plateia - Assento ampliado", tags: ["plus-size"] }] },
    ],
  },
  {
    section: {
      id: "foyer",
      name: "Foyer",
      shortLabel: "Foyer",
      price: 220,
      tone: "slate",
      description: "Laterais com alta capacidade e leitura pratica da sala antes do checkout.",
      mapArea: {
        kind: "paired-boxes",
        x: 82,
        y: 630,
        width: 1237,
        height: 292,
        labelX: 700,
        labelY: 654,
        boxWidthRatio: 0.27,
      },
    },
    layout: "mirrored",
    defaultAreaLabel: "Foyer",
    gridColumns: 8,
    rows: [
      { row: "A", count: 76, rules: [{ start: 53, end: 76, areaLabel: "Foyer - Visao parcial", tags: ["partial-view"] }] },
      { row: "B", count: 66, rules: [{ start: 49, end: 66, areaLabel: "Foyer - Visao parcial", tags: ["partial-view"] }] },
      { row: "C", count: 36 },
      {
        row: "D",
        count: 81,
        rules: [
          { start: 53, end: 79, areaLabel: "Foyer - Visao parcial", tags: ["partial-view"] },
          { start: 80, end: 80, areaLabel: "Foyer - Mobilidade reduzida", tags: ["reduced-mobility"], status: "accessible" },
          { start: 81, end: 81, areaLabel: "Foyer - Assento ampliado", tags: ["plus-size"] },
        ],
      },
    ],
  },
  {
    section: {
      id: "frisa",
      name: "Frisa",
      shortLabel: "Frisa",
      price: 230,
      tone: "slate",
      description: "Boxes laterais da sala, com forte presenca de pontos de visao parcial como na referencia salva.",
      mapArea: {
        kind: "paired-boxes",
        x: 53,
        y: 350,
        width: 1295,
        height: 280,
        labelX: 700,
        labelY: 371,
        boxWidthRatio: 0.18,
      },
    },
    layout: "boxed",
    defaultAreaLabel: "Frisa",
    gridColumns: 4,
    rows: [
      { row: "2", count: 5, side: "left", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "3", count: 5, side: "left", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "4", count: 5, side: "left", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "5", count: 5, side: "left", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "6", count: 5, side: "left", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "7", count: 5, side: "left", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "8", count: 5, side: "left", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "9", count: 5, side: "left", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "10", count: 5, side: "left", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "11", count: 5, side: "right", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "12", count: 5, side: "right", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      {
        row: "13",
        count: 17,
        side: "right",
        rules: [
          { start: 1, end: 16, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] },
          { start: 17, end: 17, areaLabel: "Frisa - Assento ampliado", tags: ["partial-view", "plus-size"] },
        ],
      },
      { row: "14", count: 5, side: "right", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "16", count: 5, side: "right", rules: [{ start: 1, end: 5, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
      { row: "18", count: 7, side: "right", rules: [{ start: 1, end: 7, areaLabel: "Frisa - Visao parcial", tags: ["partial-view"] }] },
    ],
  },
  {
    section: {
      id: "balcao-nobre",
      name: "Balcao Nobre",
      shortLabel: "B. Nobre",
      price: 240,
      tone: "orange",
      description: "Faixa central superior com mistura de lugares frontais e trechos de visao parcial.",
      mapArea: {
        kind: "arc-band",
        x: 320,
        y: 240,
        width: 560,
        height: 135,
        labelX: 600,
        labelY: 314,
      },
    },
    layout: "arc",
    defaultAreaLabel: "Balcao Nobre",
    rows: [
      { row: "A", count: 40 },
      { row: "B", count: 40, rules: [{ start: 15, end: 40, areaLabel: "Balcao Nobre - Visao parcial", tags: ["partial-view"] }] },
      {
        row: "C",
        count: 43,
        rules: [
          { start: 9, end: 42, areaLabel: "Balcao Nobre - Visao parcial", tags: ["partial-view"] },
          { start: 43, end: 43, areaLabel: "Balcao Nobre - Assento ampliado", tags: ["partial-view", "plus-size"] },
        ],
      },
    ],
  },
  {
    section: {
      id: "balcao-simples",
      name: "Balcao Simples",
      shortLabel: "B. Simples",
      price: 190,
      tone: "emerald",
      description: "Balcao lateral com grande volume de assentos e fileiras com leitura parcial do palco.",
      mapArea: {
        kind: "paired-boxes",
        x: 105,
        y: 250,
        width: 990,
        height: 250,
        labelX: 600,
        labelY: 268,
        boxWidthRatio: 0.25,
      },
    },
    layout: "mirrored",
    defaultAreaLabel: "Balcao Simples",
    gridColumns: 8,
    rows: [
      { row: "A", count: 64, rules: [{ start: 35, end: 64, areaLabel: "Balcao Simples - Visao prejudicada", tags: ["partial-view"] }] },
      { row: "B", count: 60, rules: [{ start: 37, end: 60, areaLabel: "Balcao Simples - Visao prejudicada", tags: ["partial-view"] }] },
      { row: "C", count: 36, rules: [{ start: 24, end: 36, areaLabel: "Balcao Simples - Visao parcial", tags: ["partial-view"] }] },
      {
        row: "D",
        count: 55,
        rules: [
          { start: 44, end: 54, areaLabel: "Balcao Simples - Visao parcial", tags: ["partial-view"] },
          { start: 55, end: 55, areaLabel: "Balcao Simples - Assento ampliado", tags: ["plus-size"] },
        ],
      },
    ],
  },
  {
    section: {
      id: "anfiteatro",
      name: "Anfiteatro",
      shortLabel: "Anfiteatro",
      price: 160,
      tone: "emerald",
      description: "Anel superior com leitura panoramica e faixas de visao parcial, como no mapa do Theatro Municipal.",
      mapArea: {
        kind: "arc-band",
        x: 245,
        y: 130,
        width: 710,
        height: 150,
        labelX: 600,
        labelY: 208,
      },
    },
    layout: "arc",
    defaultAreaLabel: "Anfiteatro",
    rows: [
      { row: "A", count: 26, rules: [{ start: 19, end: 26, areaLabel: "Anfiteatro - Visao parcial", tags: ["partial-view"] }] },
      { row: "B", count: 29, rules: [{ start: 17, end: 29, areaLabel: "Anfiteatro - Visao parcial", tags: ["partial-view"] }] },
      { row: "C", count: 30, rules: [{ start: 15, end: 30, areaLabel: "Anfiteatro - Visao parcial", tags: ["partial-view"] }] },
      { row: "D", count: 28, rules: [{ start: 11, end: 28, areaLabel: "Anfiteatro - Visao parcial", tags: ["partial-view"] }] },
      { row: "E", count: 24, rules: [{ start: 14, end: 24, areaLabel: "Anfiteatro - Visao parcial", tags: ["partial-view"] }] },
      { row: "F", count: 18, rules: [{ start: 13, end: 18, areaLabel: "Anfiteatro - Visao parcial", tags: ["partial-view"] }] },
    ],
  },
  {
    section: {
      id: "galeria",
      name: "Galeria",
      shortLabel: "Galeria",
      price: 130,
      tone: "violet",
      description: "Setor mais alto da sala, com ampla capacidade e muitos lugares de visao prejudicada.",
      mapArea: {
        kind: "arc-band",
        x: 220,
        y: 60,
        width: 760,
        height: 120,
        labelX: 600,
        labelY: 124,
      },
    },
    layout: "arc",
    defaultAreaLabel: "Galeria",
    rows: [
      { row: "A", count: 63, rules: [{ start: 38, end: 63, areaLabel: "Galeria - Visao prejudicada", tags: ["partial-view"] }] },
      { row: "B", count: 38, rules: [{ start: 29, end: 38, areaLabel: "Galeria - Visao parcial", tags: ["partial-view"] }] },
      {
        row: "C",
        count: 72,
        rules: [
          { start: 31, end: 71, areaLabel: "Galeria - Visao prejudicada", tags: ["partial-view"] },
          { start: 72, end: 72, areaLabel: "Galeria - Assento ampliado", tags: ["partial-view", "plus-size"] },
        ],
      },
    ],
  },
  {
    section: {
      id: "camarote-vip",
      name: "Camarote VIP",
      shortLabel: "VIP",
      price: 300,
      tone: "orange",
      description: "Camarotes superiores e um ponto tecnico nao comercial para manter a contagem do template salvo.",
      mapArea: {
        kind: "paired-boxes",
        x: 70,
        y: 150,
        width: 1060,
        height: 120,
        labelX: 600,
        labelY: 170,
        boxWidthRatio: 0.18,
      },
    },
    layout: "boxed",
    defaultAreaLabel: "Camarote",
    gridColumns: 4,
    rows: [
      { row: "1", count: 6, side: "left" },
      { row: "2", count: 6, side: "left" },
      { row: "3", count: 6, side: "left" },
      { row: "4", count: 4, side: "left" },
      { row: "5", count: 4, side: "left" },
      { row: "6", count: 4, side: "right" },
      { row: "7", count: 4, side: "right" },
      { row: "8", count: 4, side: "right" },
      { row: "9", count: 4, side: "right" },
      { row: "10", count: 4, side: "right" },
      { row: "11", count: 4, side: "right" },
      { row: "P.E.", count: 1, side: "right", rules: [{ start: 1, end: 1, areaLabel: "P. E.", status: "sold" }] },
    ],
  },
];

const hashSeatId = (value: string) =>
  value.split("").reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);

const resolveSeatRule = (
  rowBlueprint: TheaterRowBlueprint,
  seatNumber: number,
  defaultAreaLabel: string,
): { areaLabel: string; tags?: EventSeatTag[]; status: EventSeatStatus } => {
  let areaLabel = defaultAreaLabel;
  let status: EventSeatStatus = "available";
  let tags: EventSeatTag[] = [];

  (rowBlueprint.rules ?? []).forEach((rule) => {
    if (seatNumber >= rule.start && seatNumber <= rule.end) {
      areaLabel = rule.areaLabel ?? areaLabel;
      status = rule.status ?? status;
      tags = [...tags, ...(rule.tags ?? [])];
    }
  });

  return {
    areaLabel,
    status,
    tags: tags.length > 0 ? Array.from(new Set(tags)) : undefined,
  };
};

const createFanPosition = (
  area: NonNullable<EventSeatSection["mapArea"]>,
  rowIndex: number,
  rowCount: number,
  seatIndex: number,
  seatCount: number,
) => {
  const depth = rowCount === 1 ? 0.5 : rowIndex / (rowCount - 1);
  const normalizedSeat = seatCount === 1 ? 0.5 : seatIndex / (seatCount - 1);
  const centeredSeat = normalizedSeat * 2 - 1;
  const rowWidth = area.width * (0.38 + depth * 0.58);
  const baseX = area.x + (area.width - rowWidth) / 2;
  const baseY = area.y + area.height * (0.1 + depth * 0.8);
  const curve = Math.abs(centeredSeat) ** 1.4;

  return {
    x: baseX + normalizedSeat * rowWidth,
    y: baseY + curve * (area.height * 0.08),
  };
};

const createArcPosition = (
  area: NonNullable<EventSeatSection["mapArea"]>,
  rowIndex: number,
  rowCount: number,
  seatIndex: number,
  seatCount: number,
) => {
  const depth = rowCount === 1 ? 0.5 : rowIndex / (rowCount - 1);
  const normalizedSeat = seatCount === 1 ? 0.5 : seatIndex / (seatCount - 1);
  const angleStart = Math.PI * 0.93;
  const angleEnd = Math.PI * 0.07;
  const angle = angleStart + (angleEnd - angleStart) * normalizedSeat;
  const centerX = area.x + area.width / 2;
  const centerY = area.y + area.height * 0.94;
  const radiusX = area.width * (0.47 - depth * 0.08);
  const radiusY = area.height * (0.62 - depth * 0.06);

  return {
    x: centerX + Math.cos(angle) * radiusX,
    y: centerY - Math.sin(angle) * radiusY + depth * 8,
  };
};

const getPairedBoxes = (area: NonNullable<EventSeatSection["mapArea"]>) => {
  const boxWidth = area.width * (area.boxWidthRatio ?? 0.18);

  return {
    left: {
      x: area.x,
      y: area.y,
      width: boxWidth,
      height: area.height,
    },
    right: {
      x: area.x + area.width - boxWidth,
      y: area.y,
      width: boxWidth,
      height: area.height,
    },
  };
};

const createGridPosition = (options: {
  x: number;
  y: number;
  width: number;
  height: number;
  seatIndex: number;
  seatCount: number;
  columns: number;
}) => {
  const columnCount = Math.min(Math.max(options.columns, 1), options.seatCount);
  const rowCount = Math.ceil(options.seatCount / columnCount);
  const columnIndex = options.seatIndex % columnCount;
  const rowIndex = Math.floor(options.seatIndex / columnCount);
  const horizontalPadding = 14;
  const verticalPadding = 10;
  const usableWidth = Math.max(options.width - horizontalPadding * 2, 20);
  const usableHeight = Math.max(options.height - verticalPadding * 2, 20);

  return {
    x:
      options.x +
      horizontalPadding +
      (columnCount === 1 ? usableWidth / 2 : (usableWidth / (columnCount - 1)) * columnIndex),
    y:
      options.y +
      verticalPadding +
      (rowCount === 1 ? usableHeight / 2 : (usableHeight / (rowCount - 1)) * rowIndex),
  };
};

const buildTheaterSeats = () => {
  const seats: EventSeat[] = [];

  theaterSectionBlueprints.forEach((sectionBlueprint) => {
    const { section, rows, layout, defaultAreaLabel } = sectionBlueprint;

    if (!section.mapArea) {
      return;
    }

    if (layout === "fan" || layout === "arc") {
      rows.forEach((rowBlueprint, rowIndex) => {
        Array.from({ length: rowBlueprint.count }, (_, index) => {
          const seatNumber = index + 1;
          const metadata = resolveSeatRule(rowBlueprint, seatNumber, defaultAreaLabel);
          const position =
            layout === "fan"
              ? createFanPosition(section.mapArea!, rowIndex, rows.length, index, rowBlueprint.count)
              : createArcPosition(section.mapArea!, rowIndex, rows.length, index, rowBlueprint.count);

          const seatId = `${section.id}-${rowBlueprint.row.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${seatNumber}`;
          const hashed = hashSeatId(seatId);
          let status = metadata.status;

          if (status === "available") {
            if (hashed % 47 === 0) {
              status = "sold";
            } else if (hashed % 31 === 0) {
              status = "reserved";
            }
          }

          seats.push({
            id: seatId,
            label: `${rowBlueprint.row}-${seatNumber}`,
            row: rowBlueprint.row,
            number: seatNumber,
            sectionId: section.id,
            status,
            area: metadata.areaLabel,
            tags: metadata.tags,
            position,
          });
        });
      });

      return;
    }

    const pairedBoxes = getPairedBoxes(section.mapArea);

    if (layout === "mirrored") {
      rows.forEach((rowBlueprint, rowIndex) => {
        const rowHeight = section.mapArea!.height / rows.length;
        const leftCount = Math.ceil(rowBlueprint.count / 2);
        const rightCount = rowBlueprint.count - leftCount;

        Array.from({ length: rowBlueprint.count }, (_, index) => {
          const seatNumber = index + 1;
          const metadata = resolveSeatRule(rowBlueprint, seatNumber, defaultAreaLabel);
          const position =
            index < leftCount
              ? createGridPosition({
                  x: pairedBoxes.left.x,
                  y: pairedBoxes.left.y + rowHeight * rowIndex,
                  width: pairedBoxes.left.width,
                  height: rowHeight,
                  seatIndex: index,
                  seatCount: leftCount,
                  columns: sectionBlueprint.gridColumns ?? 8,
                })
              : createGridPosition({
                  x: pairedBoxes.right.x,
                  y: pairedBoxes.right.y + rowHeight * rowIndex,
                  width: pairedBoxes.right.width,
                  height: rowHeight,
                  seatIndex: index - leftCount,
                  seatCount: Math.max(rightCount, 1),
                  columns: sectionBlueprint.gridColumns ?? 8,
                });

          const seatId = `${section.id}-${rowBlueprint.row.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${seatNumber}`;
          const hashed = hashSeatId(seatId);
          let status = metadata.status;

          if (status === "available") {
            if (hashed % 53 === 0) {
              status = "sold";
            } else if (hashed % 37 === 0) {
              status = "reserved";
            }
          }

          seats.push({
            id: seatId,
            label: `${rowBlueprint.row}-${seatNumber}`,
            row: rowBlueprint.row,
            number: seatNumber,
            sectionId: section.id,
            status,
            area: metadata.areaLabel,
            tags: metadata.tags,
            position,
          });
        });
      });

      return;
    }

    if (layout === "boxed") {
      const leftRows = rows.filter((rowBlueprint) => rowBlueprint.side === "left");
      const rightRows = rows.filter((rowBlueprint) => rowBlueprint.side === "right");

      rows.forEach((rowBlueprint) => {
        const sideRows = rowBlueprint.side === "left" ? leftRows : rightRows;
        const currentSideIndex = sideRows.findIndex((item) => item.row === rowBlueprint.row);
        const currentBox = rowBlueprint.side === "left" ? pairedBoxes.left : pairedBoxes.right;
        const rowHeight = currentBox.height / Math.max(sideRows.length, 1);

        Array.from({ length: rowBlueprint.count }, (_, index) => {
          const seatNumber = index + 1;
          const metadata = resolveSeatRule(rowBlueprint, seatNumber, defaultAreaLabel);
          const position = createGridPosition({
            x: currentBox.x,
            y: currentBox.y + rowHeight * currentSideIndex,
            width: currentBox.width,
            height: rowHeight,
            seatIndex: index,
            seatCount: rowBlueprint.count,
            columns: sectionBlueprint.gridColumns ?? 4,
          });
          const seatId = `${section.id}-${rowBlueprint.row.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${seatNumber}`;
          const hashed = hashSeatId(seatId);
          let status = metadata.status;

          if (status === "available") {
            if (hashed % 59 === 0) {
              status = "sold";
            } else if (hashed % 41 === 0) {
              status = "reserved";
            }
          }

          seats.push({
            id: seatId,
            label: `${rowBlueprint.row}-${seatNumber}`,
            row: rowBlueprint.row,
            number: seatNumber,
            sectionId: section.id,
            status,
            area: metadata.areaLabel,
            tags: metadata.tags,
            position,
          });
        });
      });
    }
  });

  return seats;
};

const createTheaterSeatMap = (options: { hallName: string; stageLabel: string }): EventSeatMap => ({
  hallName: options.hallName,
  stageLabel: options.stageLabel,
  sections: theaterSectionBlueprints.map((item) => item.section),
  seats: buildTheaterSeats(),
  variant: "theater",
  viewport: {
    width: 1400,
    height: 1050,
  },
  notes: [
    "O mapa de sala agora replica a contagem-base extraida do HTML salvo do Theatro Municipal, com 1531 assentos mapeados.",
    "O fluxo correto continua sendo: explorar o mapa, escolher o setor, selecionar assentos e so depois seguir para o checkout.",
    "Lugares com visao parcial, baixa visao, cadeirante, mobilidade reduzida e assento ampliado ficam sinalizados no painel do mapa.",
  ],
});

const createEventDetailsContent = (event: Omit<EventData, "details">, overrides: EventDetailsOverrides): EventDetailsContent => ({
  organizer: overrides.organizer,
  address: overrides.address,
  openingTime: overrides.openingTime,
  ageRating: overrides.ageRating ?? "16 anos",
  agePolicy:
    overrides.agePolicy ?? "Menores de idade devem estar acompanhados pelos pais ou responsaveis legais.",
  paymentInfo: overrides.paymentInfo ?? "Pix, cartao de credito e reserva corporativa.",
  salesInfo: overrides.salesInfo ?? "Site, app e checkout local desta base, com revisao administrativa posterior.",
  infoParagraphs: overrides.infoParagraphs ?? [event.summary, event.description],
  importantNotice:
    overrides.importantNotice ??
    "Os assentos selecionados durante a compra ficam vinculados ao ingresso emitido e devem ser respeitados no acesso ao evento.",
  ticketPolicies: overrides.ticketPolicies ?? [
    "A titularidade do ingresso deve ser conferida antes da validacao final do pedido.",
    ...event.securityNotes.slice(0, 2),
    "Beneficios e gratuidades exigem comprovacao valida antes da emissao definitiva do ticket.",
  ],
});

export const highlights: HighlightData[] = [
  { id: "h1", title: "Samba na Praca - Edicao Especial", image: highlight1, href: "/eventos/roda-de-samba-verao" },
  { id: "h2", title: "DJ Festival Eletronico 2026", image: highlight2, href: "/eventos/jazz-blues-night" },
  { id: "h3", title: "Noite Sertaneja - Villa Arena", image: highlight3, href: "/eventos/pop-stars-live-arena-tour" },
  { id: "h4", title: "Stand-Up Comedy Night", image: highlight4, href: "/eventos/rap-nacional-em-cena" },
  { id: "h5", title: "MPB ao Vivo - Grandes Vozes", image: highlight5, href: "/eventos/forro-pe-de-serra-arraial-urbano" },
  { id: "h6", title: "Rock Legacy Festival 2026", image: highlight6, href: "/eventos/hamlet-cia-teatro-novo" },
];

export const banners: BannerData[] = [
  { id: "b1", title: "Duo Acustico - Turne Nacional", image: banner1, href: "/eventos/roda-de-samba-verao" },
  { id: "b2", title: "Rock in Concert - Edicao Azul", image: banner2, href: "/eventos/pop-stars-live-arena-tour" },
  { id: "b3", title: "Grande Teatro Imperial - Temporada 2026", image: banner3, href: "/eventos/hamlet-cia-teatro-novo" },
];

const eventSeeds: EventSeed[] = [
  {
    id: "e1",
    slug: "roda-de-samba-verao",
    title: "Roda de Samba - Edicao Verao",
    image: event1,
    bannerImage: banner1,
    month: "Mar",
    day: "22",
    weekday: "Sab",
    time: "20:00",
    city: "Sao Paulo / SP",
    venueName: "Espaco Cultural",
    summary: "Evento com mapa de sala, setores definidos e operacao preparada para validacao segura.",
    description:
      "A experiencia parte da home atual e desce para uma pagina de detalhes onde o usuario consegue avaliar o mapa da sala, entender os setores e selecionar seus lugares com clareza.",
    priceFrom: 150,
    securityNotes: [
      "Liberar ingresso digital somente apos validacao do pedido.",
      "Exibir documentos e dados sensiveis sempre mascarados na operacao.",
      "Registrar data, hora e operador responsavel pela aprovacao final.",
    ],
    seatMap: createSeatMap({
      hallName: "Sala principal - Espaco Cultural",
      stageLabel: "Palco principal",
      soldSeatIds: ["premium-a3", "plateia-a-d4", "plateia-b-g6"],
      reservedSeatIds: ["premium-b2", "plateia-a-f6", "acessivel-j4"],
    }),
    detailsOverrides: {
      organizer: "Samba Sessions Producoes",
      address: "Rua da Consolacao, 1200 - Consolacao - Sao Paulo / SP",
      openingTime: "18:30",
      ageRating: "18 anos",
    },
  },
  {
    id: "e2",
    slug: "jazz-blues-night",
    title: "Jazz & Blues Night",
    image: event2,
    bannerImage: banner2,
    month: "Mar",
    day: "22",
    weekday: "Sab",
    time: "21:00",
    city: "Rio de Janeiro / RJ",
    venueName: "Blue Note Rio",
    summary: "Sessao noturna com experiencia premium, selecao visual de assentos e fluxo de seguranca.",
    description:
      "A pagina de detalhes organiza informacao essencial do evento, setores do mapa e orientacoes de compra para que o usuario decida o assento com confianca.",
    priceFrom: 150,
    securityNotes: [
      "Separar compra, analise do pedido e emissao do QR.",
      "Bloquear assentos em disputa ate a conclusao da revisao operacional.",
      "Aplicar trilha de auditoria no fluxo administrativo.",
    ],
    seatMap: createSeatMap({
      hallName: "Blue Note Rio - Sala azul",
      stageLabel: "Palco intimista",
      soldSeatIds: ["premium-a1", "premium-a2", "plateia-b-h5"],
      reservedSeatIds: ["plateia-a-e3", "plateia-b-g1", "acessivel-j2"],
    }),
    detailsOverrides: {
      organizer: "Blue Sessions Entretenimento",
      address: "Avenida Atlantica, 1910 - Copacabana - Rio de Janeiro / RJ",
      openingTime: "19:30",
      ageRating: "18 anos",
    },
  },
  {
    id: "e3",
    slug: "pop-stars-live-arena-tour",
    title: "Pop Stars Live - Arena Tour",
    image: event3,
    bannerImage: banner2,
    month: "Mar",
    day: "23",
    weekday: "Dom",
    time: "19:00",
    city: "Sao Paulo / SP",
    venueName: "Arena Central",
    summary: "Show de arena com mapa setorizado e resumo lateral da selecao do usuario.",
    description:
      "O detalhe do evento concentra o mapa da sala, observacoes de seguranca e um resumo de assentos escolhidos sem alterar a linguagem visual da home.",
    priceFrom: 150,
    securityNotes: [
      "Validacao administrativa antes da emissao do QR final.",
      "Operador deve revisar score, assentos e dados mascarados.",
      "Eventos de alta demanda pedem fila de aprovacao mais rigida.",
    ],
    seatMap: createSeatMap({
      hallName: "Arena Central - Anel inferior",
      stageLabel: "Palco arena",
      soldSeatIds: ["premium-c5", "plateia-a-d1", "plateia-b-h7"],
      reservedSeatIds: ["plateia-a-e5", "plateia-b-i2", "acessivel-j1"],
    }),
    detailsOverrides: {
      organizer: "Arena Touring Brasil",
      address: "Avenida Paulista, 900 - Bela Vista - Sao Paulo / SP",
      openingTime: "17:30",
      ageRating: "16 anos",
    },
  },
  {
    id: "e4",
    slug: "rap-nacional-em-cena",
    title: "Rap Nacional em Cena",
    image: event4,
    bannerImage: banner3,
    month: "Mar",
    day: "25",
    weekday: "Ter",
    time: "21:00",
    city: "Belo Horizonte / MG",
    venueName: "Mister Rock",
    summary: "Mapa de sala preparado para leitura rapida e escolha de assentos em grupos pequenos.",
    description:
      "A pagina de detalhes organiza setores e status dos lugares para reduzir atrito e melhorar a visibilidade no momento da escolha.",
    priceFrom: 150,
    securityNotes: [
      "Evitar emissao automatica do QR sem revisao operacional.",
      "Exibir status dos lugares em tempo real para o usuario.",
      "Documentar operacoes sensiveis no painel administrativo.",
    ],
    seatMap: createSeatMap({
      hallName: "Mister Rock - Sala principal",
      stageLabel: "Palco urbano",
      soldSeatIds: ["premium-a4", "plateia-a-f4", "plateia-b-g3"],
      reservedSeatIds: ["premium-c1", "plateia-b-h2", "acessivel-j3"],
    }),
    detailsOverrides: {
      organizer: "Cena Urbana Producoes",
      address: "Avenida Teresa Cristina, 295 - Prado - Belo Horizonte / MG",
      openingTime: "19:00",
      ageRating: "18 anos",
    },
  },
  {
    id: "e5",
    slug: "forro-pe-de-serra-arraial-urbano",
    title: "Forro Pe de Serra - Arraial Urbano",
    image: event5,
    bannerImage: banner1,
    month: "Mar",
    day: "27",
    weekday: "Qui",
    time: "20:00",
    city: "Fortaleza / CE",
    venueName: "Centro de Eventos",
    summary: "Setores claros, mapa amigavel e fluxo pronto para validacao do ingresso.",
    description:
      "O usuario entra por uma home simples e familiar, e encontra no detalhe do evento um modulo completo de mapa de sala para finalizar sua decisao.",
    priceFrom: 150,
    securityNotes: [
      "Usar mascaramento de dados sempre que houver analise manual.",
      "Aplicar logs de aprovacao e emissao do ticket.",
      "Ligar a emissao do QR a uma etapa explicita de validacao.",
    ],
    seatMap: createSeatMap({
      hallName: "Centro de Eventos - Sala laranja",
      stageLabel: "Palco principal",
      soldSeatIds: ["premium-b5", "plateia-a-f2", "plateia-b-i4"],
      reservedSeatIds: ["premium-a6", "plateia-a-d5", "acessivel-j2"],
    }),
    detailsOverrides: {
      organizer: "Arraial Urbano Eventos",
      address: "Avenida Washington Soares, 999 - Edson Queiroz - Fortaleza / CE",
      openingTime: "18:00",
      ageRating: "16 anos",
    },
  },
  {
    id: "e6",
    slug: "hamlet-cia-teatro-novo",
    title: "Hamlet - Cia. Teatro Novo",
    image: event6,
    bannerImage: banner3,
    month: "Mar",
    day: "28",
    weekday: "Sex",
    time: "19:30",
    city: "Sao Paulo / SP",
    venueName: "Teatro Municipal",
    summary: "Teatro com assento numerado, leitura de palco e recursos de seguranca aplicados ao ingresso.",
    description:
      "O modulo de mapa da sala entra dentro da pagina de detalhes do evento, mantendo a home atual como vitrine principal da plataforma.",
    priceFrom: 170,
    securityNotes: [
      "Explicitar no fluxo que o ticket digital depende de validacao.",
      "Assentos acessiveis devem ser identificados com clareza.",
      "Toda aprovacao precisa ser rastreavel no ambiente administrativo.",
    ],
    seatMap: createTheaterSeatMap({
      hallName: "Teatro Municipal - Sala principal",
      stageLabel: "Palco italiano",
    }),
    detailsOverrides: {
      organizer: "Cia Teatro Novo",
      address: "Praca Ramos de Azevedo, s/n - Centro - Sao Paulo / SP",
      openingTime: "18:30",
      ageRating: "12 anos",
      agePolicy: "Menores de 12 anos devem estar acompanhados pelos pais ou responsaveis legais.",
    },
  },
  {
    id: "e7",
    slug: "festival-gastronomico-musica",
    title: "Festival Gastronomico & Musica",
    image: event7,
    bannerImage: banner1,
    month: "Mar",
    day: "29",
    weekday: "Sab",
    time: "16:00",
    city: "Curitiba / PR",
    venueName: "Parque Barigui",
    summary: "Fluxo de detalhe com mapa visual para eventos de maior rotatividade e multiplos setores.",
    description:
      "Ao manter a home atual, o detalhe vira o lugar certo para aprofundar experiencia, setorizar a sala e preparar a jornada do ingresso.",
    priceFrom: 150,
    securityNotes: [
      "Controlar lotacao por setor antes da aprovacao final.",
      "Registrar movimentacoes criticas de operador e usuario.",
      "Vincular QR final a um pedido validado.",
    ],
    seatMap: createSeatMap({
      hallName: "Parque Barigui - Arena temporaria",
      stageLabel: "Palco sunset",
      soldSeatIds: ["premium-a2", "plateia-a-d2", "plateia-b-i5"],
      reservedSeatIds: ["premium-c4", "plateia-b-g7", "acessivel-j4"],
    }),
    detailsOverrides: {
      organizer: "Circuito Gastronomico Brasil",
      address: "Avenida Candido Hartmann, 2300 - Bigorrilho - Curitiba / PR",
      openingTime: "14:00",
      ageRating: "Livre",
      agePolicy: "Menores podem acessar o evento acompanhados por um responsavel.",
    },
  },
  {
    id: "e8",
    slug: "orquestra-sinfonica-temporada-2026",
    title: "Orquestra Sinfonica - Temporada 2026",
    image: event8,
    bannerImage: banner3,
    month: "Mar",
    day: "30",
    weekday: "Dom",
    time: "18:00",
    city: "Sao Paulo / SP",
    venueName: "Sala Sao Paulo",
    summary: "Escolha de assento com foco em visibilidade, leitura do palco e resumo de compra lateral.",
    description:
      "A `EventDetails` concentra mapa da sala, informacoes do evento e notas de seguranca sem mexer na organizacao visual da home.",
    priceFrom: 150,
    securityNotes: [
      "Equipe admin deve validar pedido antes da emissao do ingresso.",
      "Eventos com assento numerado exigem controle visual forte.",
      "A trilha do ticket precisa ser clara para usuario e operador.",
    ],
    seatMap: createSeatMap({
      hallName: "Sala Sao Paulo - Plateia principal",
      stageLabel: "Palco sinfonico",
      soldSeatIds: ["premium-b3", "plateia-a-e2", "plateia-b-h1"],
      reservedSeatIds: ["premium-c6", "plateia-a-f5", "acessivel-j2"],
    }),
    detailsOverrides: {
      organizer: "Temporada Sinfonica Paulista",
      address: "Praca Julio Prestes, 16 - Campos Eliseos - Sao Paulo / SP",
      openingTime: "16:30",
      ageRating: "10 anos",
      agePolicy: "Menores de 10 anos devem estar acompanhados por um responsavel legal.",
    },
  },
];

export const events: EventData[] = eventSeeds.map(({ detailsOverrides, ...event }) => ({
  ...event,
  details: createEventDetailsContent(event, detailsOverrides),
}));

export const getEventBySlug = (slug?: string) => events.find((event) => event.slug === slug);
