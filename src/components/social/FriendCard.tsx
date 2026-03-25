import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, UserPlus, X } from "lucide-react";
import type { Friend } from "@/data/social-mock";

interface Props {
  friend: Friend;
  onAccept?: (id: string) => void;
  onRemove?: (id: string) => void;
}

const FriendCard = ({ friend, onAccept, onRemove }: Props) => (
  <div className="flex items-center gap-3 rounded-2xl bg-surface p-3">
    <Avatar className="h-11 w-11 ring-2 ring-border">
      <AvatarImage src={friend.avatarUrl} />
      <AvatarFallback className="bg-surface-elevated text-xs font-semibold">
        {friend.fullName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="min-w-0 flex-1">
      <h4 className="truncate text-sm font-semibold text-foreground">{friend.fullName}</h4>
      <p className="text-[11px] text-muted-foreground">{friend.mutualFriends} amigos em comum</p>
    </div>
    {friend.status === "accepted" && (
      <button
        onClick={() => onRemove?.(friend.id)}
        className="rounded-xl border border-border p-2 text-muted-foreground active:bg-surface-elevated"
      >
        <X className="h-4 w-4" />
      </button>
    )}
    {friend.status === "pending_received" && (
      <div className="flex gap-1.5">
        <button
          onClick={() => onAccept?.(friend.id)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-social text-social-foreground active:bg-social/80"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => onRemove?.(friend.id)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground active:bg-surface-elevated"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )}
    {friend.status === "pending_sent" && (
      <span className="flex items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
        <UserPlus className="h-3 w-3" />
        Enviado
      </span>
    )}
  </div>
);

export default FriendCard;
