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
    <div className="space-y-4 safe-top">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-xl font-bold text-foreground font-display">Amigos</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-social text-social-foreground">
          <UserPlus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar amigos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4">
        <button
          onClick={() => setTab("todos")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            tab === "todos" ? "bg-social text-social-foreground" : "bg-surface text-muted-foreground"
          }`}
        >
          Todos ({accepted.length})
        </button>
        <button
          onClick={() => setTab("pendentes")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            tab === "pendentes" ? "bg-social text-social-foreground" : "bg-surface text-muted-foreground"
          }`}
        >
          Pendentes ({pending.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-2 px-4 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <UserPlus className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {tab === "todos" ? "Nenhum amigo encontrado" : "Sem solicitações pendentes"}
            </p>
          </div>
        ) : (
          filtered.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onAccept={handleAccept}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
