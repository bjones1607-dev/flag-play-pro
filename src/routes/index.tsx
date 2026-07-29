import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { DefenseType, Play, PlayTag } from "@/lib/types";
import { PRESET_PLAYS } from "@/lib/plays";
import { saveCustomPlays } from "@/lib/storage";
import { ALL_TAGS, TAG_LABELS } from "@/lib/routes";
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
  Menu,
  Pencil,
  Search,
  Shield,
  Star,
  Tv,
  Watch,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useAssignment, useCustomPlays, useFavorites, usePlayers } from "@/hooks/use-storage";
import { decodePlayFromHash } from "@/lib/share";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Game Day Call Sheet — Flag 6v6" },
      {
        name: "description",
        content:
          "The game-day call sheet: scroll your play diagrams, tap one to show the kids fullscreen, and run the offense.",
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

  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<Set<PlayTag>>(new Set());
  const [favOnly, setFavOnly] = useState(false);
  const [huddleIdx, setHuddleIdx] = useState<number | null>(null);

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

  // Filter, then favorites first — this order drives the grid AND the huddle carousel.
  const plays = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = allPlays.filter((p) => {
      if (p.defense !== defense) return false;
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
  }, [allPlays, defense, search, activeTags, favOnly, favorites]);

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
              Game day call sheet
            </p>
          </div>
          <div className="ml-auto flex gap-1">
            <Link to="/sideline">
              <Button variant="secondary" className="gap-1.5 px-3" aria-label="Open sideline mode">
                <Tv className="h-4 w-4" />
                <span className="font-display text-sm hidden sm:inline">SIDELINE</span>
              </Button>
            </Link>
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
                  <Link to="/playsheet" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> 3x3 Zone Sheet
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/defense" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Defense (3-3 Zone)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/stats" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Play Stats
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
        <div className="px-4 pb-3 space-y-2">
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
          <LineupSwitcher />
        </div>
      </header>

      {/* Play grid */}
      <main className="px-4 pt-4 max-w-6xl mx-auto">
        {plays.length === 0 ? (
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
          <>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">
              {plays.length} plays · tap one to show the kids · star your game-day list
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {plays.map((p, i) => (
                <div
                  key={p.id}
                  className="rounded-lg bg-secondary/60 hover:bg-secondary border border-border overflow-hidden transition"
                >
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <button
                      onClick={() => favorites.toggle(p.id)}
                      className="p-1 shrink-0"
                      aria-label={favorites.has(p.id) ? `Unstar ${p.name}` : `Star ${p.name}`}
                    >
                      <Star
                        className={`h-4 w-4 ${favorites.has(p.id) ? "fill-primary text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm leading-tight truncate">{p.name}</div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">
                        {p.formation}
                        {p.playType === "run" && " · RUN"}
                        {p.custom && " · CUSTOM"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setHuddleIdx(i)}
                    className="block w-full text-left px-1.5 pb-1.5 active:scale-[0.98] transition"
                    aria-label={`Show ${p.name} fullscreen`}
                  >
                    <FootballField play={p} assignment={assignment} players={players} />
                    <div className="px-1 pt-1.5 text-[10px] text-muted-foreground leading-snug line-clamp-2">
                      {p.keyRead || p.purpose}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Fullscreen huddle */}
      <HuddleView
        open={huddleIdx !== null}
        plays={plays}
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
