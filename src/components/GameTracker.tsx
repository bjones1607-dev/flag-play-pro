import type { GameState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw } from "lucide-react";

interface Props {
  game: GameState;
  onChange: (g: GameState) => void;
}

// Distance from each goal where running is illegal (UTL standard 5-yard no-run zone)
const NO_RUN_DEPTH = 5;

function computeNoRunZone(ballOn: number): boolean {
  // ballOn 0..100 (own goal to opp goal)
  return ballOn >= 100 - NO_RUN_DEPTH || ballOn <= NO_RUN_DEPTH;
}

export function GameTracker({ game, onChange }: Props) {
  const patch = (p: Partial<GameState>) =>
    onChange({ ...game, ...p, noRunZone: computeNoRunZone(p.ballOn ?? game.ballOn) });

  const adjScore = (team: "home" | "away", delta: number) => {
    if (team === "home") patch({ homeScore: Math.max(0, game.homeScore + delta) });
    else patch({ awayScore: Math.max(0, game.awayScore + delta) });
  };

  const adjBall = (delta: number) =>
    patch({ ballOn: Math.max(0, Math.min(100, game.ballOn + delta)) });

  const reset = () =>
    onChange({
      ...game,
      homeScore: 0,
      awayScore: 0,
      down: 1,
      yardsToFirst: 20,
      ballOn: 50,
      noRunZone: false,
      history: [],
    });

  const inNoRun = computeNoRunZone(game.ballOn);

  return (
    <div className="space-y-3">
      {/* Score */}
      <div className="grid grid-cols-2 gap-2">
        <ScoreCard
          label={game.homeName}
          score={game.homeScore}
          onAdd={() => adjScore("home", 6)}
          onSub={() => adjScore("home", -1)}
          onPat1={() => adjScore("home", 1)}
          onPat2={() => adjScore("home", 2)}
        />
        <ScoreCard
          label={game.awayName}
          score={game.awayScore}
          onAdd={() => adjScore("away", 6)}
          onSub={() => adjScore("away", -1)}
          onPat1={() => adjScore("away", 1)}
          onPat2={() => adjScore("away", 2)}
        />
      </div>

      {/* Down + Distance */}
      <div className="bg-card rounded-lg p-3 border border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
            Down & Distance
          </div>
          {inNoRun && (
            <span className="text-[10px] font-display tracking-wider px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
              NO-RUN ZONE
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-[10px] text-muted-foreground font-display">DOWN</div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  onClick={() => patch({ down: d as GameState["down"] })}
                  className={`w-8 h-8 rounded font-display ${
                    game.down === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-display">TO 1ST</div>
            <div className="flex items-center gap-1 mt-1">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => patch({ yardsToFirst: Math.max(0, game.yardsToFirst - 1) })}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="font-display text-2xl text-primary w-10 text-center">
                {game.yardsToFirst}
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => patch({ yardsToFirst: game.yardsToFirst + 1 })}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-display">BALL ON</div>
            <div className="flex items-center gap-1 mt-1">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => adjBall(-5)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="font-display text-2xl text-primary w-10 text-center">
                {game.ballOn}
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => adjBall(5)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              patch({
                down: ((game.down % 4) + 1) as GameState["down"],
                yardsToFirst: Math.max(0, game.yardsToFirst - 5),
              })
            }
          >
            Next Down
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  score,
  onAdd,
  onSub,
  onPat1,
  onPat2,
}: {
  label: string;
  score: number;
  onAdd: () => void;
  onSub: () => void;
  onPat1: () => void;
  onPat2: () => void;
}) {
  return (
    <div className="bg-card rounded-lg p-3 border border-border">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
        {label}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onSub}>
          <Minus className="h-3 w-3" />
        </Button>
        <div className="font-display text-4xl text-primary flex-1 text-center leading-none">
          {score}
        </div>
        <Button size="icon" variant="default" className="h-7 w-7" onClick={onAdd}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1 mt-2">
        <Button size="sm" variant="secondary" className="h-6 text-[10px]" onClick={onPat1}>
          +1
        </Button>
        <Button size="sm" variant="secondary" className="h-6 text-[10px]" onClick={onPat2}>
          +2
        </Button>
      </div>
    </div>
  );
}
