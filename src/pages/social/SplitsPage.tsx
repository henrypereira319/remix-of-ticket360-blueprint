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
    <div className="space-y-4 safe-top lg:px-6 lg:pb-6">
      <div className="flex items-center gap-3 px-4 pt-4 lg:px-0 lg:pt-6">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 text-muted-foreground active:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground font-display">Divisões</h1>
          <p className="text-[11px] text-muted-foreground">Itens divididos com amigos</p>
        </div>
      </div>

      <div className="grid gap-4 px-4 pb-6 lg:px-0 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="rounded-[1.75rem] border border-white/5 bg-surface/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">Status da rodada</p>
          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-1">
            <div className="rounded-2xl bg-background/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ativas</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{splits.length}</p>
            </div>
            <div className="rounded-2xl bg-background/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pendentes</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {splits.filter((split) => split.participants.some((participant) => participant.status === "pending")).length}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
        {splits.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma divisão ativa</p>
          </div>
        ) : (
            <div className="grid gap-3 2xl:grid-cols-2">
              {splits.map((split) => (
                <SplitCard key={split.id} split={split} onAccept={handleAccept} onDecline={handleDecline} />
              ))}
            </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SplitsPage;
