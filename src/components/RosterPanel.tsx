import { useEffect, useState } from "react";
import type { Player, PlayerPosition } from "@/lib/types";
import { loadPlayers, savePlayers } from "@/lib/storage";
import { ALL_POSITIONS, POSITION_LABELS } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, UserPlus } from "lucide-react";

export function RosterPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [num, setNum] = useState("");
  const [position, setPosition] = useState<PlayerPosition>("any");

  useEffect(() => {
    setPlayers(loadPlayers());
  }, []);

  const update = (next: Player[]) => {
    setPlayers(next);
    savePlayers(next);
  };

  const add = () => {
    if (!name.trim()) return;
    update([
      ...players,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        number: num.trim() || "?",
        position,
      },
    ]);
    setName("");
    setNum("");
    setPosition("any");
  };

  const updatePlayer = (id: string, patch: Partial<Player>) => {
    update(players.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_56px_88px_auto] gap-2">
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Input
          placeholder="#"
          value={num}
          onChange={(e) => setNum(e.target.value)}
          maxLength={3}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Select value={position} onValueChange={(v) => setPosition(v as PlayerPosition)}>
          <SelectTrigger className="h-9 px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_POSITIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {POSITION_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={add} size="icon" variant="default">
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {players.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No players yet. Add your roster above. Tip: tag positions to auto-fill assignments.
          </p>
        )}
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-2 bg-secondary rounded-lg p-2.5">
            <Input
              value={p.number}
              onChange={(e) => updatePlayer(p.id, { number: e.target.value })}
              className="font-display text-2xl text-primary w-14 text-center bg-transparent border-0 focus-visible:ring-0 px-0 h-7"
              maxLength={3}
            />
            <Input
              value={p.name}
              onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 px-0 font-medium h-7"
            />
            <Select
              value={p.position ?? "any"}
              onValueChange={(v) => updatePlayer(p.id, { position: v as PlayerPosition })}
            >
              <SelectTrigger className="h-8 w-[88px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_POSITIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {POSITION_LABELS[pos]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => update(players.filter((x) => x.id !== p.id))}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {players.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-center pt-2">
            {players.length} player{players.length === 1 ? "" : "s"} on roster
          </p>
        )}
      </div>
    </div>
  );
}
