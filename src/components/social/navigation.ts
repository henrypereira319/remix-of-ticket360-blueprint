import { Home, Map, Percent, ShoppingBag, Ticket, User, Users } from "lucide-react";

export const socialNavTabs = [
  { to: "/app", icon: Home, label: "Home" },
  { to: "/app/amigos", icon: Users, label: "Amigos" },
  { to: "/app/tickets", icon: Ticket, label: "Tickets" },
  { to: "/app/mapa", icon: Map, label: "Mapa" },
  { to: "/app/perfil", icon: User, label: "Perfil" },
] as const;

export const socialQuickLinks = [
  { to: "/app/bar", icon: ShoppingBag, label: "Pedidos no bar", description: "Compra in-bar e acompanhamento" },
  { to: "/app/divisoes", icon: Percent, label: "Divisões", description: "Rateio de itens premium com amigos" },
] as const;

const socialRouteOrder = [
  "/app",
  "/app/amigos",
  "/app/tickets",
  "/app/mapa",
  "/app/perfil",
  "/app/bar",
  "/app/divisoes",
] as const;

export const getSocialRouteIndex = (pathname: string) => {
  const exactMatch = socialRouteOrder.findIndex((route) => route === pathname);

  if (exactMatch >= 0) {
    return exactMatch;
  }

  const partialMatch = socialRouteOrder.findIndex((route) => route !== "/app" && pathname.startsWith(route));
  return partialMatch >= 0 ? partialMatch : 0;
};
