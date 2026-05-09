import { useEffect, useState } from "react";
import type { Play, Player, PlayerAssignment } from "@/lib/types";
import { loadPlayers, loadAssignment, saveAssignment } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props { play: Play; }

export function AssignmentPanel({ play }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [assign, setAssign] = useState<PlayerAssignment>({});

  useEffect(() => {
    setPlayers(loadPlayers());
    setAssign(loadAssignment());
  }, []);

  const set = (slot: string, pid: string) => {
    const next = { ...assign, [slot]: pid };
    setAssign(next); saveAssignment(next);
  };

  const slots = [
    { id: "qb", label: "QB" },
    ...play.receivers.map((r, i) => ({ id: r.id, label: `R${i + 1} · ${r.route.toUpperCase()}` })),
  ];

  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">Add players to your roster first.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((s) => (
        <div key={s.id} className="space-y-1">
          <label className="text-xs font-display tracking-wide text-muted-foreground">{s.label}</label>
          <Select value={assign[s.id] || ""} onValueChange={(v) => set(s.id, v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id}>#{p.number} {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="col-span-2"
        onClick={() => { setAssign({}); saveAssignment({}); }}>Clear assignments</Button>
    </div>
  );
}
