import { createFileRoute, Link } from "@tanstack/react-router";
import { DEF_KID_RULES, DEFENSIVE_CALLS } from "@/lib/defense";
import { DefenseField } from "@/components/DefenseField";
import { Button } from "@/components/ui/button";
import { Home, Printer, Shield, Tv } from "lucide-react";

export const Route = createFileRoute("/defense")({
  head: () => ({
    meta: [
      { title: "Defense — 3-3 Zone Call Sheet" },
      {
        name: "description",
        content:
          "Defensive call sheet for 3rd/4th grade 6v6: our 3-3 zone base plus Squeeze, Spy, Goal Line, and Lock adjustments with kid rules and diagrams.",
      },
    ],
  }),
  component: Defense,
});

function Defense() {
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
              <Shield className="h-5 w-5" /> DEFENSE
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Our 3-3 zone call sheet
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
              <span className="font-display text-xs">PRINT</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-5xl mx-auto space-y-6 playsheet-print-area">
        <div className="hidden print-only text-center">
          <div className="font-display text-2xl">DEFENSE · 3-3 ZONE · 3RD/4TH GRADE</div>
        </div>

        {/* Kid rules */}
        <section className="playsheet-card rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <h2 className="font-display text-lg text-destructive tracking-wide mb-3">
            DEFENSE RULES — EVERY KID, EVERY SNAP
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEF_KID_RULES.map((r, i) => (
              <div key={r.name} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground font-display text-base flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="font-display text-sm tracking-wide">{r.name}</div>
                  <div className="text-xs text-muted-foreground leading-snug">{r.rule}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Calls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEFENSIVE_CALLS.map((call, i) => (
            <article
              key={call.id}
              className="playsheet-card rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border bg-secondary/40">
                <div className="w-9 h-9 rounded-md bg-destructive text-destructive-foreground font-display text-xl flex items-center justify-center shrink-0">
                  D{i + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-lg leading-none truncate">
                    {call.name.toUpperCase()}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5 truncate">
                    {call.subtitle}
                  </div>
                </div>
              </div>
              <div className="p-2">
                <DefenseField call={call} />
              </div>
              <div className="px-3 pb-3 space-y-1.5">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-primary font-display">
                    When to call it
                  </span>
                  <p className="text-xs leading-snug">{call.when}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-display">
                    Jobs
                  </span>
                  <ul className="text-xs leading-snug text-muted-foreground space-y-0.5 mt-0.5">
                    {call.rules.map((r) => (
                      <li key={r.pos}>
                        <span className="text-foreground font-medium">{r.pos}:</span> {r.rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground no-print pb-4">
          Start in Base 33 · Squeeze vs trips · Spy a running QB · Goal Line inside the 10 · Lock to
          change the picture
        </p>
      </main>
    </div>
  );
}
