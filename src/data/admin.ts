import { events, teatroBradescoSeatMap, type EventData, type EventSeatMap } from "@/data/events";

export type AdminVenueCatalogKind = "theater" | "hall";

export interface AdminSeatMapPreset {
  id: string;
  name: string;
  venueType: "theater" | "arena" | "club" | "concert-hall" | "festival";
  sourceEventSlug: string;
  sourceEventTitle: string;
  description: string;
  seatMap: EventSeatMap;
  capacity: number;
  sectionCount: number;
  accessibleSeatCount: number;
  partialViewSeatCount: number;
  recommendedFormats: string[];
  operationalNotes: string[];
  basePriceFrom: number;
}

export interface AdminVenuePreset {
  id: string;
  name: string;
  venueType: AdminSeatMapPreset["venueType"];
  catalogKind: AdminVenueCatalogKind;
  uploadSource: "internal";
  city: string;
  address: string;
  organizerHint: string;
  openingTime: string;
  seatMapPresetIds: string[];
  defaultSeatMapPresetId: string;
  tags: string[];
  adminNotes: string[];
}

export interface AdminVenueContainer {
  id: AdminVenueCatalogKind;
  name: string;
  description: string;
}

const getEventTemplate = (slug: string) => {
  const event = events.find((item) => item.slug === slug);

  if (!event) {
    throw new Error(`Template de evento nao encontrado para o slug ${slug}.`);
  }

  return event;
};

const countAccessibleSeats = (seatMap: EventSeatMap) =>
  seatMap.seats.filter(
    (seat) =>
      seat.status === "accessible" ||
      seat.tags?.some((tag) => tag === "wheelchair" || tag === "low-vision" || tag === "reduced-mobility"),
  ).length;

const countPartialViewSeats = (seatMap: EventSeatMap) =>
  seatMap.seats.filter((seat) => seat.tags?.includes("partial-view")).length;

const createSeatMapPreset = (config: {
  id: string;
  name: string;
  venueType: AdminSeatMapPreset["venueType"];
  sourceEvent: EventData;
  description: string;
  recommendedFormats: string[];
  operationalNotes: string[];
}): AdminSeatMapPreset => ({
  id: config.id,
  name: config.name,
  venueType: config.venueType,
  sourceEventSlug: config.sourceEvent.slug,
  sourceEventTitle: config.sourceEvent.title,
  description: config.description,
  seatMap: config.sourceEvent.seatMap,
  capacity: config.sourceEvent.seatMap.seats.length,
  sectionCount: config.sourceEvent.seatMap.sections.length,
  accessibleSeatCount: countAccessibleSeats(config.sourceEvent.seatMap),
  partialViewSeatCount: countPartialViewSeats(config.sourceEvent.seatMap),
  recommendedFormats: config.recommendedFormats,
  operationalNotes: config.operationalNotes,
  basePriceFrom: config.sourceEvent.priceFrom,
});

const createDirectSeatMapPreset = (config: {
  id: string;
  name: string;
  venueType: AdminSeatMapPreset["venueType"];
  sourceEventSlug: string;
  sourceEventTitle: string;
  description: string;
  seatMap: EventSeatMap;
  recommendedFormats: string[];
  operationalNotes: string[];
  basePriceFrom: number;
}): AdminSeatMapPreset => ({
  id: config.id,
  name: config.name,
  venueType: config.venueType,
  sourceEventSlug: config.sourceEventSlug,
  sourceEventTitle: config.sourceEventTitle,
  description: config.description,
  seatMap: config.seatMap,
  capacity: config.seatMap.seats.length,
  sectionCount: config.seatMap.sections.length,
  accessibleSeatCount: countAccessibleSeats(config.seatMap),
  partialViewSeatCount: countPartialViewSeats(config.seatMap),
  recommendedFormats: config.recommendedFormats,
  operationalNotes: config.operationalNotes,
  basePriceFrom: config.basePriceFrom,
});

const theaterTemplate = getEventTemplate("hamlet-cia-teatro-novo");
const arenaTemplate = getEventTemplate("pop-stars-live-arena-tour");
const clubTemplate = getEventTemplate("jazz-blues-night");
const symphonicTemplate = getEventTemplate("orquestra-sinfonica-temporada-2026");
const festivalTemplate = getEventTemplate("forro-pe-de-serra-arraial-urbano");

