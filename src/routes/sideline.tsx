import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { DefenseType, Play } from "@/lib/types";
import { PRESET_PLAYS } from "@/lib/plays";
import { FootballField } from "@/components/FootballField";
import { SituationBar, SITUATION_PRESETS } from "@/components/SituationBar";
import { LineupSwitcher } from "@/components/LineupSwitcher";
import { useAssignment, useCustomPlays, useFavorites, usePlayers, useRecentCalls, useSituation } from "@/hooks/use-storage";
import { pushRecentCall, saveRecentCalls, tagLastCall } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { BookOpen, ChevronLeft, ChevronRight, Home, Printer, Star, ThumbsDown, ThumbsUp, Trash2, Play as PlayIcon, RotateCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sideline")({
  head: () => ({
    meta: [
      { title: "Sideline — Flag 6v6" },
      { name: "description", content: "Game-day sideline view: down/distance, situational plays, big field, and last-call tracking." },
    ],
  }),
  component: Sideline,
});

function Sideline() {
  const [defense, setDefense] = useState<DefenseType>("zone");
  const [customs] = useCustomPlays();
  const players = usePlayers();
  const assignment = useAssignment();
  const favorites = useFavorites();
  const recent = useRecentCalls();
  const [situation, setSituation] = useSituation();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(true);

  const allPlays = useMemo(() => [...PRESET_PLAYS, ...customs], [customs]);

  const filtered = useMemo(() => {
    return allPlays.filter((p) => {
      if (p.defense !== defense) return false;
      if (favOnly && !favorites.has(p.id)) return false;
      if (activePreset) {
        const want = new Set(SITUATION_PRESETS[activePreset]?.tags ?? []);
        const tags = new Set(p.tags ?? []);
        let any = false;
        for (const t of want) if (tags.has(t)) { any = true; break; }
        if (!any) return false;
      }
      return true;
    });
  }, [allPlays, defense, favOnly, favorites, activePreset]);

  const [selectedId, setSelectedId] = useState<string>("");
  useEffect(() => {
    if (filtered.length === 0) { setSelectedId(""); return; }
    if (!filtered.find((p) => p.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const current: Play | undefined = filtered.find((p) => p.id === selectedId);
  const idx = current ? filtered.findIndex((p) => p.id === current.id) : -1;
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { setAnimKey((k) => k + 1); }, [selectedId]);

  const call = (p: Play) => {
    pushRecentCall({ id: p.id, name: p.name });
    setSelectedId(p.id);
    toast.success(`Called: ${p.name}`);
  };

  const advanceDown = (good: boolean) => {
    if (good) {
      if (situation.series === "to-score") {
        toast.success("TOUCHDOWN — +6");
        setSituation({
          ...situation,
          ourScore: situation.ourScore + 6,
          series: "to-mid",
          down: 1,
          yardLine: 5,
        });
      } else {
        setSituation({
          ...situation,
          series: "to-score",
          down: 1,
          yardLine: Math.max(situation.yardLine, 25),
        });
      }
      return;
    }
    const md = situation.series === "to-mid" ? 3 : 4;
    const next = situation.down + 1;
    if (next > md) {
      toast("Turnover on downs — reset");
      setSituation({ ...situation, series: "to-mid", down: 1, yardLine: 5 });
    } else {
      setSituation({ ...situation, down: next as 1 | 2 | 3 | 4 });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster theme="dark" position="top-center" />

      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border no-print">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link to="/">
            <Button size="icon" variant="ghost" aria-label="Home">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl leading-none text-primary">SIDELINE</h1>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Game-day call mode</p>
          </div>

          <Link to="/playsheet" className="ml-auto">
            <Button size="sm" variant="secondary" className="gap-1.5" aria-label="Open 3x3 zone play sheet">
              <BookOpen className="h-4 w-4" />
              <span className="font-display text-xs hidden sm:inline">ZONE SHEET</span>
            </Button>
          </Link>
          <div className="grid grid-cols-2 bg-secondary rounded-lg p-1 text-xs">
            <button
              onClick={() => setDefense("zone")}
              className={`px-3 py-1 rounded-md font-display tracking-wide ${defense === "zone" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >ZONE</button>
            <button
              onClick={() => setDefense("man")}
              className={`px-3 py-1 rounded-md font-display tracking-wide ${defense === "man" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >MAN</button>
          </div>
          <button
            onClick={() => setFavOnly((v) => !v)}
            className={`text-[11px] px-2.5 py-1.5 rounded-full font-display tracking-wider flex items-center gap-1 ${favOnly ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
          >
            <Star className={`h-3 w-3 ${favOnly ? "fill-primary-foreground" : ""}`} /> GAME DAY
          </button>
          <button
            onClick={() => window.print()}
            className="text-[11px] px-2.5 py-1.5 rounded-full font-display tracking-wider bg-secondary text-muted-foreground flex items-center gap-1"
            aria-label="Print wristband"
          >
            <Printer className="h-3 w-3" /> WRISTBAND
          </button>
        </div>

        <div className="px-4 pb-3 no-print space-y-2">
          <SituationBar
            situation={situation}
            onChange={setSituation}
            activePreset={activePreset}
            onPreset={setActivePreset}
          />
          <LineupSwitcher />
        </div>
      </header>

      {/* Two-pane main */}
      <main className="px-4 py-4 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 no-print">
        {/* Left: call list */}
        <section className="space-y-2 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto pr-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
            {filtered.length} plays · {activePreset ? SITUATION_PRESETS[activePreset].label : "ALL"}
          </div>
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground italic p-4 border border-dashed border-border rounded-lg text-center">
              No plays match. {favOnly && "Star plays on the home page or "}
              <button onClick={() => setFavOnly(false)} className="underline">show all</button>.
            </div>
          )}
          {filtered.map((p, i) => (
            <button
              key={p.id}
              onClick={() => call(p)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left active:scale-[0.99] transition ${
                p.id === selectedId
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/40 hover:bg-secondary"
              }`}
            >
              <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground font-display text-xl flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-base leading-tight truncate flex items-center gap-1.5">
                  {favorites.has(p.id) && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                  {p.name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {p.formation}{p.keyRead ? ` · ${p.keyRead}` : ""}
                </div>
              </div>
              {p.tags && p.tags.length > 0 && (
                <div className="hidden xl:flex gap-1">
                  {p.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-background/60 font-display tracking-wide">
                      {t.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </section>

        {/* Right: big field + recent + result */}
        <section className="space-y-3">
          {current ? (
            <>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="secondary"
                  onClick={() => setSelectedId(filtered[(idx - 1 + filtered.length) % filtered.length].id)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center min-w-0">
                  <div className="font-display text-3xl text-primary leading-none truncate">
                    {current.name.toUpperCase()}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5 truncate">
                    {current.formation} · {idx + 1}/{filtered.length}
                  </div>
                </div>
                <Button size="icon" variant="secondary"
                  onClick={() => setSelectedId(filtered[(idx + 1) % filtered.length].id)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-xl overflow-hidden">
                <FootballField
                  play={current}
                  assignment={assignment}
                  players={players}
                  big
                  animate
                  animateKey={animKey}
                />
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setAnimKey((k) => k + 1)}>
                  <PlayIcon className="h-4 w-4 mr-1.5" /> Play Routes
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAnimKey((k) => k + 1)}>
                  <RotateCw className="h-4 w-4 mr-1.5" /> Replay
                </Button>
              </div>

              {current.keyRead && (
                <div className="bg-card rounded-lg p-2.5">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-display">Key Read</div>
                  <div className="text-sm leading-snug">{current.keyRead}</div>
                </div>
              )}

              {/* Last called + result */}
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">Last Called</div>
                  {recent.length > 0 && (
                    <button onClick={() => { saveRecentCalls([]); toast("Cleared"); }}
                      className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
                {recent[0] ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-display text-lg leading-none truncate">{recent[0].name}</div>
                    <Button size="sm" onClick={() => { tagLastCall("good"); advanceDown(true); }}>
                      <ThumbsUp className="h-4 w-4 mr-1.5" /> GOOD
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { tagLastCall("bad"); advanceDown(false); toast("Marked bad — next down"); }}>
                      <ThumbsDown className="h-4 w-4 mr-1.5" /> NO GAIN
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No call yet — pick a play on the left.</div>
                )}
                {recent.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {recent.slice(1, 8).map((r) => (
                      <span key={r.at} className={`text-[10px] px-1.5 py-0.5 rounded font-display tracking-wide ${
                        r.result === "good" ? "bg-primary/20 text-primary" :
                        r.result === "bad" ? "bg-destructive/20 text-destructive" :
                        "bg-background/40 text-muted-foreground"
                      }`}>{r.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground italic p-8 text-center">Pick a play to get started.</div>
          )}
        </section>
      </main>

      {/* Wristband print layout — only visible when printing */}
      <div className="wristband-print hidden">
        <div className="wb-cell" style={{ gridColumn: "1 / -1", textAlign: "center", fontSize: "14pt" }}>
          {defense.toUpperCase()} · {activePreset ? SITUATION_PRESETS[activePreset].label : "ALL SITUATIONS"}
        </div>
        {filtered.slice(0, 16).map((p, i) => (
          <div key={p.id} className="wb-cell">
            <div style={{ fontSize: "16pt", lineHeight: 1 }}>
              {i + 1}. {p.name}
            </div>
            <div style={{ fontSize: "9pt", opacity: 0.7 }}>{p.formation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
