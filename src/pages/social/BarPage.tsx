import { useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SocialPageHero from "@/components/social/SocialPageHero";
import BarItemCard from "@/components/social/BarItemCard";
import BarOrderCard from "@/components/social/BarOrderCard";
import { GlassButton } from "@/components/ui/glass-button";
import { mockBarItems, mockBarOrders, type BarItem, type BarOrder } from "@/data/social-mock";
import { cn } from "@/lib/utils";

type Tab = "menu" | "pedidos";
type Category = "all" | BarItem["category"];

const categoryLabels: Record<Category, string> = {
  all: "Tudo",
  drinks: "Drinks",
  combos: "Combos",
  premium: "Premium",
  merch: "Merch",
  experience: "Experiencia",
};

const BarPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("menu");
  const [category, setCategory] = useState<Category>("all");
  const [cart, setCart] = useState<{ item: BarItem; quantity: number }[]>([]);
  const [orders, setOrders] = useState<BarOrder[]>(mockBarOrders);

  const filteredItems = category === "all" ? mockBarItems : mockBarItems.filter((item) => item.category === category);
  const cartTotal = cart.reduce((sum, current) => sum + current.item.price * current.quantity, 0);
  const cartCount = cart.reduce((sum, current) => sum + current.quantity, 0);

  const addToCart = (item: BarItem) => {
    setCart((prev) => {
      const existing = prev.find((current) => current.item.id === item.id);
      if (existing) {
        return prev.map((current) => (current.item.id === item.id ? { ...current, quantity: current.quantity + 1 } : current));
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
    <div className="space-y-5 safe-top lg:px-6 lg:pb-6">
      <div className="px-4 pt-4 lg:px-0 lg:pt-6">
        <SocialPageHero
          eyebrow="Open bar"
          title="Consumo, pedidos e retirada em um fluxo premium"
          subtitle="O cardapio e o acompanhamento dos pedidos agora usam a mesma UI da home, com destaque mais forte para categorias, itens e CTA final."
          action={
            <div className="flex items-center gap-3">
              <GlassButton onClick={() => navigate(-1)} size="icon" className="h-14 w-14" aria-label="Voltar">
                <ArrowLeft className="h-5 w-5" />
              </GlassButton>
              <div className="relative flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/10 bg-black/55 text-white">
                <ShoppingBag className="h-5 w-5 text-white/80" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-black text-white">
                    {cartCount}
                  </span>
                ) : null}
              </div>
            </div>
          }
          footer={
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <GlassButton
                  onClick={() => setTab("menu")}
                  size="sm"
                  className={cn(tab === "menu" && "text-primary")}
                  contentClassName="text-xs font-bold uppercase tracking-[0.2em]"
                >
                  Cardapio
                </GlassButton>
                <GlassButton
                  onClick={() => setTab("pedidos")}
                  size="sm"
                  className={cn(tab === "pedidos" && "text-primary")}
                  contentClassName="text-xs font-bold uppercase tracking-[0.2em]"
                >
                  Meus Pedidos ({orders.length})
                </GlassButton>
              </div>

              {tab === "menu" ? (
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {(Object.keys(categoryLabels) as Category[]).map((currentCategory) => (
                    <GlassButton
                      key={currentCategory}
                      onClick={() => setCategory(currentCategory)}
                      size="sm"
                      className={cn("shrink-0", category === currentCategory && "text-primary")}
                      contentClassName="text-[11px] font-bold uppercase tracking-[0.18em]"
                    >
                      {categoryLabels[currentCategory]}
                    </GlassButton>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Pedidos ativos</p>
                    <p className="mt-3 text-4xl font-black tracking-tight text-white">{orders.length}</p>
                    <p className="mt-1 text-xs text-white/45">Historico de pedidos enviados no evento.</p>
                  </div>
                  <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">Carrinho</p>
                    <p className="mt-3 text-4xl font-black tracking-tight text-white">{cartCount}</p>
                    <p className="mt-1 text-xs text-white/45">Itens aguardando confirmacao de compra.</p>
                  </div>
                  <div className="glass-panel rounded-[1.6rem] border border-white/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Subtotal atual</p>
                    <p className="mt-3 text-2xl font-black tracking-tight text-white">R$ {cartTotal.toFixed(2)}</p>
                    <p className="mt-1 text-xs text-white/45">Pronto para seguir direto para o envio.</p>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </div>

      {tab === "menu" ? (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <div className="space-y-4">
            <div className="grid gap-2 px-4 lg:px-0 xl:grid-cols-2">
              {filteredItems.map((item) => (
                <BarItemCard key={item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="nocturne-panel sticky top-8 space-y-4 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Carrinho atual</p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  {cartCount > 0 ? `${cartCount} itens selecionados` : "Monte seu pedido"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-white/55">
                  Adicione consumiveis do cardapio para confirmar seu pedido sem fila.
                </p>
              </div>

              {cart.length > 0 ? (
                <div className="space-y-3">
                  <div className="nocturne-panel-soft space-y-2 p-4">
                    {cart.map(({ item, quantity }) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{item.name}</p>
                          <p className="text-xs text-white/45">{quantity}x no carrinho</p>
                        </div>
                        <p className="font-semibold text-primary">R$ {(item.price * quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <GlassButton
                    onClick={handleOrder}
                    className="w-full text-primary"
                    contentClassName="flex items-center justify-between px-5 py-3.5 text-sm font-bold"
                  >
                    <span>Confirmar pedido</span>
                    <span>R$ {cartTotal.toFixed(2)}</span>
                  </GlassButton>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/45">
                  Os itens adicionados aparecem aqui com subtotal e CTA final de compra.
                </div>
              )}
            </div>
          </aside>

          {cartCount > 0 ? (
            <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur-2xl lg:hidden">
              <GlassButton
                onClick={handleOrder}
                className="w-full text-primary"
                contentClassName="flex items-center justify-between px-5 py-3.5 text-sm font-bold"
              >
                <span>Confirmar pedido ({cartCount} itens)</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </GlassButton>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3 px-4 pb-6 lg:px-0">
          {orders.length === 0 ? (
            <div className="nocturne-empty-state flex flex-col items-center gap-2 py-12">
              <ShoppingBag className="h-10 w-10 text-white/25" />
              <p className="text-sm text-white/55">Nenhum pedido ainda</p>
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {orders.map((order) => (
                <BarOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BarPage;