export const adminSeatMapPresets: AdminSeatMapPreset[] = [
  createSeatMapPreset({
    id: "teatro-municipal-italiano",
    name: "Teatro italiano premium",
    venueType: "theater",
    sourceEvent: theaterTemplate,
    description:
      "Mapa cenario 2D com frisas, anfiteatro, galerias e camarotes. Ideal para opera, ballet, teatro e concertos sentados.",
    recommendedFormats: ["Teatro de repertorio", "Opera", "Ballet", "Concerto de câmara"],
    operationalNotes: [
      "Homologado para eventos com assento numerado e leitura por setor.",
      "Exige revisao de acessibilidade e de pontos de visao parcial antes de publicar.",
      "Indicado para comunicacao com forte destaque de palco e setores nobres.",
    ],
  }),
  createDirectSeatMapPreset({
    id: "teatro-bradesco-oficial",
    name: "Teatro Bradesco",
    venueType: "theater",
    sourceEventSlug: "teatro-bradesco-mapa-interno",
    sourceEventTitle: "Teatro Bradesco - mapa interno",
    description:
      "Preset normalizado a partir do SVG salvo em docs, com setores do Teatro Bradesco prontos para o gerente escolher sem depender de upload externo.",
    seatMap: teatroBradescoSeatMap,
    recommendedFormats: ["Musical", "Show sentado", "Turne premium", "Teatro comercial"],
    operationalNotes: [
      "Usar este preset quando o evento operar no Teatro Bradesco com configuracao padrao de assentos.",
      "Plateia Prime, Plateia, Frisas, Camarote Prime 2° andar e Balcao Nobre ja saem separados no mapa.",
      "Se a producao alterar bloqueios ou contingentes especiais, ajustar somente antes de publicar.",
    ],
    basePriceFrom: 210,
  }),
  createSeatMapPreset({
    id: "arena-setorizada",
    name: "Arena setorizada",
    venueType: "arena",
    sourceEvent: arenaTemplate,
    description:
      "Modelo enxuto com setores premium, plateias e lugares acessiveis. Bom para shows de medio porte e turnes nacionais.",
    recommendedFormats: ["Show pop", "Turne sertaneja", "Stand-up em arena", "Festival indoor"],
    operationalNotes: [
      "Fluxo rapido para ingressos com preco por setor.",
      "Boa opcao quando a operacao precisa vender com menos complexidade de fila.",
      "Permite adaptar lotes e reservas manuais com baixo atrito.",
    ],
  }),
  createSeatMapPreset({
    id: "clube-intimista",
    name: "Clube intimista",
    venueType: "club",
    sourceEvent: clubTemplate,
    description:
      "Mapa compacto para casas menores, com foco em venda agil e leitura simples dos setores principais.",
    recommendedFormats: ["Jazz club", "Blue note", "Comedy club", "Session premium"],
    operationalNotes: [
      "Indicado para operacoes com giro rapido e publico recorrente.",
      "Facil de adaptar para mesas VIP ou reservas corporativas.",
      "Ajuda a equipe a treinar fluxo de validacao antes de QR final.",
    ],
  }),
  createSeatMapPreset({
    id: "sala-sinfonica",
    name: "Sala sinfonica",
    venueType: "concert-hall",
    sourceEvent: symphonicTemplate,
    description:
      "Layout para concertos e recitais com foco em visibilidade, leitura de palco e politica de assento marcado.",
    recommendedFormats: ["Orquestra", "Recital", "Temporada classica", "Apresentacao institucional"],
    operationalNotes: [
      "Adequado para comunicacao de regras de idade e etiqueta de acesso.",
      "Favorece venda com antecedencia e publico familiar.",
      "Funciona bem com combos de assinatura e prioridade de renovacao.",
    ],
  }),
  createSeatMapPreset({
    id: "centro-eventos-multiuso",
    name: "Centro de eventos multiuso",
    venueType: "festival",
    sourceEvent: festivalTemplate,
    description:
      "Mapa versatil para centros de evento e montagens temporarias, equilibrando setores, acessibilidade e operacao de maior volume.",
    recommendedFormats: ["Feira com palco", "Festival indoor", "Evento corporativo", "Forro e regional"],
    operationalNotes: [
      "Bom para operacoes com multiplos lotes e campanhas comerciais.",
      "Permite reservar cadeiras para convidados, staff e patrocinadores.",
      "Facil de replicar para cidades diferentes mantendo a mesma base.",
    ],
  }),
];

