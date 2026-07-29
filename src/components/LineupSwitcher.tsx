import { useLineups } from "@/hooks/use-storage";
import { Users } from "lucide-react";
import { toast } from "sonner";

// One-tap switch between saved lineups (e.g. "Wave A" / "Wave B").
// Renders nothing until at least one lineup is saved in the Assign tab.
export function LineupSwitcher() {
  const { lineups, activeId, apply } = useLineups();
  if (lineups.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display flex items-center gap-1">
        <Users className="h-3 w-3" /> Lineup
      </span>
      {lineups.map((l) => (
        <button
          key={l.id}
          onClick={() => {
            apply(l.id);
            toast.success(`Lineup: ${l.name}`);
          }}
          className={`text-[11px] px-2.5 py-1.5 rounded-full font-display tracking-wider transition ${
            l.id === activeId
              ? "bg-primary text-primary-foreground shadow"
              : "bg-secondary text-muted-foreground hover:bg-secondary/70"
          }`}
        >
          {l.name.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
