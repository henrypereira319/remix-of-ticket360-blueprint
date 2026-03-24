import {
  getStoredTickets,
  getTicketsByAccount,
  getTicketsByOrder,
  ticketStorageChannel,
  type IssuedTicketRecord,
} from "@/server/ticket.service";
import { hasConfiguredBackendUrl, requestBackendJson } from "@/lib/backend-http";

export const ticketsApiChannels = hasConfiguredBackendUrl ? (["account.remote"] as const) : ([ticketStorageChannel] as const);

export const listTicketsByAccount = async (accountId?: string | null) => {
  if (hasConfiguredBackendUrl && accountId) {
    try {
      return await requestBackendJson<IssuedTicketRecord[]>(`/api/accounts/${accountId}/tickets`);
    } catch (error) {
      console.warn("Falha ao carregar tickets remotos da conta, usando fallback local.", error);
    }
  }

  return getTicketsByAccount(accountId);
};

export const listTicketsByOrder = async (orderId: string) => getTicketsByOrder(orderId);

export const listAllTickets = async (): Promise<IssuedTicketRecord[]> => getStoredTickets();
