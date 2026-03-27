import type { BarOrder, BarOrderStatus } from "@/data/social-mock";

const statusConfig: Record<BarOrderStatus, { label: string; color: string; progress: number }> = {
  pending: { label: "Enviado", color: "bg-white/50", progress: 25 },
  preparing: { label: "Preparando", color: "bg-secondary", progress: 50 },
  ready: { label: "Pronto", color: "bg-primary", progress: 75 },
  delivered: { label: "Entregue", color: "bg-primary", progress: 100 },
};

interface Props {
  order: BarOrder;
}

const BarOrderCard = ({ order }: Props) => {
  const cfg = statusConfig[order.status];

  return (
    <div className="glass-panel space-y-4 rounded-[1.9rem] border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{order.eventName}</h4>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className="space-y-2 rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-3">
        {order.items.map(({ item, quantity }) => (
          <div key={item.id} className="flex items-center justify-between text-xs text-white/50">
            <span>
              {quantity}x {item.name}
            </span>
            <span className="font-medium text-white">R$ {(item.price * quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full transition-all duration-500 ${cfg.color}`} style={{ width: `${cfg.progress}%` }} />
        </div>
        {order.estimatedMinutes !== undefined && order.estimatedMinutes > 0 ? (
          <p className="text-[10px] text-white/45">~{order.estimatedMinutes} min restante</p>
        ) : null}
      </div>
      <div className="flex items-center justify-between border-t border-white/10 pt-2">
        <span className="text-xs text-white/45">Total</span>
        <span className="text-sm font-bold text-primary">R$ {order.total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default BarOrderCard;
