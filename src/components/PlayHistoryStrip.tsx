import type { PlayCall } from "@/lib/types";
import { Clock } from "lucide-react";

interface Props {
  history: PlayCall[];
  onPick: (id: string) => void;
}

export function PlayHistoryStrip({ history, onPick }: Props) {
  if (history.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-1 px-1">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground font-display shrink-0">
        <Clock className="h-3 w-3" /> RECENT
      </div>
      {history.slice(0, 8).map((c, i) => (
        <button
          key={`${c.id}-${c.t}`}
          onClick={() => onPick(c.id)}
          className={`shrink-0 text-[11px] px-2 py-1 rounded-full font-display tracking-wide border ${
            i === 0
              ? "border-primary text-primary bg-primary/10"
              : "border-border bg-secondary text-muted-foreground"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
