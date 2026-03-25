import { Menu, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SocialHeaderProps {
  fullName: string;
  avatarUrl?: string;
}

const SocialHeader = ({ fullName, avatarUrl }: SocialHeaderProps) => {
  const firstName = fullName.split(" ")[0];

  return (
    <header className="flex items-center justify-between px-4 pb-2 pt-3 safe-top lg:px-6 lg:pb-4 lg:pt-6">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-1.5 text-muted-foreground active:bg-surface lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 ring-2 ring-social/40 lg:h-11 lg:w-11">
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback className="bg-surface text-xs font-semibold text-foreground">
              {fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground lg:text-base">
              Olá, {firstName}
            </p>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-[8px] text-social">★</span>
              ))}
            </div>
            <p className="mt-1 hidden text-xs text-muted-foreground lg:block">
              Sua rede, seus pedidos e seus rolês do momento.
            </p>
          </div>
        </div>
      </div>
      <button className="rounded-xl border border-border/70 p-2 text-muted-foreground transition-colors hover:bg-surface">
        <Search className="h-5 w-5" />
      </button>
    </header>
  );
};

export default SocialHeader;
