/**
 * Mock data for the social / in-bar / split-payment features.
 * Everything here is fake but realistic — ready to swap for real API calls.
 */

// ── Friends ──────────────────────────────────────────────────────────
export type FriendshipStatus = "accepted" | "pending_sent" | "pending_received";

export interface Friend {
  id: string;
  fullName: string;
  avatarUrl: string;
  status: FriendshipStatus;
  mutualFriends: number;
  lastSeen?: string;
}

export const mockFriends: Friend[] = [
  { id: "f1", fullName: "Larissa Mendes", avatarUrl: "https://i.pravatar.cc/150?u=larissa", status: "accepted", mutualFriends: 5, lastSeen: "2026-03-25T01:12:00Z" },
  { id: "f2", fullName: "Marcio Oliveira", avatarUrl: "https://i.pravatar.cc/150?u=marcio", status: "accepted", mutualFriends: 3, lastSeen: "2026-03-25T00:45:00Z" },
  { id: "f3", fullName: "Camila Souza", avatarUrl: "https://i.pravatar.cc/150?u=camila", status: "accepted", mutualFriends: 8, lastSeen: "2026-03-24T23:30:00Z" },
  { id: "f4", fullName: "Rafael Costa", avatarUrl: "https://i.pravatar.cc/150?u=rafael", status: "accepted", mutualFriends: 2 },
  { id: "f5", fullName: "Juliana Alves", avatarUrl: "https://i.pravatar.cc/150?u=juliana", status: "accepted", mutualFriends: 4 },
  { id: "f6", fullName: "Pedro Henrique", avatarUrl: "https://i.pravatar.cc/150?u=pedro", status: "pending_sent", mutualFriends: 1 },
  { id: "f7", fullName: "Amanda Rocha", avatarUrl: "https://i.pravatar.cc/150?u=amanda", status: "pending_received", mutualFriends: 6 },
  { id: "f8", fullName: "Lucas Ferreira", avatarUrl: "https://i.pravatar.cc/150?u=lucas", status: "pending_received", mutualFriends: 2 },
];

// ── Social Feed ──────────────────────────────────────────────────────
export type FeedActionType =
  | "bought_ticket"
  | "confirmed_presence"
  | "bought_at_bar"
  | "opened_split"
  | "created_group"
  | "favorited_event"
  | "recommended_event";

export interface FeedItem {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar: string;
  action: FeedActionType;
  description: string;
  eventName: string;
  eventImage: string;
  eventDate: string;
  timestamp: string;
  socialProof?: string;
}

const eventImages = [
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop",
];

export const mockFeedItems: FeedItem[] = [
  {
    id: "feed1", friendId: "f1", friendName: "Larissa Mendes", friendAvatar: "https://i.pravatar.cc/150?u=larissa",
    action: "opened_split", description: "abriu divisão de balde premium",
    eventName: "11.11 Full Open Bar", eventImage: eventImages[0], eventDate: "11/11/2026", timestamp: "2026-03-25T01:00:00Z",
    socialProof: "3 amigos participando",
  },
  {
    id: "feed2", friendId: "f2", friendName: "Marcio Oliveira", friendAvatar: "https://i.pravatar.cc/150?u=marcio",
    action: "bought_at_bar", description: "pediu 1 combo duplo",
    eventName: "Corcovado Festival", eventImage: eventImages[1], eventDate: "21/10/2025", timestamp: "2026-03-25T00:40:00Z",
    socialProof: "5 amigos neste evento",
  },
  {
    id: "feed3", friendId: "f3", friendName: "Camila Souza", friendAvatar: "https://i.pravatar.cc/150?u=camila",
    action: "bought_ticket", description: "comprou ingresso VIP",
    eventName: "Saralina Night", eventImage: eventImages[2], eventDate: "21/10/2025", timestamp: "2026-03-24T23:20:00Z",
    socialProof: "2 amigos vão",
  },
  {
    id: "feed4", friendId: "f4", friendName: "Rafael Costa", friendAvatar: "https://i.pravatar.cc/150?u=rafael",
    action: "created_group", description: "criou grupo para ir junto",
    eventName: "Elbly Tour 2025", eventImage: eventImages[3], eventDate: "21/10/2025", timestamp: "2026-03-24T22:00:00Z",
    socialProof: "4 amigos no grupo",
  },
  {
    id: "feed5", friendId: "f5", friendName: "Juliana Alves", friendAvatar: "https://i.pravatar.cc/150?u=juliana",
    action: "confirmed_presence", description: "confirmou presença",
    eventName: "Melhor eu Ir", eventImage: eventImages[4], eventDate: "21/10/2025", timestamp: "2026-03-24T21:30:00Z",
    socialProof: "2 amigos confirmados",
  },
  {
    id: "feed6", friendId: "f1", friendName: "Larissa Mendes", friendAvatar: "https://i.pravatar.cc/150?u=larissa",
    action: "favorited_event", description: "favoritou este evento",
    eventName: "Noite Eletrônica SP", eventImage: eventImages[5], eventDate: "15/11/2026", timestamp: "2026-03-24T20:00:00Z",
  },
];