export const adminVenuePresets: AdminVenuePreset[] = [
  {
    id: "teatro-municipal-sp",
    name: "Teatro Municipal de Sao Paulo",
    venueType: "theater",
    catalogKind: "theater",
    uploadSource: "internal",
    city: theaterTemplate.city,
    address: theaterTemplate.details.address,
    organizerHint: theaterTemplate.details.organizer,
    openingTime: theaterTemplate.details.openingTime,
    seatMapPresetIds: ["teatro-municipal-italiano"],
    defaultSeatMapPresetId: "teatro-municipal-italiano",
    tags: ["Patrimonio historico", "Palco italiano", "Assento marcado"],
    adminNotes: [
      "Checar classificacao etaria e contingente acessivel antes da abertura de vendas.",
      "Publicacoes pedem comunicacao mais institucional e reforco de regras de acesso.",
    ],
  },
  {
    id: "teatro-bradesco-sp",
    name: "Teatro Bradesco",
    venueType: "theater",
    catalogKind: "theater",
    uploadSource: "internal",
    city: "Sao Paulo / SP",
    address: "Bourbon Shopping Sao Paulo - Perdizes - Sao Paulo / SP",
    organizerHint: "Time interno Ticket360 / Teatro Bradesco",
    openingTime: "18:30",
    seatMapPresetIds: ["teatro-bradesco-oficial"],
    defaultSeatMapPresetId: "teatro-bradesco-oficial",
    tags: ["Casa homologada", "Musicais", "Assento numerado"],
    adminNotes: [
      "Mapa interno gerado a partir do SVG homologado enviado pela operacao.",
      "Se houver montagem especial, duplicar o preset antes de mexer na planta.",
    ],
  },
  {
    id: "sala-sao-paulo",
    name: "Sala Sao Paulo",
    venueType: "concert-hall",
    catalogKind: "hall",
    uploadSource: "internal",
    city: symphonicTemplate.city,
    address: symphonicTemplate.details.address,
    organizerHint: symphonicTemplate.details.organizer,
    openingTime: symphonicTemplate.details.openingTime,
    seatMapPresetIds: ["sala-sinfonica", "teatro-municipal-italiano"],
    defaultSeatMapPresetId: "sala-sinfonica",
    tags: ["Concert hall", "Acustica premium", "Temporada classica"],
    adminNotes: [
      "Usar politicas claras para meia entrada, lotes de assinatura e etiquete de atraso.",
      "Abertura de portoes costuma acontecer com bastante antecedencia.",
    ],
  },
  {
    id: "arena-central",
    name: "Arena Central",
    venueType: "arena",
    catalogKind: "hall",
    uploadSource: "internal",
    city: arenaTemplate.city,
    address: arenaTemplate.details.address,
    organizerHint: arenaTemplate.details.organizer,
    openingTime: arenaTemplate.details.openingTime,
    seatMapPresetIds: ["arena-setorizada", "centro-eventos-multiuso"],
    defaultSeatMapPresetId: "arena-setorizada",
    tags: ["Grande publico", "Turnes nacionais", "Lotes dinamicos"],
    adminNotes: [
      "Ideal para escalonar lotes e acompanhar demanda por setor.",
      "Operacao precisa de trilha forte para bloqueio e liberacao de assentos.",
    ],
  },
  {
    id: "blue-note-rio",
    name: "Blue Note Rio",
    venueType: "club",
    catalogKind: "hall",
    uploadSource: "internal",
    city: clubTemplate.city,
    address: clubTemplate.details.address,
    organizerHint: clubTemplate.details.organizer,
    openingTime: clubTemplate.details.openingTime,
    seatMapPresetIds: ["clube-intimista"],
    defaultSeatMapPresetId: "clube-intimista",
    tags: ["Intimista", "Premium", "House sessions"],
    adminNotes: [
      "Boa opcao para experimentar listas VIP, mesas e cortesias controladas.",
      "Vale reforcar horario de abertura e politica de consumo minimo se existir.",
    ],
  },
  {
    id: "centro-eventos-fortaleza",
    name: "Centro de Eventos Fortaleza",
    venueType: "festival",
    catalogKind: "hall",
    uploadSource: "internal",
    city: festivalTemplate.city,
    address: festivalTemplate.details.address,
    organizerHint: festivalTemplate.details.organizer,
    openingTime: festivalTemplate.details.openingTime,
    seatMapPresetIds: ["centro-eventos-multiuso", "arena-setorizada"],
    defaultSeatMapPresetId: "centro-eventos-multiuso",
    tags: ["Multiuso", "Grande capacidade", "Operacao regional"],
    adminNotes: [
      "Combina bem com campanhas promocionais, social ticket e reservas de parceiros.",
      "Pode exigir mapa mais simples quando a equipe for reduzida.",
    ],
  },
];

export const adminVenueContainers: AdminVenueContainer[] = [
  {
    id: "theater",
    name: "Teatros",
    description: "Palcos italianos e casas sentadas homologadas pela equipe para o gerente escolher.",
  },
  {
    id: "hall",
    name: "Saloes e centros",
    description: "Saloes, salas, arenas cobertas e centros de evento que nos mesmos subimos para operacao.",
  },
];

export const getAdminSeatMapPresetById = (presetId: string) =>
  adminSeatMapPresets.find((preset) => preset.id === presetId);

export const getAdminVenuePresetById = (presetId: string) =>
  adminVenuePresets.find((preset) => preset.id === presetId);
