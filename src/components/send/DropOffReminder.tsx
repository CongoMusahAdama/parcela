import { MapPin } from "lucide-react";

type DropOffReminderProps = {
  stationName: string;
};

export function DropOffReminder({ stationName }: DropOffReminderProps) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5">
      <MapPin className="size-3.5 shrink-0 text-primary" strokeWidth={2.25} />
      <p className="font-body text-xs leading-snug text-muted">
        Show this receipt at{" "}
        <span className="font-semibold text-foreground">{stationName}</span> when you drop off.
      </p>
    </div>
  );
}
