import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { DefenseType, Play } from "@/lib/types";
import { PRESET_PLAYS } from "@/lib/plays";
import { loadCustomPlays } from "@/lib/storage";
import { FootballField } from "@/components/FootballField";
import { RosterPanel } from "@/components/RosterPanel";
import { AssignmentPanel } from "@/components/AssignmentPanel";
import { PlayBuilder } from "@/components/PlayBuilder";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shuffle, Users, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flag Football 6v6 — Play Designer" },
      { name: "description", content: "Coach 6v6 flag football: visualize routes, assign players, and design custom plays for zone or man defense." },
    ],
  }),
  component: Index,
});

function Index() {
  const [defense, setDefense] = useState<DefenseType>("zone");
  const [customs, setCustoms] = useState<Play[]>([]);
  const [selectedId, setSelectedId] = useState<string>(PRESET_PLAYS[0].id);
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => { setCustoms(loadCustomPlays()); }, []);

  const allPlays = useMemo(() => [...PRESET_PLAYS, ...customs], [customs]);
  const filtered = useMemo(
    () => allPlays.filter((p) => p.defense === defense),
    [allPlays, defense]
  );

  // Reset selection when defense changes
  useEffect(() => {
    if (!filtered.find((p) => p.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? "");
    }
  }, [defense, filtered, selectedId]);

  const current = filtered.find((p) => p.id === selectedId) ?? filtered[0];
  const idx = filtered.findIndex((p) => p.id === current?.id);

  const shuffle = () => {
    if (filtered.length < 2) return;
    let next = current?.id;
    while (next === current?.id) {
      next = filtered[Math.floor(Math.random() * filtered.length)].id;
    }
    setSelectedId(next!);
  };

  const cycle = (dir: 1 | -1) => {
    const ni = (idx + dir + filtered.length) % filtered.length;
    setSelectedId(filtered[ni].id);
  };

  const refreshCustoms = () => setCustoms(loadCustomPlays());

  return (
    <div className="min-h-screen bg-background pb-8">
      <Toaster theme="dark" position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl leading-none text-primary">FLAG · 6V6</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Play Designer</p>
          </div>
          <div className="flex gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="gap-1.5 px-3">
                  <Users className="h-4 w-4" />
                  <span className="font-display text-sm">ROSTER</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] sm:w-[400px]">
                <SheetHeader><SheetTitle className="font-display text-2xl">Roster</SheetTitle></SheetHeader>
                <div className="mt-6"><RosterPanel /></div>
              </SheetContent>
            </Sheet>
            <Sheet open={builderOpen} onOpenChange={setBuilderOpen}>
              <SheetTrigger asChild>
                <Button size="icon"><Plus className="h-4 w-4" /></Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[92vh] overflow-y-auto">
                <SheetHeader><SheetTitle className="font-display text-2xl">Custom Play</SheetTitle></SheetHeader>
                <div className="mt-4">
                  <PlayBuilder defense={defense} onSaved={() => { refreshCustoms(); setBuilderOpen(false); }} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Defense toggle */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-1 bg-secondary rounded-lg p-1">
            <button onClick={() => setDefense("zone")}
              className={`py-2 rounded-md font-display tracking-wide text-sm transition ${
                defense === "zone" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
              }`}>3-3 ZONE</button>
            <button onClick={() => setDefense("man")}
              className={`py-2 rounded-md font-display tracking-wide text-sm transition ${
                defense === "man" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
              }`}>MAN-TO-MAN</button>
          </div>
        </div>
      </header>

      {!current ? (
        <div className="p-8 text-center text-muted-foreground">No plays for this defense yet.</div>
      ) : (
        <main className="px-4 pt-4 space-y-4">
          {/* Play nav */}
          <div className="flex items-center gap-2">
            <Button size="icon" variant="secondary" onClick={() => cycle(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <div className="font-display text-3xl text-primary leading-none">{current.name.toUpperCase()}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                {current.formation} · {idx + 1}/{filtered.length} {current.custom && "· custom"}
              </div>
            </div>
            <Button size="icon" variant="secondary" onClick={() => cycle(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Field */}
          <FootballField play={current} assignment={loadAssignmentSafe()} players={loadPlayersSafe()} />

          {/* Action bar */}
          <Button onClick={shuffle} className="w-full" size="lg" variant="default">
            <Shuffle className="h-4 w-4 mr-2" /> Shuffle Play
          </Button>

          {/* Tabs */}
          <Tabs defaultValue="strategy" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="assign">Assign</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
            </TabsList>

            <TabsContent value="strategy" className="space-y-3 mt-4">
              <Card label="Purpose">{current.purpose}</Card>
              <Card label="Key Read">{current.keyRead || "—"}</Card>
              <Card label="Formation">{current.formation}</Card>
              <Card label="Routes">
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {current.receivers.map((r, i) => (
                    <span key={r.id} className="px-2 py-1 rounded text-xs font-display tracking-wide"
                      style={{ background: `var(--route-${(i % 5) + 1})`, color: "#0a1a0e" }}>
                      R{i+1} {r.route.toUpperCase()}
                    </span>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="assign" className="mt-4">
              <AssignmentPanel play={current} key={current.id} />
            </TabsContent>

            <TabsContent value="library" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {filtered.length} plays · {filtered.filter(p => p.custom).length} custom
                </p>
                <Button size="sm" variant="ghost" onClick={() => setBuilderOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" /> New
                </Button>
              </div>
              {filtered.map((p) => (
                <div key={p.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                    p.id === current.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary"
                  }`}>
                  <button onClick={() => setSelectedId(p.id)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <div className="font-display text-lg leading-none">{p.name}</div>
                      {p.custom && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-display">CUSTOM</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{p.formation} · {p.purpose.slice(0, 50)}{p.purpose.length > 50 ? "…" : ""}</div>
                  </button>
                  {p.custom && (
                    <Button size="icon" variant="ghost" onClick={() => {
                      const next = customs.filter(c => c.id !== p.id);
                      setCustoms(next); saveCustomPlays(next);
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </main>
      )}
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg p-3 border border-border">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">{label}</div>
      <div className="text-sm mt-1 text-foreground">{children}</div>
    </div>
  );
}

// SSR-safe wrappers
function loadAssignmentSafe() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("ff_assignment_v1") || "{}"); } catch { return {}; }
}
function loadPlayersSafe() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("ff_players_v1") || "[]"); } catch { return []; }
}
