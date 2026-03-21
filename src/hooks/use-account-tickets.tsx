import { useEffect, useState } from "react";
import type { IssuedTicketRecord } from "@/server/ticket.service";
import { listTicketsByAccount, ticketsApiChannels } from "@/server/api/tickets.api";
import { useStorageChannelVersion } from "@/hooks/use-storage-channel-version";

export const useAccountTickets = (accountId?: string | null) => {
  const version = useStorageChannelVersion([...ticketsApiChannels]);
  const [tickets, setTickets] = useState<IssuedTicketRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextTickets = await listTicketsByAccount(accountId);

      if (!cancelled) {
        setTickets(nextTickets);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [accountId, version]);

  return { tickets };
};
