import { MessageCircle, Percent, ShoppingBag, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: ReactNode;
  label: string;
  badge?: number;
  to: string;
}

interface QuickActionsProps {
  counts: { messages: number; requests: number; splits: number; orders: number };
  variant?: "default" | "hero";
}

const QuickActions = ({ counts, variant = "default" }: QuickActionsProps) => {
  const actions: QuickAction[] = [
    { icon: <MessageCircle className="h-6 w-6" />, label: "Mensagem", badge: counts.messages || undefined, to: "/app/amigos" },
    { icon: <UserPlus className="h-6 w-6" />, label: "Solicitações", badge: counts.requests || undefined, to: "/app/amigos" },
    { icon: <Percent className="h-6 w-6" />, label: "Divisão", badge: counts.splits || undefined, to: "/app/divisoes" },
    { icon: <ShoppingBag className="h-6 w-6" />, label: "Pedidos", badge: counts.orders || undefined, to: "/app/bar" },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-4",
        variant === "hero" ? "gap-2 sm:gap-3" : "gap-3 px-4 py-3 lg:px-0 lg:py-0",
      )}
    >
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className={cn(
            "group flex flex-col items-center gap-1.5 bg-transparent transition-transform hover:-translate-y-0.5",
            variant === "hero" ? "px-0 py-0" : "px-2 py-3 lg:items-start lg:gap-3 lg:px-1 lg:py-1",
          )}
        >
          <div
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-2xl transition-colors group-active:scale-[0.98]",
              variant === "hero"
                ? "border border-white/12 bg-black/45 text-white backdrop-blur-md"
                : "border border-social/30 bg-surface text-social group-active:bg-social/10",
            )}
          >
            {action.icon}
            {action.badge ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {action.badge}
              </span>
            ) : null}
          </div>
          <span
            className={cn(
              "text-center text-[10px] font-medium lg:text-xs",
              variant === "hero" ? "text-white/82" : "text-muted-foreground",
            )}
          >
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;
