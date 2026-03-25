import { Plus } from "lucide-react";
import type { BarItem } from "@/data/social-mock";

interface Props {
  item: BarItem;
  onAdd: (item: BarItem) => void;
}

const BarItemCard = ({ item, onAdd }: Props) => (
  <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 transition-colors active:bg-surface-elevated">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-elevated text-2xl">
      {item.image}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <h4 className="truncate text-sm font-semibold text-foreground">{item.name}</h4>
        {item.popular && (
          <span className="shrink-0 rounded-full bg-social/15 px-1.5 py-0.5 text-[9px] font-bold text-social">
            Popular
          </span>
        )}
      </div>
      <p className="truncate text-[11px] text-muted-foreground">{item.description}</p>
      <p className="mt-0.5 text-sm font-bold text-primary">
        R$ {item.price.toFixed(2)}
      </p>
    </div>
    <button
      onClick={() => onAdd(item)}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground active:bg-primary/80"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
    </button>
  </div>
);

export default BarItemCard;
