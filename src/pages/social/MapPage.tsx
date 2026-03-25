import { MapPin } from "lucide-react";

const MapPage = () => (
  <div className="space-y-4 safe-top">
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-foreground font-display">Mapa</h1>
      <p className="mt-1 text-xs text-muted-foreground">Eventos e amigos por perto</p>
    </div>
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
        <MapPin className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Mapa de eventos em breve
      </p>
      <p className="max-w-xs text-[11px] text-muted-foreground/70">
        Veja quais eventos estão acontecendo perto de você e onde seus amigos estão.
      </p>
    </div>
  </div>
);

export default MapPage;
