import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import type { Play } from "@/lib/types";
import { PRESET_PLAYS } from "@/lib/plays";
import { PLAYSHEET_SECTIONS } from "@/lib/playsheet";
import { useCustomPlays, useFavorites } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Dumbbell, Home, Printer, Star } from "lucide-react";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice Plan — Flag 6v6" },
      {
        name: "description",
        content:
          "A one-hour 3rd/4th grade flag football practice plan generated from your starred plays, with stations, install reps, and huddle cues.",
      },
    ],
  }),
  component: Practice,
});

interface Block {
  minutes: number;
  title: string;
  detail: string;
}

const WARMUP_AND_DRILLS: Block[] = [
  {
    minutes: 5,
    title: "FLAG TAG WARM-UP",
    detail:
      "Everyone wears flags in a 10x10 box. Pull as many as you can in 60 seconds — three rounds. Warms them up AND teaches flag pulling without a lecture.",
  },
  {
    minutes: 10,
    title: "ROUTES ON AIR",
    detail:
      "No defense. Line up in formation and run today's plays one at a time, everyone at half speed first, then full speed. QB throws every rep. Fix alignment NOW, not on game day.",
  },
  {
    minutes: 10,
    title: "FIND-THE-GRASS DRILL",
    detail:
      "Set 3 defenders in short zones. Receivers run their routes and must STOP in open grass and yell 'BALL!' Teaches the #1 zone rule better than any speech.",
  },
];

const CLOSING_BLOCKS: Block[] = [
  {
    minutes: 10,
    title: "DEFENSE — BASE 33 WALKTHROUGH",
    detail:
      "Everyone learns their box (see the Defense sheet). Coach walks routes at half speed; defenders call out who enters their zone. Finish with 3 live snaps.",
  },
  {
    minutes: 15,
    title: "SCRIMMAGE — CALL IT LIKE A GAME",
    detail:
      "Use the sideline call mode: 3 downs to midfield, then 4 to score. Call only today's install plays. Tag every play good/bad — kids love seeing the stats after.",
  },
  {
    minutes: 5,
    title: "WIN-THE-GAME REP",
    detail:
      "One Emergency play (Hook & Ladder or Moon Shot) with 10 seconds left, down 5. If it scores, everyone celebrates like it's real. End practice on this every week.",
  },
];

function Practice() {
  const favorites = useFavorites();
  const [customs] = useCustomPlays();

  // Install list: starred plays if the coach starred any, else the core
  // play-sheet openers — capped at 6 so reps stay high.
  const install = useMemo(() => {
    const all = [...PRESET_PLAYS, ...customs];
    const starred = all.filter((p) => favorites.has(p.id));
    if (starred.length > 0) return starred.slice(0, 6);
    const coreIds = PLAYSHEET_SECTIONS.flatMap((s) => s.playIds).slice(0, 6);
    return coreIds.map((id) => all.find((p) => p.id === id)).filter((p): p is Play => !!p);
  }, [customs, favorites]);

  const usingStars = install.some((p) => favorites.has(p.id));
  const totalMinutes =
    WARMUP_AND_DRILLS.reduce((t, b) => t + b.minutes, 0) +
    15 +
    CLOSING_BLOCKS.reduce((t, b) => t + b.minutes, 0);

  return (
    <div className="min-h-screen bg-background playsheet-page">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border no-print">
        <div className="px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link to="/">
            <Button size="icon" variant="ghost" aria-label="Home">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl leading-none text-primary flex items-center gap-2">
              <Dumbbell className="h-5 w-5" /> PRACTICE PLAN
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
              {totalMinutes} minutes · built from your playbook
            </p>
          </div>
          <div className="ml-auto">
            <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              <span className="font-display text-xs">PRINT</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto space-y-4 playsheet-print-area">
        <div className="hidden print-only text-center">
          <div className="font-display text-2xl">PRACTICE PLAN · {totalMinutes} MIN</div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-center text-xs text-muted-foreground">
          The 80/20 rule: 80% of reps on our core plays until they're automatic, 20% on new stuff.
          {usingStars
            ? " Install list below comes from your starred plays."
            : " Star plays in the library and this plan rebuilds itself around them."}
        </div>

        {WARMUP_AND_DRILLS.map((b) => (
          <BlockCard key={b.title} block={b} />
        ))}

        {/* Install block generated from plays */}
        <section className="playsheet-card rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-display text-2xl text-primary w-12 shrink-0">15'</span>
            <div>
              <h2 className="font-display text-base tracking-wide leading-none">
                PLAY INSTALL — 3 PERFECT REPS EACH
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                {usingStars ? "Your starred plays" : "Core openers (star plays to customize)"}
              </p>
            </div>
          </div>
          <div className="space-y-2 mt-3">
            {install.map((p, i) => (
              <div key={p.id} className="rounded-lg bg-card border border-border px-3 py-2">
                <div className="font-display text-sm tracking-wide flex items-center gap-1.5">
                  {favorites.has(p.id) && <Star className="h-3 w-3 fill-primary text-primary" />}
                  {i + 1}. {p.name.toUpperCase()}
                  <span className="text-[9px] text-muted-foreground tracking-widest ml-auto">
                    {p.formation}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  Huddle cue: {p.notes || p.keyRead}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
            A rep only counts if the alignment, route, AND catch are right. Sloppy rep = run it
            again, no drama.
          </p>
        </section>

        {CLOSING_BLOCKS.map((b) => (
          <BlockCard key={b.title} block={b} />
        ))}

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground no-print pb-4">
          Same structure every week — kids improve fastest when practice is predictable
        </p>
      </main>
    </div>
  );
}

function BlockCard({ block }: { block: Block }) {
  return (
    <section className="playsheet-card rounded-xl border border-border bg-card px-4 py-3 flex gap-3 items-start">
      <span className="font-display text-2xl text-primary w-12 shrink-0">{block.minutes}'</span>
      <div>
        <h2 className="font-display text-base tracking-wide leading-none">{block.title}</h2>
        <p className="text-xs text-muted-foreground leading-snug mt-1.5">{block.detail}</p>
      </div>
    </section>
  );
}
