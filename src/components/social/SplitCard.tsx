import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Clock, X } from "lucide-react";
import type { SplitRequest, SplitStatus } from "@/data/social-mock";

const statusIcon: Record<SplitStatus, React.ReactNode> = {
  paid: <Check className="h-3 w-3 text-social" />,
  accepted: <Check className="h-3 w-3 text-secondary" />,
  pending: <Clock className="h-3 w-3 text-muted-foreground" />,
  declined: <X className="h-3 w-3 text-destructive" />,
  expired: <Clock className="h-3 w-3 text-destructive" />,
  completed: <Check className="h-3 w-3 text-social" />,
};

const statusLabel: Record<SplitStatus, string> = {
  paid: "Pago",
  accepted: "Aceito",
  pending: "Pendente",
  declined: "Recusado",
  expired: "Expirado",
  completed: "Concluído",
};

interface Props {
  split: SplitRequest;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}

const SplitCard = ({ split, onAccept, onDecline }: Props) => {
  const paidCount = split.participants.filter((p) => p.status === "paid").length;
  const totalCount = split.participants.length;
  const progress = (paidCount / totalCount) * 100;
  const myParticipation = split.participants.find((p) => p.friendId === "current");

  return (
    <div className="rounded-2xl bg-surface p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-2xl">
          {split.itemImage}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-foreground">{split.itemName}</h4>
          <p className="text-[11px] text-muted-foreground">{split.eventName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">R$ {split.totalAmount.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">÷ {totalCount}</p>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-2">
        {split.participants.map((p) => (
          <div key={p.friendId} className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={p.friendAvatar} />
              <AvatarFallback className="bg-surface-elevated text-[8px]">{p.friendName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-xs text-foreground">{p.friendName}</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              R$ {p.amount.toFixed(2)}
              {statusIcon[p.status]}
              <span>{statusLabel[p.status]}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
          <div className="h-full rounded-full bg-social transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground">{paidCount}/{totalCount} pagos</p>
      </div>

      {/* CTA for current user */}
      {myParticipation && myParticipation.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAccept?.(split.id)}
            className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground active:bg-primary/80"
          >
            Aceitar · R$ {myParticipation.amount.toFixed(2)}
          </button>
          <button
            onClick={() => onDecline?.(split.id)}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground active:bg-surface-elevated"
          >
            Recusar
          </button>
        </div>
      )}
    </div>
  );
};

export default SplitCard;
