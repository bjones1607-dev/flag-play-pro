import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { DefenseType, Play, PlayTag } from "@/lib/types";
import { PRESET_PLAYS } from "@/lib/plays";
import { saveCustomPlays } from "@/lib/storage";
import { ALL_TAGS, TAG_LABELS } from "@/lib/routes";
import { liveStatsFromLog, suggestPlays } from "@/lib/suggest";
import { FootballField } from "@/components/FootballField";
import { HuddleView } from "@/components/HuddleView";
import { LineupSwitcher } from "@/components/LineupSwitcher";
import { SituationBar } from "@/components/SituationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Dumbbell,
  Flag,
  Menu,
  Pencil,
  Search,
  Shield,
  Star,
  Watch,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import {
  useAssignment,
  useCallLog,
  useCustomPlays,
  useDrives,
  useFavorites,
  usePlayers,
  useRecentCalls,
  useSituation,
} from "@/hooks/use-storage";
import { decodePlayFromHash } from "@/lib/share";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Game Day — Flag 6v6" },
      {
        name: "description",
        content:
          "The one play sheet: live down & distance, coach suggestions, play diagrams, and one-tap results.",
      },
    ],
  }),
  component: GameDay,
});

function GameDay() {
  const [defense, setDefense] = useState<DefenseType>("zone");
  const [customs, setCustoms] = useCustomPlays();
  const players = usePlayers();
  const assignment = useAssignment();
  const favorites = useFavorites();
  const recent = useRecentCalls();
  const { log, gameStart } = useCallLog();
  const drives = useDrives();
  const [situation, setSituation] = useSituation();

  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<Set<PlayTag>>(new Set());
  const [favOnly, setFavOnly] = useState(false);
  const [huddleIdx, setHuddleIdx] = useState<number | null>(null);
  const [gameOpen, setGameOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Hydrate a shared play from URL hash on first load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shared = decodePlayFromHash(window.location.hash);
    if (!shared) return;
    const id = shared.id?.startsWith("custom-") ? shared.id : `custom-${Date.now()}`;
    const next = [...customs, { ...shared, id, custom: true }];
    saveCustomPlays(next);
    setCustoms(next);
    setDefense(shared.defense);
    history.replaceState(null, "", window.location.pathname);
    toast.success(`Imported play "${shared.name}"`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allPlays = useMemo(() => [...PRESET_PLAYS, ...customs], [customs]);
  const basePlays = useMemo(
    () => allPlays.filter((p) => p.defense === defense),
    [allPlays, defense],
  );

  // Anticipatory suggestions — re-rank after every snap.
  const liveStats = useMemo(() => liveStatsFromLog(log, gameStart), [log, gameStart]);
  const suggested = useMemo(
    () =>
      suggestPlays(basePlays, situation, {
        stats: liveStats,
        isStarred: (id) => favorites.has(id),
        recentIds: recent.map((r) => r.id),
      }),
    [basePlays, situation, liveStats, favorites, recent],
  );

  const filtering = search.trim() !== "" || activeTags.size > 0 || favOnly;
  const showSuggested = !filtering;

  // Filtered grid; favorites first. When the suggestion strip is showing,
  // its four plays are excluded from the grid below to avoid duplicates.
  const gridPlays = useMemo(() => {
    const q = search.trim().toLowerCase();
    const suggestedIds = new Set(showSuggested ? suggested.suggestions.map((s) => s.play.id) : []);
    const filtered = basePlays.filter((p) => {
      if (suggestedIds.has(p.id)) return false;
      if (favOnly && !favorites.has(p.id)) return false;
      if (activeTags.size > 0) {
        const tags = new Set(p.tags ?? []);
        for (const t of activeTags) if (!tags.has(t)) return false;
      }
      if (!q) return true;
      const hay =
        `${p.name} ${p.formation} ${p.purpose} ${p.keyRead} ${(p.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
    return [
      ...filtered.filter((p) => favorites.has(p.id)),
      ...filtered.filter((p) => !favorites.has(p.id)),
    ];
  }, [basePlays, search, activeTags, favOnly, favorites, showSuggested, suggested]);

  // One flat list drives the huddle carousel: suggested first, then grid.
  const carousel = useMemo(
    () => (showSuggested ? [...suggested.suggestions.map((s) => s.play), ...gridPlays] : gridPlays),
    [showSuggested, suggested, gridPlays],
  );

  const openHuddle = (playId: string) => {
    const i = carousel.findIndex((p) => p.id === playId);
    if (i >= 0) setHuddleIdx(i);
  };

  const toggleTag = (t: PlayTag) => {
    setActiveTags((cur) => {
      const n = new Set(cur);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };

  const gameDrives = drives.drives.filter((d) => d.at >= gameStart);

  return (
    <div className="min-h-screen bg-background pb-8">
      <Toaster theme="dark" position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex flex-wrap items-center gap-x-2 gap-y-2">
          <div>
            <h1 className="font-display text-2xl leading-none text-primary">FLAG · 6V6</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Game day play sheet
            </p>
          </div>
          <div className="ml-auto flex gap-1">
            <Link to="/designer">
              <Button
                variant="secondary"
                className="gap-1.5 px-3"
                aria-label="Open the play designer"
              >
                <Pencil className="h-4 w-4" />
                <span className="font-display text-sm hidden sm:inline">DESIGNER</span>
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="More coaching tools">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/halftime" className="flex items-center gap-2">
                    <Flag className="h-4 w-4" /> Halftime Card
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/stats" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Play Stats
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/playsheet" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Printable Zone Sheet
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/defense" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Defense (3-3 Zone)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/practice" className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" /> Practice Plan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wristband" className="flex items-center gap-2">
                    <Watch className="h-4 w-4" /> Wristband Cards
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Game bar: score + situation, tap to expand full controls */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setGameOpen((v) => !v)}
            className="w-full flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-left"
            aria-expanded={gameOpen}
            aria-label="Toggle game controls"
          >
            <div className="font-display text-lg text-primary leading-none">
              US {situation.ourScore} · THEM {situation.oppScore}
            </div>
            <div className="flex-1 text-[11px] uppercase tracking-widest text-muted-foreground truncate">
              {suggested.headline}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition ${gameOpen ? "rotate-180" : ""}`}
            />
          </button>
          {gameOpen && (
            <div className="mt-2 space-y-2">
              <SituationBar
                situation={situation}
                onChange={setSituation}
                activePreset={activePreset}
                onPreset={setActivePreset}
              />
              <LineupSwitcher />
            </div>
          )}
          {/* Drive strips */}
          {(gameDrives.length > 0 || drives.current.plays > 0) && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {gameDrives.map((d) => (
                <span
                  key={d.at}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-display tracking-wide ${
                    d.result === "TD"
                      ? "bg-primary/20 text-primary"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {d.result} · {d.plays} plays · {d.yards > 0 ? "+" : ""}
                  {d.yards} yds
                </span>
              ))}
              {drives.current.plays > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-display tracking-wide bg-background/60 text-muted-foreground">
                  THIS DRIVE · {drives.current.plays} plays · {drives.current.yards > 0 ? "+" : ""}
                  {drives.current.yards} yds
                </span>
              )}
            </div>
          )}
        </div>

        {/* Defense toggle */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setDefense("zone")}
              className={`py-2 rounded-md font-display tracking-wide text-sm transition ${
                defense === "zone"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground"
              }`}
            >
              3-3 ZONE
            </button>
            <button
              onClick={() => setDefense("man")}
              className={`py-2 rounded-md font-display tracking-wide text-sm transition ${
                defense === "man"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground"
              }`}
            >
              MAN-TO-MAN
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="px-4 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plays"
                className="pl-9 h-9"
              />
            </div>
            <button
              onClick={() => setFavOnly(!favOnly)}
              className={`text-[11px] px-2.5 py-1.5 rounded-full font-display tracking-wide flex items-center gap-1 ${
                favOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Star className={`h-3 w-3 ${favOnly ? "fill-primary-foreground" : ""}`} /> GAME DAY
            </button>
            {ALL_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`text-[11px] px-2 py-1.5 rounded-full font-display tracking-wide ${
                  activeTags.has(t)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {TAG_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-4 pt-4 max-w-6xl mx-auto space-y-5">
        {/* Coach says: anticipatory suggestions for the current drive */}
        {showSuggested && suggested.suggestions.length > 0 && (
          <section>
            <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 mb-2">
              <div className="font-display text-lg text-primary leading-none">
                {suggested.headline}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                {suggested.detail}
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {suggested.suggestions.map(({ play: p, reason }) => (
                <PlayCard
                  key={p.id}
                  play={p}
                  caption={reason}
                  highlight
                  starred={favorites.has(p.id)}
                  onStar={() => favorites.toggle(p.id)}
                  onOpen={() => openHuddle(p.id)}
                  assignment={assignment}
                  players={players}
                />
              ))}
            </div>
          </section>
        )}

        {/* Full sheet */}
        <section>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">
            {showSuggested ? "FULL SHEET" : `${gridPlays.length} PLAYS`} · tap a play to show the
            kids · record the result right in the huddle
          </div>
          {gridPlays.length === 0 && !showSuggested ? (
            <div className="p-8 text-center text-muted-foreground">
              No plays match.{" "}
              <Button
                variant="link"
                onClick={() => {
                  setSearch("");
                  setActiveTags(new Set());
                  setFavOnly(false);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {gridPlays.map((p) => (
                <PlayCard
                  key={p.id}
                  play={p}
                  caption={p.keyRead || p.purpose}
                  starred={favorites.has(p.id)}
                  onStar={() => favorites.toggle(p.id)}
                  onOpen={() => openHuddle(p.id)}
                  assignment={assignment}
                  players={players}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Fullscreen huddle with one-tap results */}
      <HuddleView
        open={huddleIdx !== null}
        plays={carousel}
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

function PlayCard({
  play,
  caption,
  highlight,
  starred,
  onStar,
  onOpen,
  assignment,
  players,
}: {
  play: Play;
  caption: string;
  highlight?: boolean;
  starred: boolean;
  onStar: () => void;
  onOpen: () => void;
  assignment: ReturnType<typeof useAssignment>;
  players: ReturnType<typeof usePlayers>;
}) {
  return (
    <div
      className={`rounded-lg bg-secondary/60 hover:bg-secondary border overflow-hidden transition ${
        highlight ? "border-primary/60" : "border-border"
      }`}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          onClick={onStar}
          className="p-1 shrink-0"
          aria-label={starred ? `Unstar ${play.name}` : `Star ${play.name}`}
        >
          <Star
            className={`h-4 w-4 ${starred ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm leading-tight truncate">{play.name}</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">
            {play.formation}
            {play.playType === "run" && " · RUN"}
            {play.custom && " · CUSTOM"}
          </div>
        </div>
      </div>
      <button
        onClick={onOpen}
        className="block w-full text-left px-1.5 pb-1.5 active:scale-[0.98] transition"
        aria-label={`Show ${play.name} fullscreen`}
      >
        <FootballField play={play} assignment={assignment} players={players} />
        <div className="px-1 pt-1.5 text-[10px] text-muted-foreground leading-snug line-clamp-2">
          {caption}
        </div>
      </button>
    </div>
  );
}
