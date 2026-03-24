import { ChevronDown, Menu, ShoppingCart, Ticket, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EventSearchBox from "@/components/EventSearchBox";
import { useAuth } from "@/hooks/use-auth";
import { useCatalogEvents } from "@/hooks/use-catalog-events";

const categoryAnchor = (category: string) =>
  `#categoria-${category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

const SiteHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentAccount, isAuthenticated } = useAuth();
  const { events } = useCatalogEvents();
  const firstName = currentAccount?.fullName.split(" ")[0] ?? "Visitante";
  const marketplaceCategories = useMemo(() => Array.from(new Set(events.map((event) => event.category))), [events]);
  const marketplaceCities = useMemo(() => Array.from(new Set(events.map((event) => event.city))), [events]);
  const featuredCities = useMemo(() => marketplaceCities.slice(0, 4), [marketplaceCities]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="hidden border-b border-slate-200 bg-slate-950 lg:block">
        <div className="container flex h-10 items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-5">
            <span className="font-medium text-white">Ingressos, experiências e mapa de sala no mesmo fluxo</span>
            <span>Suporte para mobile e desktop</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Atendimento</span>
            <Link to={isAuthenticated ? "/produtor/meus-eventos" : "/conta/acesso"} className="transition-colors hover:text-white">
              Meus eventos
            </Link>
            <Link to={isAuthenticated ? "/operacao" : "/conta/acesso"} className="transition-colors hover:text-white">
              Admin da plataforma
            </Link>
            <span>Ajuda</span>
          </div>
        </div>
      </div>

      <div className="container flex h-20 items-center gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="rounded-2xl bg-slate-950 px-3 py-2 font-display text-xl font-bold text-white">
            EventHub
          </span>
          <div className="hidden xl:block">
            <p className="text-sm font-semibold text-slate-950">Marketplace de ingressos</p>
            <p className="text-xs text-slate-500">Busca, vitrine e jornada com assento marcado</p>
          </div>
        </Link>

        <div className="hidden flex-1 lg:block">
          <EventSearchBox />
        </div>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
          >
            <Ticket className="h-4 w-4" />
            Ingressos
          </Link>

          <button className="relative rounded-full border border-slate-200 p-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50" aria-label="Carrinho">
            <ShoppingCart className="h-5 w-5 text-slate-800" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              0
            </span>
          </button>

          <Link
            to={isAuthenticated ? "/conta" : "/conta/acesso"}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <User className="h-4 w-4" />
            {isAuthenticated ? `Olá, ${firstName}` : "Entrar"}
          </Link>
        </div>

        <button
          className="ml-auto rounded-full border border-slate-200 p-2.5 text-slate-800 transition-colors hover:bg-slate-50 lg:hidden"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Abrir menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <nav className="hidden border-t border-slate-200 bg-white lg:block">
        <div className="container flex h-12 items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2">
            {marketplaceCategories.map((category) => (
              <a
                key={category}
                href={categoryAnchor(category)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                {category}
                <ChevronDown className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium">Praças:</span>
            {featuredCities.map((city) => (
              <span key={city} className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                {city}
              </span>
            ))}
          </div>
        </div>
      </nav>

      {menuOpen ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container space-y-4 py-4">
            <EventSearchBox />

            <div className="grid gap-2">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800"
              >
                Explorar eventos
              </Link>
              <Link
                to={isAuthenticated ? "/conta" : "/conta/acesso"}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              >
                {isAuthenticated ? "Abrir minha conta" : "Entrar ou cadastrar"}
              </Link>
              <Link
                to={isAuthenticated ? "/produtor/meus-eventos" : "/conta/acesso"}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800"
              >
                Meus eventos
              </Link>
              <Link
                to={isAuthenticated ? "/operacao" : "/conta/acesso"}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800"
              >
                Admin da plataforma
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categorias</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {marketplaceCategories.map((category) => (
                  <a
                    key={category}
                    href={categoryAnchor(category)}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    {category}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Praças</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {featuredCities.map((city) => (
                  <span key={city} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default SiteHeader;
