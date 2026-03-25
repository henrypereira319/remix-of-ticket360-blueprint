import { useState } from "react";
import FriendCard from "@/components/social/FriendCard";
import { mockFriends, type Friend } from "@/data/social-mock";
import { Search, UserPlus } from "lucide-react";

type Tab = "todos" | "pendentes";

const FriendsPage = () => {
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [tab, setTab] = useState<Tab>("todos");
  const [search, setSearch] = useState("");

  const accepted = friends.filter((f) => f.status === "accepted");
  const pending = friends.filter((f) => f.status === "pending_received" || f.status === "pending_sent");

  const filtered =
    tab === "todos"
      ? accepted.filter((f) => f.fullName.toLowerCase().includes(search.toLowerCase()))
      : pending;

  const handleAccept = (id: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "accepted" as const } : f))
    );
  };

  const handleRemove = (id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4 safe-top lg:px-6 lg:pb-6">
      <div className="flex items-center justify-between px-4 pt-4 lg:px-0 lg:pt-6">
        <h1 className="text-xl font-bold text-foreground font-display">Amigos</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-social text-social-foreground">
          <UserPlus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-4 px-4 lg:px-0">
          <div className="rounded-[1.75rem] border border-white/5 bg-surface/70 p-4">
            <div className="flex items-center gap-2 rounded-xl bg-background/55 px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar amigos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>

            <div className="mt-4 flex gap-1">
              <button
                onClick={() => setTab("todos")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  tab === "todos" ? "bg-social text-social-foreground" : "bg-background/60 text-muted-foreground"
                }`}
              >
                Todos ({accepted.length})
              </button>
              <button
                onClick={() => setTab("pendentes")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  tab === "pendentes" ? "bg-social text-social-foreground" : "bg-background/60 text-muted-foreground"
                }`}
              >
                Pendentes ({pending.length})
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background/55 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Conectados</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{accepted.length}</p>
              </div>
              <div className="rounded-2xl bg-background/55 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pendentes</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{pending.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 px-4 pb-6 lg:px-0">
          {filtered.length === 0 ? (
            <div className="flex min-h-[18rem] flex-col items-center justify-center gap-2 rounded-[1.75rem] border border-dashed border-border bg-surface/40 py-12 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {tab === "todos" ? "Nenhum amigo encontrado" : "Sem solicitações pendentes"}
              </p>
            </div>
          ) : (
            <div className="grid gap-2 xl:grid-cols-2">
              {filtered.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onAccept={handleAccept}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
