import { useEffect, useState } from "react";
import type { Play, PlayerAssignment } from "@/lib/types";
import { EVENTS, loadAssignment, saveAssignment } from "@/lib/storage";
import { useLineups, usePlayers } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Props {
  play: Play;
}

export function AssignmentPanel({ play }: Props) {
  const players = usePlayers();
  const { lineups, activeId, apply, saveCurrent, update, remove } = useLineups();
  const [assign, setAssign] = useState<PlayerAssignment>({});
  const [lineupName, setLineupName] = useState("");

  // Stay in sync when a lineup is applied elsewhere (sideline, play sheet).
  useEffect(() => {
    const refresh = () => setAssign(loadAssignment());
    refresh();
    window.addEventListener(EVENTS.ASSIGN, refresh);
    return () => window.removeEventListener(EVENTS.ASSIGN, refresh);
  }, []);

  const set = (slot: string, pid: string) => {
    const next = { ...assign, [slot]: pid };
    setAssign(next);
    saveAssignment(next);
  };

  const slots = [
    { id: "qb", label: "QB" },
    ...play.receivers.map((r, i) => {
      const tag = r.isCenter ? "C" : r.isRunner ? "BALL" : `R${i + 1}`;
      return { id: r.id, label: `${tag} · ${r.route.toUpperCase()}` };
    }),
  ];

  const saveLineup = () => {
    const name = lineupName.trim();
    if (!name) return;
    saveCurrent(name);
    setLineupName("");
    toast.success(`Saved lineup "${name}"`);
  };

  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">Add players to your roster first.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {slots.map((s) => (
          <div key={s.id} className="space-y-1">
            <label className="text-xs font-display tracking-wide text-muted-foreground">
              {s.label}
            </label>
            <Select value={assign[s.id] || ""} onValueChange={(v) => set(s.id, v)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    #{p.number} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="col-span-2"
          onClick={() => {
            setAssign({});
            saveAssignment({});
          }}
        >
          Clear assignments
        </Button>
      </div>

      {/* Saved lineups: tap to apply, save current as a named wave */}
      <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display flex items-center gap-1">
          <Users className="h-3 w-3" /> Lineups (Wave A / Wave B)
        </div>
        {lineups.length > 0 && (
          <div className="space-y-1.5">
            {lineups.map((l) => (
              <div
                key={l.id}
                className={`flex items-center gap-1 p-1.5 rounded-md border ${
                  l.id === activeId
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/40"
                }`}
              >
                <button
                  onClick={() => {
                    apply(l.id);
                    toast.success(`Lineup: ${l.name}`);
                  }}
                  className="flex-1 text-left font-display tracking-wide text-sm px-1.5 truncate"
                >
                  {l.name.toUpperCase()}
                  {l.id === activeId && (
                    <span className="ml-2 text-[9px] text-primary tracking-widest">ON FIELD</span>
                  )}
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    update(l.id);
                    toast.success(`Updated "${l.name}" with current assignments`);
                  }}
                  aria-label={`Overwrite ${l.name} with current assignments`}
                >
                  <Save className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    remove(l.id);
                    toast(`Deleted "${l.name}"`);
                  }}
                  aria-label={`Delete ${l.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={lineupName}
            onChange={(e) => setLineupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveLineup()}
            placeholder='Name it (e.g. "Wave A")'
            className="h-9 text-sm"
          />
          <Button
            size="sm"
            className="h-9 shrink-0"
            onClick={saveLineup}
            disabled={!lineupName.trim()}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Set the six spots above, save as a wave, then switch waves with one tap here, on the
          sideline, or on the play sheet. Diagrams update instantly.
        </p>
      </div>
    </div>
  );
}
