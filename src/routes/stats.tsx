import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCallLog } from "@/hooks/use-storage";
import { startNewGame } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { BarChart3, Home, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Play Stats — Flag 6v6" },
      {
        name: "description",
        content:
          "Per-play statistics from your game-day calls: attempts, success rate, and yards gained, for this game or the whole season.",
      },
    ],
  }),
  component: Stats,
});

type SortKey = "yards" | "avg" | "calls" | "success";

interface PlayStat {
  playId: string;
  name: string;
  calls: number;
  good: number;
  bad: number;
  yards: number;
  yardSamples: number;
  lastAt: number;
  recent: ("good" | "bad" | "none")[];
}

function Stats() {
  const { log, gameStart } = useCallLog();
  const [scope, setScope] = useState<"game" | "season">("game");
  const [sort, setSort] = useState<SortKey>("yards");

  const entries = useMemo(
    () => (scope === "game" ? log.filter((e) => e.at >= gameStart) : log),
    [log, gameStart, scope],
  );

  const stats = useMemo(() => {
    const m = new Map<string, PlayStat>();
    for (const e of entries) {
      let s = m.get(e.playId);
      if (!s) {
        s = {
          playId: e.playId,
          name: e.name,
          calls: 0,
          good: 0,
          bad: 0,
          yards: 0,
          yardSamples: 0,
          lastAt: 0,
          recent: [],
        };
        m.set(e.playId, s);
      }
      s.calls++;
      if (e.result === "good") s.good++;
      if (e.result === "bad") s.bad++;
      if (typeof e.yards === "number") {
        s.yards += e.yards;
        s.yardSamples++;
      }
      s.lastAt = Math.max(s.lastAt, e.at);
      s.recent.push(e.result ?? "none");
    }
    const list = [...m.values()];
    const avg = (s: PlayStat) => (s.yardSamples > 0 ? s.yards / s.yardSamples : -Infinity);
    const success = (s: PlayStat) => (s.good + s.bad > 0 ? s.good / (s.good + s.bad) : -1);
    list.sort((a, b) => {
      if (sort === "yards") return b.yards - a.yards;
      if (sort === "avg") return avg(b) - avg(a);
      if (sort === "calls") return b.calls - a.calls;
      return success(b) - success(a);
    });
    return list;
  }, [entries, sort]);

  const totals = useMemo(() => {
    const calls = entries.length;
    const yards = entries.reduce((t, e) => t + (e.yards ?? 0), 0);
    const good = entries.filter((e) => e.result === "good").length;
    const judged = entries.filter((e) => e.result).length;
    return { calls, yards, good, judged };
  }, [entries]);

  const sortChips: { key: SortKey; label: string }[] = [
    { key: "yards", label: "TOTAL YDS" },
    { key: "avg", label: "AVG YDS" },
    { key: "calls", label: "CALLS" },
    { key: "success", label: "SUCCESS" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Toaster theme="dark" position="top-center" />
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link to="/">
            <Button size="icon" variant="ghost" aria-label="Home">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl leading-none text-primary flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> PLAY STATS
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
              What's actually working
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="grid grid-cols-2 bg-secondary rounded-lg p-1 text-xs">
              <button
                onClick={() => setScope("game")}
                className={`px-3 py-1 rounded-md font-display tracking-wide ${scope === "game" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                THIS GAME
              </button>
              <button
                onClick={() => setScope("season")}
                className={`px-3 py-1 rounded-md font-display tracking-wide ${scope === "season" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                SEASON
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto space-y-4">
        {/* Totals strip */}
        <div className="grid grid-cols-3 gap-2">
          <TotalCard label="Calls" value={String(totals.calls)} />
          <TotalCard label="Yards" value={String(totals.yards)} />
          <TotalCard
            label="Success"
            value={totals.judged > 0 ? `${Math.round((totals.good / totals.judged) * 100)}%` : "—"}
          />
        </div>

        {/* Sort + new game */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
            Sort
          </span>
          {sortChips.map((c) => (
            <button
              key={c.key}
              onClick={() => setSort(c.key)}
              className={`text-[11px] px-2.5 py-1.5 rounded-full font-display tracking-wider ${
                sort === c.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
          <button
            onClick={() => {
              startNewGame();
              setScope("game");
              toast.success("New game started — This Game stats reset");
            }}
            className="ml-auto text-[11px] px-2.5 py-1.5 rounded-full font-display tracking-wider bg-secondary text-muted-foreground flex items-center gap-1 hover:text-destructive"
          >
            <RotateCcw className="h-3 w-3" /> NEW GAME
          </button>
        </div>

        {/* Per-play rows */}
        {stats.length === 0 ? (
          <div className="text-sm text-muted-foreground italic p-8 border border-dashed border-border rounded-lg text-center">
            No calls logged {scope === "game" ? "this game" : "yet"}. Run plays from the play sheet
            and tap the result chips after each snap — stats build themselves.
          </div>
        ) : (
          <div className="space-y-1.5">
            {stats.map((s) => {
              const judged = s.good + s.bad;
              const successPct = judged > 0 ? Math.round((s.good / judged) * 100) : null;
              const avg = s.yardSamples > 0 ? (s.yards / s.yardSamples).toFixed(1) : null;
              return (
                <div
                  key={s.playId}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-secondary/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base leading-tight truncate">{s.name}</div>
                    <div className="flex gap-0.5 mt-1">
                      {s.recent.slice(-8).map((r, i) =>
                        r === "good" ? (
                          <ThumbsUp key={i} className="h-3 w-3 text-primary" />
                        ) : r === "bad" ? (
                          <ThumbsDown key={i} className="h-3 w-3 text-destructive" />
                        ) : (
                          <span key={i} className="h-3 w-3 text-[8px] text-muted-foreground">
                            ·
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                  <StatCell label="calls" value={String(s.calls)} />
                  <StatCell label="yds" value={String(s.yards)} highlight />
                  <StatCell label="avg" value={avg ?? "—"} />
                  <StatCell label="good" value={successPct !== null ? `${successPct}%` : "—"} />
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-center uppercase tracking-widest text-muted-foreground pb-4">
          Yards come from the result chips in the huddle · gained = good, stopped = bad
        </p>
      </main>
    </div>
  );
}

function TotalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
      <div className="font-display text-2xl text-primary leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function StatCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="w-12 text-center shrink-0">
      <div
        className={`font-display text-lg leading-none ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
