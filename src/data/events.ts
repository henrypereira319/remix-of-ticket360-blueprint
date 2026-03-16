import highlight1 from "@/assets/highlight-1.jpg";
import highlight2 from "@/assets/highlight-2.jpg";
import highlight3 from "@/assets/highlight-3.jpg";
import highlight4 from "@/assets/highlight-4.jpg";
import highlight5 from "@/assets/highlight-5.jpg";
import highlight6 from "@/assets/highlight-6.jpg";

import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";
import event4 from "@/assets/event-4.jpg";
import event5 from "@/assets/event-5.jpg";
import event6 from "@/assets/event-6.jpg";
import event7 from "@/assets/event-7.jpg";
import event8 from "@/assets/event-8.jpg";

export interface EventData {
  id: string;
  title: string;
  image: string;
  month: string;
  day: string;
  weekday: string;
  time: string;
  city: string;
  venueName: string;
  venueIcon?: string;
}

export interface HighlightData {
  id: string;
  title: string;
  image: string;
  href: string;
}

export interface BannerData {
  id: string;
  title: string;
  image: string;
  href: string;
}

export const highlights: HighlightData[] = [
  { id: "h1", title: "Samba na Praça — Edição Especial", image: highlight1, href: "#" },
  { id: "h2", title: "DJ Festival Eletrônico 2026", image: highlight2, href: "#" },
  { id: "h3", title: "Noite Sertaneja — Villa Arena", image: highlight3, href: "#" },
  { id: "h4", title: "Stand-Up Comedy Night", image: highlight4, href: "#" },
  { id: "h5", title: "MPB ao Vivo — Grandes Vozes", image: highlight5, href: "#" },
  { id: "h6", title: "Rock Legacy Festival 2026", image: highlight6, href: "#" },
];

export const banners: BannerData[] = [
  { id: "b1", title: "Duo Acústico — Turnê Nacional", image: banner1, href: "#" },
  { id: "b2", title: "Rock in Concert — Edição Azul", image: banner2, href: "#" },
  { id: "b3", title: "Grande Teatro Imperial — Temporada 2026", image: banner3, href: "#" },
];

export const events: EventData[] = [
  {
    id: "e1", title: "Roda de Samba — Edição Verão",
    image: event1, month: "Mar", day: "22", weekday: "Sáb",
    time: "20:00", city: "São Paulo / SP", venueName: "Espaço Cultural",
  },
  {
    id: "e2", title: "Jazz & Blues Night",
    image: event2, month: "Mar", day: "22", weekday: "Sáb",
    time: "21:00", city: "Rio de Janeiro / RJ", venueName: "Blue Note Rio",
  },
  {
    id: "e3", title: "Pop Stars Live — Arena Tour",
    image: event3, month: "Mar", day: "23", weekday: "Dom",
    time: "19:00", city: "São Paulo / SP", venueName: "Arena Central",
  },
  {
    id: "e4", title: "Rap Nacional em Cena",
    image: event4, month: "Mar", day: "25", weekday: "Ter",
    time: "21:00", city: "Belo Horizonte / MG", venueName: "Mister Rock",
  },
  {
    id: "e5", title: "Forró Pé de Serra — Arraial Urbano",
    image: event5, month: "Mar", day: "27", weekday: "Qui",
    time: "20:00", city: "Fortaleza / CE", venueName: "Centro de Eventos",
  },
  {
    id: "e6", title: "Hamlet — Cia. Teatro Novo",
    image: event6, month: "Mar", day: "28", weekday: "Sex",
    time: "19:30", city: "São Paulo / SP", venueName: "Teatro Municipal",
  },
  {
    id: "e7", title: "Festival Gastronômico & Música",
    image: event7, month: "Mar", day: "29", weekday: "Sáb",
    time: "16:00", city: "Curitiba / PR", venueName: "Parque Barigui",
  },
  {
    id: "e8", title: "Orquestra Sinfônica — Temporada 2026",
    image: event8, month: "Mar", day: "30", weekday: "Dom",
    time: "18:00", city: "São Paulo / SP", venueName: "Sala São Paulo",
  },
];
