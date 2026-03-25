import { MessageCircle, UserPlus, Percent, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

interface QuickAction {
  icon: ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
}

interface QuickActionsProps {
  counts: { messages: number; requests: number; splits: number; orders: number };
}

const QuickActions = ({ counts }: QuickActionsProps) => {
  const actions: QuickAction[] = [
    { icon: <MessageCircle className="h-6 w-6" />, label: "Mensagem", badge: counts.messages || undefined },
    { icon: <UserPlus className="h-6 w-6" />, label: "Solicitações", badge: counts.requests || undefined },
    { icon: <Percent className="h-6 w-6" />, label: "Divisão", badge: counts.splits || undefined },
    { icon: <ShoppingBag className="h-6 w-6" />, label: "Pedidos", badge: counts.orders || undefined },
  ];

  return (
    <div className="flex items-center justify-around px-4 py-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="group flex flex-col items-center gap-1.5"
        >
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-social/30 bg-surface text-social transition-colors group-active:bg-social/10">
            {action.icon}
            {action.badge ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {action.badge}
              </span>
            ) : null}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
