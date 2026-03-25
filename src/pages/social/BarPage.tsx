import { useState } from "react";
import BarItemCard from "@/components/social/BarItemCard";
import BarOrderCard from "@/components/social/BarOrderCard";
import { mockBarItems, mockBarOrders, type BarItem, type BarOrder } from "@/data/social-mock";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Tab = "menu" | "pedidos";
type Category = "all" | BarItem["category"];

const categoryLabels: Record<Category, string> = {
  all: "Tudo",
  drinks: "Drinks",
  combos: "Combos",
  premium: "Premium",
  merch: "Merch",
  experience: "Experiência",
};

const BarPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("menu");
  const [category, setCategory] = useState<Category>("all");
  const [cart, setCart] = useState<{ item: BarItem; quantity: number }[]>([]);
  const [orders, setOrders] = useState<BarOrder[]>(mockBarOrders);

  const filteredItems = category === "all"
    ? mockBarItems
    : mockBarItems.filter((i) => i.category === category);

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const addToCart = (item: BarItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleOrder = () => {
    if (cart.length === 0) return;
    const newOrder: BarOrder = {
      id: `bo-${Date.now()}`,
      items: cart,
      status: "pending",
      total: cartTotal,
      eventName: "11.11 Full Open Bar",
      createdAt: new Date().toISOString(),
      estimatedMinutes: 10,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setTab("pedidos");
  };

  return (
    <div className="space-y-4 safe-top">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 text-muted-foreground active:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground font-display">Comprar no Bar</h1>
          <p className="text-[11px] text-muted-foreground">11.11 Full Open Bar</p>
        </div>
        <div className="relative">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4">
        <button
          onClick={() => setTab("menu")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            tab === "menu" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
          }`}
        >
          Cardápio
        </button>
        <button
          onClick={() => setTab("pedidos")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            tab === "pedidos" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
          }`}
        >
          Meus Pedidos ({orders.length})
        </button>
      </div>

      {tab === "menu" ? (
        <>
          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto px-4 scrollbar-none">
            {(Object.keys(categoryLabels) as Category[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  category === cat ? "bg-social text-social-foreground" : "bg-surface text-muted-foreground"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-2 px-4">
            {filteredItems.map((item) => (
              <BarItemCard key={item.id} item={item} onAdd={addToCart} />
            ))}
          </div>

          {/* Cart footer */}
          {cartCount > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-lg safe-bottom">
              <button
                onClick={handleOrder}
                className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground active:bg-primary/80"
              >
                <span>Confirmar pedido ({cartCount} itens)</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3 px-4 pb-6">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
            </div>
          ) : (
            orders.map((order) => <BarOrderCard key={order.id} order={order} />)
          )}
        </div>
      )}
    </div>
  );
};

export default BarPage;
