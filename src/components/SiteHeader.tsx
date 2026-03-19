import { Search, ShoppingCart, Bell, User, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const categories = [
  "Casas & Clubs",
  "Musica",
  "Artistas",
  "Eventos",
  "Artes e Teatro",
  "Especiais",
  "Estados",
  "Turne",
];

const SiteHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentAccount, isAuthenticated } = useAuth();
  const firstName = currentAccount?.fullName.split(" ")[0] ?? "Visitante";

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container flex items-center justify-between h-16 gap-4">
        <Link to="/" className="flex-shrink-0">
          <span className="font-display text-2xl font-bold text-primary">
            Event<span className="text-foreground">Hub</span>
          </span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Pesquise por artista, evento ou local..."
              className="w-full h-10 pl-4 pr-10 rounded-lg border border-border bg-background text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={isAuthenticated ? "/admin" : "/conta/acesso"}
            className="hidden rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-muted lg:inline-flex"
          >
            Workspace Admin
          </Link>

          <button className="relative p-2 rounded-full hover:bg-muted transition-colors" aria-label="Carrinho">
            <ShoppingCart className="w-5 h-5 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[0.6rem] font-bold rounded-full flex items-center justify-center">
              0
            </span>
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors hidden sm:flex" aria-label="Notificacoes">
            <Bell className="w-5 h-5 text-foreground" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-border">
            <User className="w-5 h-5 text-muted-foreground" />
            <div className="text-sm font-body leading-tight">
              <span>
                Ola, <span className="text-primary font-medium">{firstName}!</span>
              </span>
              <Link
                to={isAuthenticated ? "/conta" : "/conta/acesso"}
                className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {isAuthenticated ? "Minha conta" : "Entrar ou cadastrar"}
              </Link>
            </div>
          </div>

          <button
            className="md:hidden p-2 rounded-full hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <nav className="hidden md:block bg-foreground">
        <div className="container flex items-center gap-1 h-10 overflow-x-auto">
          {categories.map((cat) => (
            <a
              key={cat}
              href="#"
              className="flex items-center gap-1 px-3 h-full text-sm font-display font-medium text-card hover:text-primary transition-colors whitespace-nowrap"
            >
              {cat}
              <ChevronDown className="w-3 h-3" />
            </a>
          ))}
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="p-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquise por artista, evento ou local..."
                className="w-full h-10 pl-4 pr-10 rounded-lg border border-border bg-background text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="px-3 pb-2">
            <Link
              to={isAuthenticated ? "/admin" : "/conta/acesso"}
              className="mb-2 block rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {isAuthenticated ? "Abrir workspace admin" : "Entrar para acessar o admin"}
            </Link>

            <Link
              to={isAuthenticated ? "/conta" : "/conta/acesso"}
              className="block rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {isAuthenticated ? "Abrir minha conta" : "Entrar ou cadastrar"}
            </Link>
          </div>

          <div className="px-3 pb-3 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <a
                key={cat}
                href="#"
                className="px-3 py-1.5 text-sm font-display bg-muted rounded-md text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
