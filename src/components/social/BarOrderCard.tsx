import type { BarOrder, BarOrderStatus } from "@/data/social-mock";

const statusConfig: Record<BarOrderStatus, { label: string; color: string; progress: number }> = {
  pending: { label: "Enviado", color: "bg-muted-foreground", progress: 25 },
  preparing: { label: "Preparando", color: "bg-secondary", progress: 50 },
  ready: { label: "Pronto!", color: "bg-social", progress: 75 },
  delivered: { label: "Entregue", color: "bg-social", progress: 100 },
};

interface Props {
  order: BarOrder;
}

const BarOrderCard = ({ order }: Props) => {
  const cfg = statusConfig[order.status];

  return (
    <div className="rounded-2xl bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{order.eventName}</h4>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-background ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>
      <div className="space-y-1">
        {order.items.map(({ item, quantity }) => (
          <div key={item.id} className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{quantity}× {item.name}</span>
            <span className="font-medium text-foreground">R$ {(item.price * quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
          <div className={`h-full rounded-full transition-all duration-500 ${cfg.color}`} style={{ width: `${cfg.progress}%` }} />
        </div>
        {order.estimatedMinutes !== undefined && order.estimatedMinutes > 0 && (
          <p className="text-[10px] text-muted-foreground">~{order.estimatedMinutes} min restante</p>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-sm font-bold text-primary">R$ {order.total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default BarOrderCard;
