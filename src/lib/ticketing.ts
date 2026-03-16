import type { EventData, EventSeat, EventSeatSection, EventSeatStatus } from "@/data/events";

export type TicketCategory = "full" | "half" | "social";

export const ticketCategoryMeta: Record<
  TicketCategory,
  {
    label: string;
    multiplier: number;
    description: string;
    proofLabel: string;
  }
> = {
  full: {
    label: "Inteira",
    multiplier: 1,
    description: "Valor cheio do setor selecionado.",
    proofLabel: "Sem comprovacao adicional.",
  },
  half: {
    label: "Meia entrada",
    multiplier: 0.5,
    description: "Desconto legal sujeito a comprovacao valida no acesso.",
    proofLabel: "Apresente documento de meia entrada na validacao.",
  },
  social: {
    label: "Ingresso social",
    multiplier: 0.7,
    description: "Categoria intermediaria para campanhas ou contrapartida solidaria.",
    proofLabel: "Validacao conforme regra comercial do evento.",
  },
};

export interface SelectedSeatSummaryItem {
  seatId: string;
  label: string;
  section: EventSeatSection;
  basePrice: number;
  price: number;
  ticketCategory: TicketCategory;
}

export interface SelectedSeatSummary {
  items: SelectedSeatSummaryItem[];
  total: number;
}

export interface CheckoutPricing {
  subtotal: number;
  serviceFee: number;
  processingFee: number;
  total: number;
}

const selectableStatuses = new Set<EventSeatStatus>(["available", "accessible"]);
const defaultTicketCategory: TicketCategory = "full";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

export const getSeatById = (event: EventData, seatId: string) =>
  event.seatMap.seats.find((seat) => seat.id === seatId);

export const isSeatSelectable = (seat?: EventSeat | null) => Boolean(seat && selectableStatuses.has(seat.status));

export const getSectionById = (event: EventData, sectionId: string) =>
  event.seatMap.sections.find((section) => section.id === sectionId);

export const getSelectableSeatCount = (event: EventData, sectionId: string) =>
  event.seatMap.seats.filter((seat) => seat.sectionId === sectionId && isSeatSelectable(seat)).length;

export const getSectionCapacity = (event: EventData, sectionId: string) =>
  event.seatMap.seats.filter((seat) => seat.sectionId === sectionId).length;

export const parseSeatIdsParam = (value: string | null) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const serializeSeatIds = (seatIds: string[]) =>
  Array.from(new Set(seatIds.map((seatId) => seatId.trim()).filter(Boolean))).join(",");

export const sanitizeSelectedSeatIds = (event: EventData, seatIds: string[]) =>
  Array.from(new Set(seatIds.map((seatId) => seatId.trim()).filter(Boolean))).filter((seatId) =>
    isSeatSelectable(getSeatById(event, seatId)),
  );

const isTicketCategory = (value: string): value is TicketCategory => value in ticketCategoryMeta;

export const parseTicketCategoriesParam = (value: string | null): Record<string, TicketCategory> =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, TicketCategory>>((accumulator, item) => {
      const [seatId, category] = item.split(":");

      if (seatId && category && isTicketCategory(category)) {
        accumulator[seatId] = category;
      }

      return accumulator;
    }, {});

export const sanitizeTicketCategories = (
  event: EventData,
  selectedSeatIds: string[],
  categories: Record<string, TicketCategory>,
) =>
  selectedSeatIds.reduce<Record<string, TicketCategory>>((accumulator, seatId) => {
    if (isSeatSelectable(getSeatById(event, seatId))) {
      accumulator[seatId] = categories[seatId] ?? defaultTicketCategory;
    }

    return accumulator;
  }, {});

export const serializeTicketCategories = (selectedSeatIds: string[], categories: Record<string, TicketCategory>) =>
  selectedSeatIds
    .map((seatId) => {
      const category = categories[seatId] ?? defaultTicketCategory;

      return `${seatId}:${category}`;
    })
    .join(",");

export const getTicketCategoryPrice = (basePrice: number, category: TicketCategory) =>
  Math.round(basePrice * ticketCategoryMeta[category].multiplier * 100) / 100;

export const getSelectionSummary = (
  event: EventData,
  selectedSeatIds: string[],
  ticketCategories: Record<string, TicketCategory> = {},
): SelectedSeatSummary => {
  const items = selectedSeatIds
    .map((seatId) => getSeatById(event, seatId))
    .filter((seat): seat is EventSeat => Boolean(seat))
    .map((seat) => {
      const section = getSectionById(event, seat.sectionId);

      if (!section) {
        throw new Error(`Section not found for seat ${seat.id}`);
      }

      const ticketCategory = ticketCategories[seat.id] ?? defaultTicketCategory;

      return {
        seatId: seat.id,
        label: seat.label,
        section,
        basePrice: section.price,
        price: getTicketCategoryPrice(section.price, ticketCategory),
        ticketCategory,
      };
    });

  return {
    items,
    total: items.reduce((sum, item) => sum + item.price, 0),
  };
};

export const getCheckoutPricing = (subtotal: number, ticketCount: number): CheckoutPricing => {
  const serviceFee = ticketCount * 18;
  const processingFee = ticketCount > 0 ? 4.9 : 0;

  return {
    subtotal,
    serviceFee,
    processingFee,
    total: subtotal + serviceFee + processingFee,
  };
};
