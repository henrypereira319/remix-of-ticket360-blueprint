import type { EventData } from "@/data/events";

export type MarketplaceVerticalId = "pulse";

export interface MarketplaceVertical {
  id: MarketplaceVerticalId;
  slug: string;
  label: string;
  name: string;
  audience: string;
  description: string;
}

const pulseCategories = new Set(["Shows", "Festivais", "Experiencias"]);
const pulseKeywords = [
  "show",
  "festival",
  "noite",
  "arena",
  "tour",
  "ao vivo",
  "sunset",
  "festa",
  "rap",
  "pop",
  "samba",
  "eletronica",
  "urbano",
  "danca",
  "club",
  "open bar",
  "gastronomia",
];

export const marketplaceVerticals: MarketplaceVertical[] = [
  {
    id: "pulse",
    slug: "pulse",
    label: "Pulse",
    name: "EventHub Pulse",
    audience: "Noite, ego, grupo e descoberta social",
    description: "Curadoria para publico jovem, balada, experiencia de grupo e evento com linguagem social.",
  },
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const getMarketplaceVerticalBySlug = (slug?: string) =>
  marketplaceVerticals.find((vertical) => vertical.slug === slug) ?? null;

export const scoreEventForVertical = (event: EventData, verticalId: MarketplaceVerticalId) => {
  if (verticalId !== "pulse") {
    return 0;
  }

  const haystack = normalize(
    [event.category, event.discoveryLabel, event.summary, event.description, ...event.tags, ...event.searchTerms].join(" "),
  );

  let score = pulseCategories.has(event.category) ? 3 : 0;

  pulseKeywords.forEach((keyword) => {
    if (haystack.includes(keyword)) {
      score += 1;
    }
  });

  if (normalize(event.city).includes("sao paulo")) {
    score += 0.25;
  }

  return score;
};

export const getVerticalEvents = (events: EventData[], verticalId: MarketplaceVerticalId) =>
  [...events]
    .map((event) => ({
      event,
      score: scoreEventForVertical(event, verticalId),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.event.priceFrom - left.event.priceFrom)
    .map((item) => item.event);
