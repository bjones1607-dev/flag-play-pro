import type { GameState, Play, PlayCall } from "@/lib/types";
import { suggestPlays } from "@/lib/suggest";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight } from "lucide-react";

interface Props {
  candidates: Play[];
  game: GameState;
  history: PlayCall[];
  defense: "zone" | "man";
  onPick: (id: string) => void;
}

export function SuggesterPanel({ candidates, game, history, defense, onPick }: Props) {
  const suggestions = suggestPlays(candidates, game, history, defense);
  if (suggestions.length === 0) return null;

  const ord = game.down === 1 ? "1ST" : game.down === 2 ? "2ND" : game.down === 3 ? "3RD" : "4TH";

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-primary font-display">
          Coach AI · {ord} & {game.yardsToFirst} · vs. {defense.toUpperCase()}
        </div>
      </div>
      <div className="space-y-1.5">
        {suggestions.map((s, i) => (
          <button
            key={s.play.id}
            onClick={() => onPick(s.play.id)}
            className="w-full flex items-center gap-2 p-2 rounded-md bg-card hover:bg-accent/10 transition text-left"
          >
            <div className="font-display text-2xl text-primary w-7 text-center">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-base leading-none truncate">{s.play.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {s.reasons.slice(0, 2).join(" · ") || s.play.formation}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
