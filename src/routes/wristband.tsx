import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import type { Play } from "@/lib/types";
import { PRESET_PLAYS } from "@/lib/plays";
import { playsheetOrder } from "@/lib/playsheet";
import { ROUTE_LABELS } from "@/lib/routes";
import { useAssignment, usePlayers } from "@/hooks/use-storage";
import { LineupSwitcher } from "@/components/LineupSwitcher";
import { Button } from "@/components/ui/button";
import { Home, Printer, Watch } from "lucide-react";

export const Route = createFileRoute("/wristband")({
  head: () => ({
    meta: [
      { title: "Wristband Cards — Flag 6v6" },
      {
        name: "description",
        content:
          "Printable per-player wristband cards: every numbered play with that kid's own job, generated from the active lineup.",
      },
    ],
  }),
  component: Wristband,
});

const SLOTS: { id: string; label: string }[] = [
  { id: "qb", label: "QB" },
  { id: "r1", label: "R1" },
  { id: "r2", label: "R2" },
  { id: "r3", label: "C" },
  { id: "r4", label: "R4" },
  { id: "r5", label: "R5" },
];

function jobFor(play: Play, slotId: string): string {
  if (slotId === "qb") {
    if (play.playType === "run" && play.qbAction === "keep-right") return "Run right";
    if (play.playType === "run" && play.qbAction === "keep-left") return "Run left";
    if (play.qbAction === "scramble") return "Fake pass, run";
    if (play.playType === "run") return "Hand off";
    return "Throw — read the sheet";
  }
  const r = play.receivers.find((x) => x.id === slotId);
  if (!r) return "—";
  if (r.isRunner) return `BALL — ${ROUTE_LABELS[r.route]}`;
  return ROUTE_LABELS[r.route];
}

function Wristband() {
  const players = usePlayers();
  const assignment = useAssignment();

  const sheet = useMemo(() => playsheetOrder(PRESET_PLAYS), []);

  const cards = SLOTS.map((slot) => {
    const pid = assignment[slot.id];
    const player = players.find((p) => p.id === pid);
    return { slot, player };
  });
  const anyAssigned = cards.some((c) => c.player);

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
              <Watch className="h-5 w-5" /> WRISTBAND CARDS
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Each kid's job on every numbered play
            </p>
          </div>
          <div className="ml-auto">
            <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              <span className="font-display text-xs">PRINT CARDS</span>
            </Button>
          </div>
        </div>
        <div className="px-4 pb-3 no-print">
          <LineupSwitcher />
        </div>
      </header>

      <main className="px-4 py-4 max-w-5xl mx-auto space-y-4 playsheet-print-area">
        {!anyAssigned && (
          <div className="text-sm text-muted-foreground italic p-6 border border-dashed border-border rounded-lg text-center no-print">
            No players assigned yet. Set your lineup in the Assign tab on the home page (or apply a
            saved wave) and the cards fill in automatically. Cards below show the spot's job either
            way.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ slot, player }) => (
            <article
              key={slot.id}
              className="playsheet-card rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border bg-secondary/40">
                <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground font-display text-lg flex items-center justify-center shrink-0">
                  {player ? `#${player.number}` : slot.label}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-lg leading-none truncate">
                    {player ? player.name.toUpperCase() : "OPEN SPOT"}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                    Spot: {slot.label}
                  </div>
                </div>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {sheet.map((p, i) => (
                    <tr key={p.id} className={i % 2 ? "bg-secondary/30" : undefined}>
                      <td className="px-2 py-1 font-display text-primary w-8 text-center">
                        {i + 1}
                      </td>
                      <td className="px-1 py-1 font-display tracking-wide whitespace-nowrap">
                        {p.name.toUpperCase()}
                      </td>
                      <td className="px-2 py-1 text-muted-foreground text-right">
                        {jobFor(p, slot.id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground no-print pb-4">
          Print, cut along the card edges, and slide into wristband sleeves · numbers match the play
          sheet and call sheet
        </p>
      </main>
    </div>
  );
}
