import { GlassButton } from "@/components/ui/glass-button";
import { Plus } from "lucide-react";
import type { BarItem } from "@/data/social-mock";

interface Props {
  item: BarItem;
  onAdd: (item: BarItem) => void;
}

const BarItemCard = ({ item, onAdd }: Props) => (
  <div className="glass-panel flex items-center gap-4 rounded-[1.75rem] border border-white/10 p-4 transition-colors hover:bg-white/[0.06]">
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
      {item.image}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <h4 className="truncate text-sm font-semibold text-white">{item.name}</h4>
        {item.popular ? (
          <span className="rounded-full border border-primary/20 bg-primary/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
            Popular
          </span>
        ) : null}
      </div>
      <p className="mt-1 truncate text-[11px] text-white/45">{item.description}</p>
      <p className="mt-1 text-sm font-bold text-primary">R$ {item.price.toFixed(2)}</p>
    </div>
    <GlassButton
      onClick={() => onAdd(item)}
      size="icon"
      className="h-11 w-11 shrink-0 text-primary"
      aria-label={`Adicionar ${item.name}`}
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
    </GlassButton>
  </div>
);

export default BarItemCard;
