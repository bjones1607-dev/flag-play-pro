import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PRESET_PLAYS } from "@/lib/plays";
import { ROUTE_LABELS } from "@/lib/routes";
import { FootballField } from "@/components/FootballField";
import { useCustomPlays } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Home, Printer } from "lucide-react";
import type { Play } from "@/lib/types";

export const Route = createFileRoute("/print-plays")({
  head: () => ({
    meta: [
      { title: "Print Plays — Flag Football Playbook" },
      { name: "description", content: "Pick your custom and favorite plays and print them two per page for the huddle." },
      { property: "og:title", content: "Print Plays — Flag Football Playbook" },
      { property: "og:description", content: "Print your custom flag football plays two per page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrintPlays,
});

function PrintPlays() {
  const [customs] = useCustomPlays();
  const [selected, setSelected] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  // Pre-select all custom plays once they load (until the coach changes the selection)
  useEffect(() => {
    if (!touched) setSelected(customs.map((p) => p.id));
  }, [customs, touched]);

  const all = useMemo(() => [...customs, ...PRESET_PLAYS], [customs]);
  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);
  const chosen = selected.map((id) => byId.get(id)).filter((p): p is Play => !!p);

  const toggle = (id: string) => {
    setTouched(true);
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const pages: Play[][] = [];
  for (let i = 0; i < chosen.length; i += 2) pages.push(chosen.slice(i, i + 2));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border no-print">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link to="/">
            <Button size="icon" variant="ghost" aria-label="Home"><Home className="h-5 w-5" /></Button>
          </Link>
          <h1 className="font-display text-xl text-primary">PRINT PLAYS</h1>
          <Button size="sm" className="ml-auto gap-1.5" disabled={!chosen.length} onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            <span className="font-display text-xs">PRINT {chosen.length} (2/PAGE)</span>
          </Button>
        </div>
      </header>

      <section className="px-4 py-4 max-w-5xl mx-auto space-y-4 no-print">
        <PickList title="MY CUSTOM PLAYS" plays={customs} selected={selected} toggle={toggle}
          empty="No custom plays yet — build one in the designer, then come back." />
        <PickList title="PLAYBOOK" plays={PRESET_PLAYS} selected={selected} toggle={toggle} />
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => { setTouched(true); setSelected([]); }}>Clear</Button>
        </div>
        <p className="text-xs text-muted-foreground">Preview below. Print at 100% scale, then laminate.</p>
      </section>

      <main className="print-plays-area px-4 pb-8 max-w-3xl mx-auto space-y-6">
        {pages.map((pg, i) => (
          <div key={i} className="print-page space-y-4">
            {pg.map((p) => <PlayCard key={p.id} play={p} num={chosen.indexOf(p) + 1} />)}
          </div>
        ))}
      </main>
    </div>
  );
}

function PickList({ title, plays, selected, toggle, empty }: {
  title: string; plays: Play[]; selected: string[]; toggle: (id: string) => void; empty?: string;
}) {
  return (
    <div>
      <div className="text-xs font-display tracking-widest text-muted-foreground mb-1.5">{title}</div>
      {plays.length === 0 && empty ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <div className="flex flex-wrap gap-1.5">
          {plays.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)}
                className={`text-xs px-2.5 py-1 rounded-full font-display tracking-wide ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {on && `${selected.indexOf(p.id) + 1}. `}{p.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlayCard({ play, num }: { play: Play; num: number }) {
  return (
    <div className="print-card rounded-xl border-2 border-border p-3 bg-card">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-display text-2xl text-primary">{num}</span>
        <span className="font-display text-2xl">{play.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{play.formation}</span>
      </div>
      <div className="print-field"><FootballField play={play} showLabels /></div>
      <div className="mt-2 text-sm space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {play.receivers.map((r, i) => `${r.isCenter ? "C" : `R${i + 1}`}: ${ROUTE_LABELS[r.route] ?? r.route}`).join(" · ")}
        </div>
        {play.keyRead && <div><b>QB reads:</b> {play.keyRead}</div>}
        {play.purpose && <div><b>Why:</b> {play.purpose}</div>}
        {play.notes && <div><b>Notes:</b> {play.notes}</div>}
      </div>
    </div>
  );
}
