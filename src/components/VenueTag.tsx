import { MapPin } from "lucide-react";

interface VenueTagProps {
  name: string;
  icon?: string;
}

const VenueTag = ({ name, icon }: VenueTagProps) => {
  return (
    <div className="flex items-center gap-2">
      {icon ? (
        <img
          src={icon}
          alt={name}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm font-bold text-foreground truncate">{name}</span>
    </div>
  );
};

export default VenueTag;
