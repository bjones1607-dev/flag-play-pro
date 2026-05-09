import { useEffect, useState } from "react";
import type { Player } from "@/lib/types";
import { loadPlayers, savePlayers } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, UserPlus } from "lucide-react";

export function RosterPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [num, setNum] = useState("");

  useEffect(() => {
    setPlayers(loadPlayers());
  }, []);

  const update = (next: Player[]) => {
    setPlayers(next);
    savePlayers(next);
  };

  const add = () => {
    if (!name.trim()) return;
    update([...players, { id: crypto.randomUUID(), name: name.trim(), number: num.trim() || "?" }]);
    setName("");
    setNum("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="#"
          value={num}
          onChange={(e) => setNum(e.target.value)}
          className="w-16"
          maxLength={3}
        />
        <Button onClick={add} size="icon" variant="default">
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {players.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No players yet. Add your roster above.
          </p>
        )}
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-secondary rounded-lg p-3">
            <div className="font-display text-2xl text-primary w-10 text-center">{p.number}</div>
            <div className="flex-1 font-medium">{p.name}</div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => update(players.filter((x) => x.id !== p.id))}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
