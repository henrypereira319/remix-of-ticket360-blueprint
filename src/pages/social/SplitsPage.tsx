import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SplitCard from "@/components/social/SplitCard";
import { mockSplitRequests } from "@/data/social-mock";
import { useState, type ComponentProps } from "react";

const SplitsPage = () => {
  const navigate = useNavigate();
  const [splits, setSplits] = useState(mockSplitRequests);

  const handleAccept = (id: string) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              participants: s.participants.map((p) =>
                p.friendId === "current" ? { ...p, status: "accepted" as const } : p
              ),
            }
          : s
      )
    );
  };

  const handleDecline = (id: string) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              participants: s.participants.map((p) =>
                p.friendId === "current" ? { ...p, status: "declined" as const } : p
              ),
            }
          : s
      )
    );
  };

  return (
    <div className="space-y-4 safe-top">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 text-muted-foreground active:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground font-display">Divisões</h1>
          <p className="text-[11px] text-muted-foreground">Itens divididos com amigos</p>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-6">
        {splits.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma divisão ativa</p>
          </div>
        ) : (
          splits.map((split) => (
            <SplitCard key={split.id} split={split} onAccept={handleAccept} onDecline={handleDecline} />
          ))
        )}
      </div>
    </div>
  );
};

export default SplitsPage;
