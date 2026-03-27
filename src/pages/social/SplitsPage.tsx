import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SocialPageHero from "@/components/social/SocialPageHero";
import { GlassButton } from "@/components/ui/glass-button";
import SplitCard from "@/components/social/SplitCard";
import { mockSplitRequests } from "@/data/social-mock";
import { useState } from "react";

const SplitsPage = () => {
  const navigate = useNavigate();
  const [splits, setSplits] = useState(mockSplitRequests);

  const handleAccept = (id: string) => {
    setSplits((prev) =>
      prev.map((split) =>
        split.id === id
          ? {
              ...split,
              participants: split.participants.map((participant) =>
                participant.friendId === "current" ? { ...participant, status: "accepted" as const } : participant,
              ),
            }
          : split,
      ),
    );
  };

  const handleDecline = (id: string) => {
    setSplits((prev) =>
      prev.map((split) =>
        split.id === id
          ? {
              ...split,
              participants: split.participants.map((participant) =>
                participant.friendId === "current" ? { ...participant, status: "declined" as const } : participant,
              ),
            }
          : split,
      ),
    );
  };

  return (
    <div className="space-y-5 safe-top lg:px-6 lg:pb-6">
      <div className="px-4 pt-4 lg:px-0 lg:pt-6">
        <SocialPageHero
          eyebrow="Rateios e pedidos"
          title="Divisao premium da sua galera"
          subtitle="Os convites de pagamento agora entram no mesmo clima visual da home, com leitura mais forte para progresso, valor e resposta pendente."
          action={
            <GlassButton
              size="icon"
              className="glass-button-ghost glass-button-icon-lg"
              contentClassName="flex items-center justify-center text-white"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </GlassButton>
          }
          footer={
            <div className="grid gap-3 md:grid-cols-3">
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">Ativas</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">{splits.length}</p>
                <p className="mt-1 text-xs text-white/45">Divisoes abertas no seu grupo.</p>
              </div>
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Pendentes</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">
                  {splits.filter((split) => split.participants.some((participant) => participant.status === "pending")).length}
                </p>
                <p className="mt-1 text-xs text-white/45">Aguardando acao da sua rede.</p>
              </div>
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Ritmo da rodada</p>
                <p className="mt-3 text-lg font-bold text-white">{splits.length > 0 ? "Pagamentos em movimento" : "Sem rodadas abertas"}</p>
                <p className="mt-1 text-xs text-white/45">Acompanhe quem aceitou, pagou ou recusou cada item.</p>
              </div>
            </div>
          }
        />
      </div>

      <div className="px-4 pb-6 lg:px-0">
        <div className="space-y-3">
          {splits.length === 0 ? (
            <div className="nocturne-empty-state flex flex-col items-center gap-2 py-12">
              <p className="text-sm text-white/55">Nenhuma divisao ativa</p>
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
