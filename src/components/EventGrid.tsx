import EventCard from "./EventCard";
import type { EventData } from "@/data/events";

interface EventGridProps {
  events: EventData[];
}

const EventGrid = ({ events }: EventGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

export default EventGrid;