// ── Social Event Cards (for grid) ────────────────────────────────────
export interface SocialEventCard {
  id: string;
  name: string;
  image: string;
  date: string;
  friendsGoing: number;
  friendAvatars: string[];
  slug: string;
}

export const mockSocialEvents: SocialEventCard[] = [
  { id: "se1", name: "Corcovado", image: eventImages[1], date: "21/10/2025", friendsGoing: 2, friendAvatars: ["https://i.pravatar.cc/150?u=larissa", "https://i.pravatar.cc/150?u=marcio"], slug: "corcovado" },
  { id: "se2", name: "Saralina", image: eventImages[2], date: "21/10/2025", friendsGoing: 0, friendAvatars: [], slug: "saralina" },
  { id: "se3", name: "Elbly", image: eventImages[3], date: "21/10/2025", friendsGoing: 2, friendAvatars: ["https://i.pravatar.cc/150?u=rafael", "https://i.pravatar.cc/150?u=camila"], slug: "elbly" },
  { id: "se4", name: "Melhor eu Ir", image: eventImages[4], date: "21/10/2025", friendsGoing: 2, friendAvatars: ["https://i.pravatar.cc/150?u=juliana", "https://i.pravatar.cc/150?u=pedro"], slug: "melhor-eu-ir" },
  { id: "se5", name: "Noite Eletrônica", image: eventImages[5], date: "15/11/2026", friendsGoing: 3, friendAvatars: ["https://i.pravatar.cc/150?u=larissa", "https://i.pravatar.cc/150?u=camila", "https://i.pravatar.cc/150?u=rafael"], slug: "noite-eletronica" },
  { id: "se6", name: "11.11 Open Bar", image: eventImages[0], date: "11/11/2026", friendsGoing: 5, friendAvatars: ["https://i.pravatar.cc/150?u=larissa", "https://i.pravatar.cc/150?u=marcio", "https://i.pravatar.cc/150?u=camila"], slug: "full-open-bar" },
];

// ── Bar Menu ─────────────────────────────────────────────────────────
export type BarOrderStatus = "pending" | "preparing" | "ready" | "delivered";

export interface BarItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "drinks" | "combos" | "premium" | "merch" | "experience";
  popular?: boolean;
}

export interface BarOrder {
  id: string;
  items: { item: BarItem; quantity: number }[];
  status: BarOrderStatus;
  total: number;
  eventName: string;
  createdAt: string;
  estimatedMinutes?: number;
}

export const mockBarItems: BarItem[] = [
  { id: "b1", name: "Caipirinha Clássica", description: "Cachaça, limão, açúcar e gelo", price: 22, image: "🍹", category: "drinks", popular: true },
  { id: "b2", name: "Gin Tônica Premium", description: "Gin Tanqueray, tônica Fever-Tree e pepino", price: 35, image: "🥂", category: "drinks" },
  { id: "b3", name: "Cerveja Artesanal IPA", description: "IPA local 600ml bem gelada", price: 28, image: "🍺", category: "drinks", popular: true },
  { id: "b4", name: "Água Mineral 500ml", description: "Com ou sem gás", price: 8, image: "💧", category: "drinks" },
  { id: "b5", name: "Energético 250ml", description: "Red Bull ou Monster", price: 18, image: "⚡", category: "drinks" },
  { id: "b6", name: "Combo Duplo", description: "2 drinks + 1 porção de batata", price: 65, image: "🍟", category: "combos", popular: true },
  { id: "b7", name: "Combo Premium", description: "Garrafa de vodka + 4 energéticos + gelo", price: 180, image: "🍾", category: "combos" },
  { id: "b8", name: "Balde de Cerveja 5un", description: "5 long necks em balde com gelo", price: 75, image: "🧊", category: "premium", popular: true },
  { id: "b9", name: "Garrafa Absolut", description: "Vodka Absolut 1L + mixer", price: 220, image: "🥃", category: "premium" },
  { id: "b10", name: "Camiseta do Evento", description: "Algodão premium, vários tamanhos", price: 89, image: "👕", category: "merch" },
  { id: "b11", name: "Experiência Backstage", description: "Acesso ao backstage por 15 min", price: 350, image: "🎤", category: "experience" },
];

