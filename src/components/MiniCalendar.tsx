interface MiniCalendarProps {
  month: string;
  day: string;
  weekday: string;
}

const MiniCalendar = ({ month, day, weekday }: MiniCalendarProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center leading-none">
      <span className="text-[0.65rem] font-medium uppercase text-muted-foreground">
        {month}
      </span>
      <span className="text-xl font-bold text-primary leading-tight">
        {day}
      </span>
      <span className="text-[0.6rem] font-medium text-muted-foreground uppercase">
        {weekday}
      </span>
    </div>
  );
};

export default MiniCalendar;
