import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { Play } from "@/lib/types";
import { PRESET_PLAYS } from "@/lib/plays";
import { KID_RULES, PLAYSHEET_SECTIONS, QB_GOLDEN_RULE } from "@/lib/playsheet";
import { FootballField } from "@/components/FootballField";
import { HuddleView } from "@/components/HuddleView";
import { LineupSwitcher } from "@/components/LineupSwitcher";
import { useAssignment, useFavorites, usePlayers } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Home, Printer, Tv } from "lucide-react";

export const Route = createFileRoute("/playsheet")({
  head: () => ({
    meta: [
      { title: "3x3 Zone Attack — Play Sheet" },
      {
        name: "description",
        content:
          "Printable 3rd/4th grade play sheet for beating the 3x3 zone: diagrams, kid-friendly calls, and QB reads organized by game situation.",
      },
    ],
  }),
  component: Playsheet,
});

function Playsheet() {
  const players = usePlayers();
  const assignment = useAssignment();
  const favorites = useFavorites();
  const [huddleIdx, setHuddleIdx] = useState<number | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, Play>();
    for (const p of PRESET_PLAYS) m.set(p.id, p);
    return m;
  }, []);

  // Flat, deduped play order across sections — drives both the wristband
  // numbers and the fullscreen huddle carousel.
  const flatPlays = useMemo(() => {
    const seen = new Set<string>();
    const list: Play[] = [];
    for (const s of PLAYSHEET_SECTIONS) {
      for (const id of s.playIds) {
        if (seen.has(id)) continue;
        const p = byId.get(id);
        if (p) {
          seen.add(id);
          list.push(p);
        }
      }
    }
    return list;
  }, [byId]);

  const numbered = useMemo(() => {
    const m = new Map<string, number>();
    flatPlays.forEach((p, i) => m.set(p.id, i + 1));
    return m;
  }, [flatPlays]);

  return (
    <div className="min-h-screen bg-background playsheet-page">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border no-print">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link to="/">
            <Button size="icon" variant="ghost" aria-label="Home">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl leading-none text-primary">3X3 ZONE ATTACK</h1>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
              3rd/4th grade play sheet
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/sideline">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Tv className="h-4 w-4" />
                <span className="font-display text-xs hidden sm:inline">SIDELINE</span>
              </Button>
            </Link>
            <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              <span className="font-display text-xs">PRINT SHEET</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-5xl mx-auto space-y-6 playsheet-print-area">
        {/* Print-only title */}
        <div className="hidden print-only text-center">
          <div className="font-display text-2xl">3X3 ZONE ATTACK · 3RD/4TH GRADE</div>
        </div>

        {/* League rules ribbon */}
        <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-center">
          <span className="font-display text-sm tracking-wide text-foreground">
            50-YARD FIELD · 3 DOWNS TO MIDFIELD · 4 DOWNS TO SCORE
          </span>
          <span className="block text-xs text-muted-foreground mt-1">
            Their defense: 3 short defenders + 3 deep defenders. We attack the grass in between.
          </span>
          <span className="block text-[11px] text-primary mt-1.5 no-print">
            Tap any play to show it to the kids fullscreen — routes animate, swipe for next play.
          </span>
          <div className="mt-2 flex justify-center no-print">
            <LineupSwitcher />
          </div>
        </div>

        {/* Kid rules */}
        <section className="playsheet-card rounded-xl border border-primary/40 bg-primary/5 p-4">
          <h2 className="font-display text-lg text-primary tracking-wide mb-3">
            HOW WE BEAT THE 3X3 ZONE
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {KID_RULES.map((r, i) => (
              <div key={r.name} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-display text-base flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="font-display text-sm tracking-wide">{r.name}</div>
                  <div className="text-xs text-muted-foreground leading-snug">{r.rule}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-card border border-border px-3 py-2 text-xs text-foreground">
            {QB_GOLDEN_RULE}
          </div>
        </section>

        {/* Sections */}
        {PLAYSHEET_SECTIONS.map((section) => {
          const plays = section.playIds.map((id) => byId.get(id)).filter((p): p is Play => !!p);
          if (plays.length === 0) return null;
          return (
            <section key={section.title} className="playsheet-section">
              <div className="border-b-2 border-primary pb-1 mb-3">
                <h2 className="font-display text-xl text-primary tracking-wide leading-none">
                  {section.title}
                </h2>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
                  {section.subtitle}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plays.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setHuddleIdx(flatPlays.findIndex((x) => x.id === p.id))}
                    aria-label={`Show ${p.name} fullscreen in huddle view`}
                    className="playsheet-card rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary/60 active:scale-[0.99] transition"
                  >
                    <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border bg-secondary/40">
                      <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground font-display text-xl flex items-center justify-center shrink-0">
                        {numbered.get(p.id)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-lg leading-none truncate">
                          {p.name.toUpperCase()}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                          {p.formation}
                          {p.playType === "run" && " · RUN"}
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <FootballField play={p} assignment={assignment} players={players} />
                    </div>
                    <div className="px-3 pb-3 space-y-1.5">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-primary font-display">
                          QB says
                        </span>
                        <p className="text-xs leading-snug">{p.keyRead}</p>
                      </div>
                      {p.notes && (
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-display">
                            Huddle cue
                          </span>
                          <p className="text-xs leading-snug text-muted-foreground">{p.notes}</p>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground no-print pb-4">
          These plays live in the main library under the ZONE BEATER tag — star them to build your
          game-day list.
        </p>
      </main>

      {/* Fullscreen huddle carousel for the iPad on the sideline */}
      <HuddleView
        open={huddleIdx !== null}
        plays={flatPlays}
        index={huddleIdx ?? 0}
        assignment={assignment}
        players={players}
        isFavorite={(id) => favorites.has(id)}
        onToggleFavorite={(id) => favorites.toggle(id)}
        onIndex={(i) => setHuddleIdx(i)}
        onClose={() => setHuddleIdx(null)}
      />
    </div>
  );
}
