import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { DefenseType, Play, PlayTag } from "@/lib/types";
import { PRESET_PLAYS } from "@/lib/plays";
import { saveCustomPlays } from "@/lib/storage";
import { TAG_LABELS } from "@/lib/routes";
import { liveStatsFromLog, suggestPlays } from "@/lib/suggest";
import { addScore } from "@/lib/game";
import { FootballField } from "@/components/FootballField";
import { HuddleView } from "@/components/HuddleView";
import { LineupSwitcher } from "@/components/LineupSwitcher";
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
  Dumbbell,
  Flag,
  Menu,
  Pencil,
  RefreshCw,
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
          "The one play sheet: play diagrams, coach suggestions, one-tap results, and stats that build themselves.",
      },
    ],
  }),
  component: GameDay,
});

// Keep it simple on the sideline: three filters plus the starred list.
const FILTER_TAGS: PlayTag[] = ["short", "deep", "run"];

function GameDay() {
  const [defense, setDefense] = useState<DefenseType>("zone");
  const [customs, setCustoms] = useCustomPlays();
  const players = usePlayers();
  const assignment = useAssignment();
  const favorites = useFavorites();
  const recent = useRecentCalls();
  const { log, gameStart } = useCallLog();
  const [situation] = useSituation();

  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<Set<PlayTag>>(new Set());
  const [favOnly, setFavOnly] = useState(false);
  const [huddleIdx, setHuddleIdx] = useState<number | null>(null);
  const [skipIds, setSkipIds] = useState<Set<string>>(new Set());

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

  // Suggestions: starred + hot today, re-ranked as results are recorded.
  const liveStats = useMemo(() => liveStatsFromLog(log, gameStart), [log, gameStart]);
  const suggested = useMemo(
    () =>
      suggestPlays(basePlays, {
        stats: liveStats,
        isStarred: (id) => favorites.has(id),
        recentIds: recent.map((r) => r.id),
        excludeIds: skipIds,
      }),
    [basePlays, liveStats, favorites, recent, skipIds],
  );

  const freshPlays = () => {
    const currentIds = suggested.suggestions.map((s) => s.play.id);
    const next = new Set([...skipIds, ...currentIds]);
    setSkipIds(next.size >= basePlays.length - 3 ? new Set() : next);
  };

  const filtering = search.trim() !== "" || activeTags.size > 0 || favOnly;
  const showSuggested = !filtering;

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

        {/* Scoreboard: tap-only, no typing */}
        <div className="px-4 pb-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <span className="font-display text-2xl text-primary leading-none">
              US {situation.ourScore}
            </span>
            <ScoreChip label="+6" onClick={() => addScore("us", 6)} />
            <ScoreChip label="+1" onClick={() => addScore("us", 1)} />
            <span className="text-muted-foreground mx-1">·</span>
            <span className="font-display text-2xl leading-none">THEM {situation.oppScore}</span>
            <ScoreChip label="+6" onClick={() => addScore("them", 6)} />
            <ScoreChip label="+1" onClick={() => addScore("them", 1)} />
            <div className="ml-auto">
              <LineupSwitcher />
            </div>
          </div>
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

        {/* Search + the three filters that matter */}
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
              className={`text-xs px-3 py-2 rounded-full font-display tracking-wide flex items-center gap-1 ${
                favOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Star className={`h-3 w-3 ${favOnly ? "fill-primary-foreground" : ""}`} /> GAME DAY
            </button>
            {FILTER_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`text-xs px-3 py-2 rounded-full font-display tracking-wide ${
                  activeTags.has(t)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {TAG_LABELS[t].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-4 pt-4 max-w-6xl mx-auto space-y-5">
        {/* Coach says: starred + hot today */}
        {showSuggested && suggested.suggestions.length > 0 && (
          <section>
            <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 mb-2 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg text-primary leading-none">
                  {suggested.headline}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  {suggested.detail}
                </div>
              </div>
              <button
                onClick={freshPlays}
                className="shrink-0 text-[10px] px-2 py-1.5 rounded-full font-display tracking-wider bg-secondary text-muted-foreground hover:text-foreground flex items-center gap-1 active:scale-95 transition"
                aria-label="Deal four fresh suggested plays"
              >
                <RefreshCw className="h-3 w-3" /> FRESH PLAYS
              </button>
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

function ScoreChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2.5 py-1.5 rounded-full font-display tracking-wider bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition"
    >
      {label}
    </button>
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
