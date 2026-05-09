import { useEffect, useMemo, useState } from "react";
import type { Play, Player, PlayerAssignment, PlayerPosition } from "@/lib/types";
import { loadAssignment, saveAssignment } from "@/lib/storage";
import { usePlayers } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  play: Play;
}

// Map a slot to the recommended position(s). Anyone with "any" is always eligible.
function eligiblePositionsForSlot(slot: {
  isQb?: boolean;
  isCenter?: boolean;
  isRunner?: boolean;
}): PlayerPosition[] {
  if (slot.isQb) return ["qb"];
  if (slot.isCenter) return ["center"];
  if (slot.isRunner) return ["rb", "qb"];
  return ["wr", "rb"];
}

function rankPlayers(players: Player[], eligible: PlayerPosition[]): Player[] {
  const eligSet = new Set<PlayerPosition>(eligible);
  return [...players].sort((a, b) => {
    const ap = a.position ?? "any";
    const bp = b.position ?? "any";
    const ascore = ap === "any" ? 1 : eligSet.has(ap) ? 0 : 2;
    const bscore = bp === "any" ? 1 : eligSet.has(bp) ? 0 : 2;
    if (ascore !== bscore) return ascore - bscore;
    return a.name.localeCompare(b.name);
  });
}

export function AssignmentPanel({ play }: Props) {
  const players = usePlayers();
  const [assign, setAssign] = useState<PlayerAssignment>({});

  useEffect(() => {
    setAssign(loadAssignment());
  }, []);

  const set = (slot: string, pid: string) => {
    const next = { ...assign, [slot]: pid };
    setAssign(next);
    saveAssignment(next);
  };

  const slots = useMemo(() => {
    return [
      { id: "qb", label: "QB", isQb: true } as const,
      ...play.receivers.map((r, i) => {
        const tag = r.isCenter ? "C" : r.isRunner ? "BALL" : `R${i + 1}`;
        return {
          id: r.id,
          label: `${tag} · ${r.route.toUpperCase()}`,
          isCenter: r.isCenter,
          isRunner: r.isRunner,
        };
      }),
    ];
  }, [play]);

  const autoFill = () => {
    if (players.length === 0) return;
    // Greedy: for each slot, pick best-fit unassigned player by position.
    const used = new Set<string>();
    const next: PlayerAssignment = {};
    for (const s of slots) {
      const eligible = eligiblePositionsForSlot(s);
      const ranked = rankPlayers(
        players.filter((p) => !used.has(p.id)),
        eligible,
      );
      const pick = ranked[0];
      if (pick) {
        next[s.id] = pick.id;
        used.add(pick.id);
      }
    }
    setAssign(next);
    saveAssignment(next);
  };

  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">Add players to your roster first.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="default" onClick={autoFill}>
          Auto-Fill by Position
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setAssign({});
            saveAssignment({});
          }}
        >
          Clear
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((s) => {
          const eligible = eligiblePositionsForSlot(s);
          const ranked = rankPlayers(players, eligible);
          return (
            <div key={s.id} className="space-y-1">
              <label className="text-xs font-display tracking-wide text-muted-foreground">
                {s.label}
              </label>
              <Select value={assign[s.id] || ""} onValueChange={(v) => set(s.id, v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {ranked.map((p) => {
                    const fit = p.position && p.position !== "any" && eligible.includes(p.position);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        #{p.number} {p.name}
                        {fit && (
                          <span className="ml-1 text-[10px] text-primary font-display">★</span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
