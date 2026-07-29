import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PRESET_PLAYS } from "@/lib/plays";
import { liveStatsFromLog, suggestPlays } from "@/lib/suggest";
import { useCallLog, useCustomPlays, useFavorites, useSituation } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Flag, Home, ThumbsDown, ThumbsUp } from "lucide-react";

export const Route = createFileRoute("/halftime")({
  head: () => ({
    meta: [
      { title: "Halftime Card — Flag 6v6" },
      {
        name: "description",
        content:
          "One-tap halftime adjustments: what's gaining, what's cold, how the drives went, and what to open the second half with.",
      },
    ],
  }),
  component: Halftime,
});

function Halftime() {
  const { log, gameStart } = useCallLog();
  const favorites = useFavorites();
  const [customs] = useCustomPlays();
  const [situation] = useSituation();

  const allPlays = useMemo(() => [...PRESET_PLAYS, ...customs], [customs]);
  const gameLog = useMemo(() => log.filter((e) => e.at >= gameStart), [log, gameStart]);
  const stats = useMemo(() => liveStatsFromLog(log, gameStart), [log, gameStart]);

  const ranked = useMemo(() => {
    const rows = Object.entries(stats)
      .map(([playId, s]) => ({
        playId,
        name: gameLog.find((e) => e.playId === playId)?.name ?? playId,
        calls: s.calls,
        yards: s.yards,
        avg: s.samples > 0 ? s.yards / s.samples : 0,
      }))
      .filter((r) => r.calls > 0);
    return rows;
  }, [stats, gameLog]);

  const hot = [...ranked].sort((a, b) => b.yards - a.yards).slice(0, 3);
  const cold = [...ranked]
    .filter((r) => r.calls >= 2 && r.avg <= 2)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  // What to open the second half with, informed by today's stats.
  const zonePlays = useMemo(() => allPlays.filter((p) => p.defense === "zone"), [allPlays]);
  const openers = useMemo(
    () =>
      suggestPlays(zonePlays, {
        stats,
        isStarred: (id) => favorites.has(id),
        recentIds: [],
        count: 3,
      }),
    [zonePlays, stats, favorites],
  );

  const totalYards = gameLog.reduce((t, e) => t + (e.yards ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link to="/">
            <Button size="icon" variant="ghost" aria-label="Home">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl leading-none text-primary flex items-center gap-2">
              <Flag className="h-5 w-5" /> HALFTIME CARD
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
              30-second adjustments
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        {/* Scoreboard */}
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div className="font-display text-4xl text-primary leading-none">
            US {situation.ourScore} · THEM {situation.oppScore}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">
            {gameLog.length} snaps · {totalYards} yards
          </div>
        </div>

        {/* Keep feeding / put away */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="rounded-xl border border-primary/40 bg-primary/5 p-4">
            <h2 className="font-display text-sm tracking-widest text-primary mb-2 flex items-center gap-1.5">
              <ThumbsUp className="h-4 w-4" /> KEEP FEEDING
            </h2>
            {hot.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Record some snaps first.</p>
            ) : (
              <div className="space-y-1.5">
                {hot.map((r) => (
                  <div key={r.playId} className="flex items-baseline gap-2 text-sm">
                    <span className="font-display">{r.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto">
                      {r.yards > 0 ? "+" : ""}
                      {r.yards} yds · {r.calls} calls
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <h2 className="font-display text-sm tracking-widest text-destructive mb-2 flex items-center gap-1.5">
              <ThumbsDown className="h-4 w-4" /> PUT AWAY
            </h2>
            {cold.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nothing's cold — good half.</p>
            ) : (
              <div className="space-y-1.5">
                {cold.map((r) => (
                  <div key={r.playId} className="flex items-baseline gap-2 text-sm">
                    <span className="font-display">{r.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto">
                      avg {r.avg.toFixed(1)} · {r.calls} calls
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Second-half script */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-display text-sm tracking-widest text-muted-foreground mb-2">
            OPEN THE SECOND HALF WITH
          </h2>
          <div className="space-y-1.5">
            {openers.suggestions.map(({ play, reason }, i) => (
              <div key={play.id} className="flex items-baseline gap-2 text-sm">
                <span className="text-[10px] text-muted-foreground font-display w-4">{i + 1}.</span>
                <span className="font-display">{play.name}</span>
                <span className="text-muted-foreground text-xs ml-auto truncate">{reason}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
            Fresh-drive picks weighted by what actually gained in the first half.
          </p>
        </section>

        <Link to="/" className="block">
          <Button size="lg" className="w-full h-12 font-display text-base">
            BACK TO THE SHEET — GO WIN THE HALF
          </Button>
        </Link>
      </main>
    </div>
  );
}
