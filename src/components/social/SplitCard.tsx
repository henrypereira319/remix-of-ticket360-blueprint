import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassButton } from "@/components/ui/glass-button";
import { Check, Clock, X } from "lucide-react";
import type { SplitRequest, SplitStatus } from "@/data/social-mock";

const statusIcon: Record<SplitStatus, React.ReactNode> = {
  paid: <Check className="h-3 w-3 text-primary" />,
  accepted: <Check className="h-3 w-3 text-secondary" />,
  pending: <Clock className="h-3 w-3 text-white/45" />,
  declined: <X className="h-3 w-3 text-destructive" />,
  expired: <Clock className="h-3 w-3 text-destructive" />,
  completed: <Check className="h-3 w-3 text-primary" />,
};

const statusLabel: Record<SplitStatus, string> = {
  paid: "Pago",
  accepted: "Aceito",
  pending: "Pendente",
  declined: "Recusado",
  expired: "Expirado",
  completed: "Concluido",
};

interface Props {
  split: SplitRequest;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}

const SplitCard = ({ split, onAccept, onDecline }: Props) => {
  const paidCount = split.participants.filter((participant) => participant.status === "paid").length;
  const totalCount = split.participants.length;
  const progress = (paidCount / totalCount) * 100;
  const myParticipation = split.participants.find((participant) => participant.friendId === "current");

  return (
    <div className="glass-panel space-y-4 rounded-[1.9rem] border border-white/10 p-4 transition-colors hover:bg-white/[0.05]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
          {split.itemImage}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-white">{split.itemName}</h4>
          <p className="text-[11px] text-white/45">{split.eventName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">R$ {split.totalAmount.toFixed(2)}</p>
          <p className="text-[10px] text-white/35">/ {totalCount}</p>
        </div>
      </div>

      <div className="space-y-2">
        {split.participants.map((participant) => (
          <div key={participant.friendId} className="flex items-center gap-2 rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-3 py-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={participant.friendAvatar} />
              <AvatarFallback className="bg-black/40 text-[8px] text-white">
                {participant.friendName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-xs text-white">{participant.friendName}</span>
            <span className="flex items-center gap-1 text-[10px] text-white/55">
              R$ {participant.amount.toFixed(2)}
              {statusIcon[participant.status]}
              <span>{statusLabel[participant.status]}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-white/45">
          {paidCount}/{totalCount} pagos
        </p>
      </div>

      {myParticipation && myParticipation.status === "pending" ? (
        <div className="flex gap-2 pt-1">
          <GlassButton
            onClick={() => onAccept?.(split.id)}
            className="flex-1 text-primary"
            contentClassName="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]"
          >
            Aceitar - R$ {myParticipation.amount.toFixed(2)}
          </GlassButton>
          <GlassButton
            onClick={() => onDecline?.(split.id)}
            contentClassName="px-4 py-3 text-xs font-medium text-white/75"
          >
            Recusar
          </GlassButton>
        </div>
      ) : null}
    </div>
  );
};

export default SplitCard;
