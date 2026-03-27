import { useState } from "react";
import FriendCard from "@/components/social/FriendCard";
import SocialPageHero from "@/components/social/SocialPageHero";
import { GlassButton } from "@/components/ui/glass-button";
import { mockFriends, type Friend } from "@/data/social-mock";
import { Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "todos" | "pendentes";

const FriendsPage = () => {
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [tab, setTab] = useState<Tab>("todos");
  const [search, setSearch] = useState("");

  const accepted = friends.filter((friend) => friend.status === "accepted");
  const pending = friends.filter((friend) => friend.status === "pending_received" || friend.status === "pending_sent");

  const filtered =
    tab === "todos"
      ? accepted.filter((friend) => friend.fullName.toLowerCase().includes(search.toLowerCase()))
      : pending;

  const handleAccept = (id: string) => {
    setFriends((prev) => prev.map((friend) => (friend.id === id ? { ...friend, status: "accepted" as const } : friend)));
  };

  const handleRemove = (id: string) => {
    setFriends((prev) => prev.filter((friend) => friend.id !== id));
  };

  return (
    <div className="space-y-5 safe-top lg:px-6 lg:pb-6">
      <div className="px-4 pt-4 lg:px-0 lg:pt-6">
        <SocialPageHero
          eyebrow="Rede EventHub"
          title="Sua rede e os encontros do evento"
          subtitle="Acompanhe quem ja entrou na sua orbita, filtre as solicitacoes e mantenha a conversa fluindo com a mesma energia visual da home."
          action={
            <GlassButton
              size="icon"
              className="glass-button-ghost glass-button-icon-lg"
              contentClassName="flex items-center justify-center text-white"
            >
              <UserPlus className="h-5 w-5" strokeWidth={2.4} />
            </GlassButton>
          }
          footer={
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,0.75fr))]">
              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-3">
                  <Search className="h-4 w-4 text-white/45" />
                  <input
                    type="text"
                    placeholder="Buscar amigos..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <GlassButton
                    onClick={() => setTab("todos")}
                    size="sm"
                    className={tab === "todos" ? "glass-button-primary" : "glass-button-soft"}
                    contentClassName={cn(
                      "text-xs font-bold uppercase tracking-[0.2em]",
                      tab === "todos" ? "text-primary-foreground" : "text-white/80",
                    )}
                  >
                    Todos ({accepted.length})
                  </GlassButton>
                  <GlassButton
                    onClick={() => setTab("pendentes")}
                    size="sm"
                    className={tab === "pendentes" ? "glass-button-primary" : "glass-button-soft"}
                    contentClassName={cn(
                      "text-xs font-bold uppercase tracking-[0.2em]",
                      tab === "pendentes" ? "text-primary-foreground" : "text-white/80",
                    )}
                  >
                    Pendentes ({pending.length})
                  </GlassButton>
                </div>
              </div>

              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Conectados</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">{accepted.length}</p>
                <p className="mt-1 text-xs text-white/45">Amigos ativos dentro da sua rede do evento.</p>
              </div>

              <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">Pendentes</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">{pending.length}</p>
                <p className="mt-1 text-xs text-white/45">Solicitacoes aguardando a sua resposta.</p>
              </div>
            </div>
          }
        />
      </div>

      <div className="px-4 pb-6 lg:px-0">
        {filtered.length === 0 ? (
          <div className="nocturne-empty-state flex min-h-[18rem] flex-col items-center justify-center gap-2 py-12">
            <UserPlus className="h-10 w-10 text-white/25" />
            <p className="text-sm text-white/55">{tab === "todos" ? "Nenhum amigo encontrado" : "Sem solicitacoes pendentes"}</p>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {filtered.map((friend) => (
              <FriendCard key={friend.id} friend={friend} onAccept={handleAccept} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
