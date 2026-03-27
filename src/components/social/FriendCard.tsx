import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassButton } from "@/components/ui/glass-button";
import { Check, UserPlus, X } from "lucide-react";
import type { Friend } from "@/data/social-mock";

interface Props {
  friend: Friend;
  onAccept?: (id: string) => void;
  onRemove?: (id: string) => void;
}

const FriendCard = ({ friend, onAccept, onRemove }: Props) => (
  <div className="glass-panel flex items-center gap-4 rounded-[1.75rem] border border-white/10 p-4 transition-colors hover:bg-white/6">
    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
      <AvatarImage src={friend.avatarUrl} />
      <AvatarFallback className="bg-black/45 text-xs font-semibold text-white">
        {friend.fullName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <h4 className="truncate text-sm font-semibold text-white">{friend.fullName}</h4>
        {friend.status === "accepted" ? (
          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
            Ativo
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-white/45">{friend.mutualFriends} amigos em comum</p>
    </div>

    {friend.status === "accepted" ? (
      <GlassButton
        size="icon"
        className="glass-button-soft"
        contentClassName="flex items-center justify-center text-white/80"
        onClick={() => onRemove?.(friend.id)}
        aria-label={`Remover ${friend.fullName}`}
      >
        <X className="h-4 w-4" />
      </GlassButton>
    ) : null}

    {friend.status === "pending_received" ? (
      <div className="flex gap-1.5">
        <GlassButton
          onClick={() => onAccept?.(friend.id)}
          size="icon"
          className="glass-button-primary"
          contentClassName="flex items-center justify-center text-primary-foreground"
          aria-label={`Aceitar ${friend.fullName}`}
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </GlassButton>
        <GlassButton
          size="icon"
          className="glass-button-soft"
          contentClassName="flex items-center justify-center text-white/80"
          onClick={() => onRemove?.(friend.id)}
          aria-label={`Recusar ${friend.fullName}`}
        >
          <X className="h-4 w-4" />
        </GlassButton>
      </div>
    ) : null}

    {friend.status === "pending_sent" ? (
      <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
        <UserPlus className="h-3 w-3" />
        Enviado
      </span>
    ) : null}
  </div>
);

export default FriendCard;