export const mockBarOrders: BarOrder[] = [
  {
    id: "bo1",
    items: [{ item: mockBarItems[0], quantity: 2 }, { item: mockBarItems[3], quantity: 1 }],
    status: "ready",
    total: 52,
    eventName: "11.11 Full Open Bar",
    createdAt: "2026-03-25T00:30:00Z",
    estimatedMinutes: 0,
  },
  {
    id: "bo2",
    items: [{ item: mockBarItems[5], quantity: 1 }],
    status: "preparing",
    total: 65,
    eventName: "11.11 Full Open Bar",
    createdAt: "2026-03-25T01:05:00Z",
    estimatedMinutes: 5,
  },
];

// ── Split Payment ────────────────────────────────────────────────────
export type SplitStatus = "pending" | "accepted" | "paid" | "declined" | "expired" | "completed";

export interface SplitParticipant {
  friendId: string;
  friendName: string;
  friendAvatar: string;
  amount: number;
  status: SplitStatus;
}

export interface SplitRequest {
  id: string;
  itemName: string;
  itemImage: string;
  totalAmount: number;
  creatorId: string;
  creatorName: string;
  eventName: string;
  participants: SplitParticipant[];
  status: SplitStatus;
  createdAt: string;
  expiresAt: string;
}

export const mockSplitRequests: SplitRequest[] = [
  {
    id: "sp1",
    itemName: "Balde Premium 10 Cervejas",
    itemImage: "🧊",
    totalAmount: 150,
    creatorId: "f1",
    creatorName: "Larissa Mendes",
    eventName: "11.11 Full Open Bar",
    participants: [
      { friendId: "f1", friendName: "Larissa Mendes", friendAvatar: "https://i.pravatar.cc/150?u=larissa", amount: 50, status: "paid" },
      { friendId: "f2", friendName: "Marcio Oliveira", friendAvatar: "https://i.pravatar.cc/150?u=marcio", amount: 50, status: "accepted" },
      { friendId: "current", friendName: "Você", friendAvatar: "", amount: 50, status: "pending" },
    ],
    status: "pending",
    createdAt: "2026-03-25T00:50:00Z",
    expiresAt: "2026-03-25T02:50:00Z",
  },
  {
    id: "sp2",
    itemName: "Garrafa Absolut + Mixer",
    itemImage: "🥃",
    totalAmount: 220,
    creatorId: "f4",
    creatorName: "Rafael Costa",
    eventName: "Corcovado Festival",
    participants: [
      { friendId: "f4", friendName: "Rafael Costa", friendAvatar: "https://i.pravatar.cc/150?u=rafael", amount: 55, status: "paid" },
      { friendId: "f3", friendName: "Camila Souza", friendAvatar: "https://i.pravatar.cc/150?u=camila", amount: 55, status: "paid" },
      { friendId: "f5", friendName: "Juliana Alves", friendAvatar: "https://i.pravatar.cc/150?u=juliana", amount: 55, status: "accepted" },
      { friendId: "current", friendName: "Você", friendAvatar: "", amount: 55, status: "pending" },
    ],
    status: "pending",
    createdAt: "2026-03-24T23:00:00Z",
    expiresAt: "2026-03-25T01:00:00Z",
  },
];

// ── Privacy settings ─────────────────────────────────────────────────
export interface PrivacySettings {
  showPurchases: boolean;
  showPresence: boolean;
  showBarOrders: boolean;
  showSplits: boolean;
  showFavorites: boolean;
}

export const defaultPrivacySettings: PrivacySettings = {
  showPurchases: true,
  showPresence: true,
  showBarOrders: false,
  showSplits: true,
  showFavorites: true,
};

// ── Hero event ───────────────────────────────────────────────────────
export interface HeroEvent {
  id: string;
  name: string;
  tagline: string;
  image: string;
  date: string;
  slug: string;
}

export const mockHeroEvent: HeroEvent = {
  id: "hero1",
  name: "11.11",
  tagline: "FULL OPEN BAR",
  image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop",
  date: "11 NOV 2026",
  slug: "full-open-bar",
};

// ── Notifications count ──────────────────────────────────────────────
export const mockNotificationCounts = {
  messages: 0,
  requests: 2,
  splits: 1,
  orders: 1,
};
