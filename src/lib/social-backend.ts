import type { EventData } from "@/data/events";
import type { FeedItem, HeroEvent, SocialEventCard } from "@/data/social-mock";
import type { CheckoutOrderRecord } from "@/server/checkout.service";
import type { IssuedTicketRecord } from "@/server/ticket.service";

const MONTH_TO_NUMBER: Record<string, string> = {
  Jan: "01",
  Fev: "02",
  Mar: "03",
  Abr: "04",
  Mai: "05",
  Jun: "06",
  Jul: "07",
  Ago: "08",
  Set: "09",
  Out: "10",
  Nov: "11",
  Dez: "12",
};

const DEFAULT_EVENT_YEAR = new Date().getFullYear();

const toEventLookup = (events: EventData[]) => new Map(events.map((event) => [event.slug, event]));

const getMonthNumber = (month: string) => MONTH_TO_NUMBER[month] ?? "01";

const formatCardDate = (event?: EventData | null) => {
  if (!event) {
    return "--/--";
  }

  return `${event.day.padStart(2, "0")}/${getMonthNumber(event.month)}/${DEFAULT_EVENT_YEAR}`;
};

const formatHeroDate = (event: EventData) =>
  `${event.weekday.toUpperCase()} • ${event.day.padStart(2, "0")}/${getMonthNumber(event.month)} • ${event.time}`;

const prettifySlug = (slug?: string) =>
  (slug ?? "evento")
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");

const pluralizeTickets = (count: number) => `${count} ingresso${count === 1 ? "" : "s"}`;

const getAccountAvatar = (accountId?: string | null, accountName?: string) =>
  `https://i.pravatar.cc/150?u=${encodeURIComponent(accountId ?? accountName ?? "eventhub-user")}`;

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const byNewest = <T extends { timestamp: string }>(items: T[]) =>
  [...items].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

export const buildHeroEventFromBackend = ({
  events,
  orders,
  tickets,
}: {
  events: EventData[];
  orders: CheckoutOrderRecord[];
  tickets: IssuedTicketRecord[];
}): HeroEvent | null => {
  const eventLookup = toEventLookup(events);
  const prioritizedSlug =
    tickets[0]?.eventSlug ??
    orders.find((order) => order.status !== "cancelled")?.eventSlug ??
    events[0]?.slug;

  if (!prioritizedSlug) {
    return null;
  }

  const event = eventLookup.get(prioritizedSlug);

  if (!event) {
    return null;
  }

  return {
    id: event.id,
    name: event.title,
    tagline: event.venueName.toUpperCase(),
    image: event.bannerImage,
    date: formatHeroDate(event),
    slug: event.slug,
  };
};

export const buildSocialEventsFromBackend = ({
  events,
  orders,
  tickets,
}: {
  events: EventData[];
  orders: CheckoutOrderRecord[];
  tickets: IssuedTicketRecord[];
}): SocialEventCard[] => {
  const eventLookup = toEventLookup(events);
  const prioritizedSlugs = unique([
    ...tickets.map((ticket) => ticket.eventSlug),
    ...orders.filter((order) => order.status !== "cancelled").map((order) => order.eventSlug),
    ...events.map((event) => event.slug),
  ]);

  return prioritizedSlugs
    .map((slug) => {
      const event = eventLookup.get(slug);

      if (!event) {
        return null;
      }

      const issuedTickets = tickets.filter((ticket) => ticket.eventSlug === slug && ticket.status !== "cancelled").length;
      const orderTickets = orders
        .filter((order) => order.eventSlug === slug && order.status !== "cancelled")
        .reduce((total, order) => total + order.tickets.length, 0);

      return {
        id: event.id,
        name: event.title,
        image: event.image,
        date: formatCardDate(event),
        friendsGoing: Math.max(issuedTickets, orderTickets, 0),
        friendAvatars: [],
        slug: event.slug,
      };
    })
    .filter((event): event is SocialEventCard => Boolean(event))
    .slice(0, 8);
};

export const buildFeedItemsFromBackend = ({
  accountId,
  accountName,
  events,
  orders,
  tickets,
}: {
  accountId?: string | null;
  accountName: string;
  events: EventData[];
  orders: CheckoutOrderRecord[];
  tickets: IssuedTicketRecord[];
}): FeedItem[] => {
  const eventLookup = toEventLookup(events);
  const accountAvatar = getAccountAvatar(accountId, accountName);
  const activeOrders = orders.filter((order) => order.status !== "cancelled");

  if (activeOrders.length > 0) {
    return byNewest(
      activeOrders.map((order) => {
        const event = eventLookup.get(order.eventSlug);
        const ticketCount = order.tickets.length;
        const statusCopy =
          order.status === "approved"
            ? `confirmou ${pluralizeTickets(ticketCount)}`
            : order.status === "under_review"
              ? `esta com ${pluralizeTickets(ticketCount)} em analise`
              : `iniciou a compra de ${pluralizeTickets(ticketCount)}`;

        return {
          id: `order-${order.id}`,
          friendId: accountId ?? "current-account",
          friendName: accountName,
          friendAvatar: accountAvatar,
          action: order.status === "approved" ? "confirmed_presence" : "bought_ticket",
          description: statusCopy,
          eventName: event?.title ?? prettifySlug(order.eventSlug),
          eventImage: event?.image ?? event?.bannerImage ?? "",
          eventDate: formatCardDate(event),
          timestamp: order.updatedAt,
          socialProof: `Pedido ${order.reference}`,
        } satisfies FeedItem;
      }),
    ).slice(0, 6);
  }

  const ticketsByOrder = new Map<string, IssuedTicketRecord[]>();

  tickets
    .filter((ticket) => ticket.status !== "cancelled")
    .forEach((ticket) => {
      const currentTickets = ticketsByOrder.get(ticket.orderId) ?? [];
      ticketsByOrder.set(ticket.orderId, [...currentTickets, ticket]);
    });

  return byNewest(
    Array.from(ticketsByOrder.entries()).map(([orderId, groupedTickets]) => {
      const referenceTicket = groupedTickets[0];
      const event = eventLookup.get(referenceTicket.eventSlug);
      const latestTimestamp = groupedTickets.reduce(
        (latest, ticket) => (new Date(ticket.updatedAt).getTime() > new Date(latest).getTime() ? ticket.updatedAt : latest),
        referenceTicket.updatedAt,
      );

      return {
        id: `ticket-${orderId}`,
        friendId: accountId ?? "current-account",
        friendName: accountName,
        friendAvatar: accountAvatar,
        action: "confirmed_presence",
        description: `recebeu ${pluralizeTickets(groupedTickets.length)}`,
        eventName: event?.title ?? prettifySlug(referenceTicket.eventSlug),
        eventImage: event?.image ?? event?.bannerImage ?? "",
        eventDate: formatCardDate(event),
        timestamp: latestTimestamp,
        socialProof: `Pedido ${referenceTicket.orderReference}`,
      } satisfies FeedItem;
    }),
  ).slice(0, 6);
};

export const getEventDateLabel = (event?: EventData | null) => {
  if (!event) {
    return "Data a confirmar";
  }

  return `${event.weekday} • ${event.day.padStart(2, "0")} ${event.month} • ${event.time}`;
};
