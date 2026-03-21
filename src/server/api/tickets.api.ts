import {
  getStoredTickets,
  getTicketsByAccount,
  getTicketsByOrder,
  ticketStorageChannel,
  type IssuedTicketRecord,
} from "@/server/ticket.service";

export const ticketsApiChannels = [ticketStorageChannel] as const;

export const listTicketsByAccount = async (accountId?: string | null) => getTicketsByAccount(accountId);

export const listTicketsByOrder = async (orderId: string) => getTicketsByOrder(orderId);

export const listAllTickets = async (): Promise<IssuedTicketRecord[]> => getStoredTickets();
