import { Ticket } from "lucide-react";

const TicketsPage = () => (
  <div className="space-y-4 safe-top lg:px-6 lg:pb-6">
    <div className="px-4 pt-4 lg:px-0 lg:pt-6">
      <h1 className="text-xl font-bold text-foreground font-display">Meus Tickets</h1>
      <p className="mt-1 text-xs text-muted-foreground">Ingressos comprados e QR codes</p>
    </div>
    <div className="px-4 lg:px-0">
      <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-border bg-surface/45 px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
          <Ticket className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Seus ingressos aparecerão aqui após a compra
        </p>
        <p className="max-w-xs text-[11px] text-muted-foreground/70">
          Navegue pelos eventos na Home e compre seu primeiro ingresso para começar.
        </p>
      </div>
    </div>
  </div>
);

export default TicketsPage;
