import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/ticketing";

interface SeatJourneyFloatingBarProps {
  itemCount: number;
  total: number;
  hasSelection: boolean;
  onScrollToCheckout: () => void;
}

/**
 * Minimal floating bar at the bottom showing selection count + total.
 * Only visible when there's a selection.
 */
const SeatJourneyFloatingBar = ({
  itemCount,
  total,
  hasSelection,
  onScrollToCheckout,
}: SeatJourneyFloatingBarProps) => {
  if (!hasSelection) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/92 px-5 py-3 shadow-2xl backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Assentos</p>
            <p className="text-lg font-bold text-slate-900">{itemCount}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(total)}</p>
          </div>
        </div>

        <Button size="sm" onClick={onScrollToCheckout} className="whitespace-nowrap">
          <CreditCard className="h-4 w-4" />
          Revisar pedido
        </Button>
      </div>
    </div>
  );
};

export default SeatJourneyFloatingBar;
