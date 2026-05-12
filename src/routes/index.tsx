import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DefenseType, Play, PlayTag } from "@/lib/types";
import { PRESET_PLAYS } from "@/lib/plays";
import { saveCustomPlays } from "@/lib/storage";
import { ALL_TAGS, TAG_LABELS } from "@/lib/routes";
import { FootballField, type FootballFieldHandle } from "@/components/FootballField";
import { RosterPanel } from "@/components/RosterPanel";
import { AssignmentPanel } from "@/components/AssignmentPanel";
import { PlayBuilder } from "@/components/PlayBuilder";
import { HuddleView } from "@/components/HuddleView";
import { CallSheet } from "@/components/CallSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shuffle,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Star,
  Maximize2,
  Search,
  Pencil,
  Copy,
  Share2,
  ImageDown,
  Tv,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useAssignment, useCustomPlays, useFavorites, usePlayers } from "@/hooks/use-storage";
import { decodePlayFromHash, downloadDataUrl, encodePlayToUrl, svgToPngDataUrl } from "@/lib/share";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flag Football 6v6 — Play Designer" },
      {
        name: "description",
        content:
          "Coach 6v6 flag football: visualize routes, assign players, design custom plays, and show them to the kids in the huddle.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [defense, setDefense] = useState<DefenseType>("zone");
  const [customs, setCustoms] = useCustomPlays();
  const players = usePlayers();
  const assignment = useAssignment();
  const favorites = useFavorites();

  const [selectedId, setSelectedId] = useState<string>(PRESET_PLAYS[0].id);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingPlay, setEditingPlay] = useState<Play | null>(null);
  const [huddleOpen, setHuddleOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<Set<PlayTag>>(new Set());
  const [favOnly, setFavOnly] = useState(false);

  const fieldRef = useRef<FootballFieldHandle>(null);

  // Hydrate a shared play from URL hash on first load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shared = decodePlayFromHash(window.location.hash);
    if (!shared) return;
    const id = shared.id?.startsWith("custom-") ? shared.id : `custom-${Date.now()}`;
    const next = [...customs, { ...shared, id, custom: true }];
    saveCustomPlays(next);
    setCustoms(next);
    setSelectedId(id);
    setDefense(shared.defense);
    history.replaceState(null, "", window.location.pathname);
    toast.success(`Imported play "${shared.name}"`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allPlays = useMemo(() => [...PRESET_PLAYS, ...customs], [customs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPlays.filter((p) => {
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
  }, [allPlays, defense, search, activeTags, favOnly, favorites]);

  useEffect(() => {
    if (!filtered.find((p) => p.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? "");
    }
  }, [filtered, selectedId]);

  const current = filtered.find((p) => p.id === selectedId) ?? filtered[0];
  const idx = filtered.findIndex((p) => p.id === current?.id);

  const cycle = (dir: 1 | -1) => {
    if (filtered.length < 2) return;
    const ni = (idx + dir + filtered.length) % filtered.length;
    setSelectedId(filtered[ni].id);
  };

  const shuffle = () => {
    if (filtered.length < 2) return;
    let next = current?.id;
    while (next === current?.id) {
      next = filtered[Math.floor(Math.random() * filtered.length)].id;
    }
    setSelectedId(next!);
  };

  // Keyboard nav: arrow keys to cycle, "f" to favorite, "s" to shuffle, "h" to huddle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (huddleOpen || builderOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        cycle(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        cycle(1);
      } else if (e.key === "f" && current) favorites.toggle(current.id);
      else if (e.key === "s") shuffle();
      else if (e.key === "h") setHuddleOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huddleOpen, builderOpen, current, filtered]);

  const toggleTag = (t: PlayTag) => {
    setActiveTags((cur) => {
      const n = new Set(cur);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };

  const onShare = async () => {
    if (!current) return;
    const url = encodePlayToUrl(current);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Play: ${current.name}`,
          text: `${current.name} — ${current.purpose}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      } catch {
        toast.error("Could not share");
      }
    }
  };

  const onExportPng = async () => {
    const svg = fieldRef.current?.svg();
    if (!svg || !current) return;
    try {
      const dataUrl = await svgToPngDataUrl(svg, 3);
      downloadDataUrl(dataUrl, `${current.name.replace(/\s+/g, "-").toLowerCase()}.png`);
      toast.success("Saved image");
    } catch {
      toast.error("Could not export image");
    }
  };

  const startEdit = (p: Play) => {
    setEditingPlay(p);
    setBuilderOpen(true);
  };
  const startDuplicate = (p: Play) => {
    setEditingPlay({ ...p, id: `custom-${Date.now()}`, name: `${p.name} (copy)`, custom: true });
    setBuilderOpen(true);
  };
  const startNew = () => {
    setEditingPlay(null);
    setBuilderOpen(true);
  };

  const builderTitle = editingPlay
    ? editingPlay.custom && editingPlay.id === customs.find((c) => c.id === editingPlay.id)?.id
      ? "Edit Play"
      : "Duplicate Play"
    : "New Play";

  return (
    <div className="min-h-screen bg-background pb-8">
      <Toaster theme="dark" position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl leading-none text-primary">FLAG · 6V6</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Play Designer
            </p>
          </div>
          <div className="flex gap-1">
            <CallSheet
              plays={allPlays.filter((p) => p.defense === defense)}
              onSelect={setSelectedId}
              onShowHuddle={() => setHuddleOpen(true)}
            />
            <Link to="/sideline">
              <Button variant="secondary" className="gap-1.5 px-3" aria-label="Open sideline mode">
                <Tv className="h-4 w-4" />
                <span className="font-display text-sm hidden sm:inline">SIDELINE</span>
              </Button>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="gap-1.5 px-3">
                  <Users className="h-4 w-4" />
                  <span className="font-display text-sm hidden sm:inline">ROSTER</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="font-display text-2xl">Roster</SheetTitle>
                  <SheetDescription className="sr-only">
                    Add and manage your players. Used in the Assign tab to put names on the field.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <RosterPanel />
                </div>
              </SheetContent>
            </Sheet>
            <Sheet
              open={builderOpen}
              onOpenChange={(open) => {
                setBuilderOpen(open);
                if (!open) setEditingPlay(null);
              }}
            >
              <SheetTrigger asChild>
                <Button size="icon" onClick={startNew}>
                  <Plus className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[92vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-display text-2xl">{builderTitle}</SheetTitle>
                  <SheetDescription className="sr-only">
                    Drag receivers and the QB to position them, pick a route for each player, and save your custom play.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <PlayBuilder
                    defense={editingPlay?.defense ?? defense}
                    initial={editingPlay}
                    onSaved={() => {
                      setBuilderOpen(false);
                      setEditingPlay(null);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Defense toggle */}
        <div className="px-4 pb-3">
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
      </header>

      {!current ? (
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
        <main className="px-4 pt-4 space-y-4 lg:max-w-6xl lg:mx-auto lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:space-y-0">
          <div className="space-y-4 min-w-0">
            {/* Play title + nav */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => cycle(-1)}
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center min-w-0">
                <div className="font-display text-3xl text-primary leading-none truncate">
                  {current.name.toUpperCase()}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 truncate">
                  {current.formation} · {idx + 1}/{filtered.length}
                  {current.playType === "run" && " · RUN"}
                  {current.custom && " · CUSTOM"}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => favorites.toggle(current.id)}
                aria-label={favorites.has(current.id) ? "Unstar" : "Star"}
              >
                <Star
                  className={`h-5 w-5 ${favorites.has(current.id) ? "fill-primary text-primary" : ""}`}
                />
              </Button>
              <Button size="icon" variant="secondary" onClick={() => cycle(1)} aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Field */}
            <button
              type="button"
              onClick={() => setHuddleOpen(true)}
              className="block w-full text-left rounded-xl"
              aria-label="Open huddle view"
            >
              <FootballField
                ref={fieldRef}
                play={current}
                assignment={assignment}
                players={players}
              />
            </button>

            {/* Action bar */}
            <div className="grid grid-cols-4 gap-2">
              <Button onClick={() => setHuddleOpen(true)} className="col-span-2" size="lg">
                <Maximize2 className="h-4 w-4 mr-2" /> Show Huddle
              </Button>
              <Button onClick={shuffle} variant="secondary" size="lg" aria-label="Shuffle">
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button onClick={onShare} variant="secondary" size="lg" aria-label="Share play">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onExportPng} variant="ghost" size="sm">
                <ImageDown className="h-4 w-4 mr-1.5" /> Save Image
              </Button>
              {current.custom ? (
                <Button onClick={() => startEdit(current)} variant="ghost" size="sm">
                  <Pencil className="h-4 w-4 mr-1.5" /> Edit
                </Button>
              ) : (
                <Button onClick={() => startDuplicate(current)} variant="ghost" size="sm">
                  <Copy className="h-4 w-4 mr-1.5" /> Duplicate to Edit
                </Button>
              )}
            </div>

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
                {current.notes && <Card label="Coaching Note">{current.notes}</Card>}
                <Card label="Formation">{current.formation}</Card>
                {current.tags && current.tags.length > 0 && (
                  <Card label="Tags">
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {current.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-display"
                        >
                          {TAG_LABELS[t]}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}
                <Card label="Routes">
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {current.receivers.map((r, i) => (
                      <span
                        key={r.id}
                        className="px-2 py-1 rounded text-xs font-display tracking-wide"
                        style={{ background: `var(--route-${(i % 5) + 1})`, color: "#0a1a0e" }}
                      >
                        R{i + 1} {r.route.toUpperCase()}
                        {r.isCenter ? " (C)" : ""}
                        {r.isRunner ? " · BALL" : ""}
                      </span>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="assign" className="mt-4">
                <AssignmentPanel play={current} key={current.id} />
              </TabsContent>

              <TabsContent value="library" className="mt-4 space-y-3 lg:hidden">
                <PlaybookFilters
                  search={search}
                  setSearch={setSearch}
                  activeTags={activeTags}
                  toggleTag={toggleTag}
                  favOnly={favOnly}
                  setFavOnly={setFavOnly}
                />
                <PlaybookList
                  plays={filtered}
                  currentId={current.id}
                  customs={customs}
                  setCustoms={setCustoms}
                  favorites={favorites}
                  onSelect={setSelectedId}
                  onEdit={startEdit}
                  onDuplicate={startDuplicate}
                  onNew={startNew}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* iPad / desktop side panel */}
          <aside className="hidden lg:block">
            <div className="sticky top-[120px] space-y-3">
              <PlaybookFilters
                search={search}
                setSearch={setSearch}
                activeTags={activeTags}
                toggleTag={toggleTag}
                favOnly={favOnly}
                setFavOnly={setFavOnly}
              />
              <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-2">
                <PlaybookList
                  plays={filtered}
                  currentId={current.id}
                  customs={customs}
                  setCustoms={setCustoms}
                  favorites={favorites}
                  onSelect={setSelectedId}
                  onEdit={startEdit}
                  onDuplicate={startDuplicate}
                  onNew={startNew}
                />
              </div>
            </div>
          </aside>
        </main>
      )}

      <HuddleView
        open={huddleOpen}
        plays={filtered}
        index={Math.max(0, idx)}
        assignment={assignment}
        players={players}
        isFavorite={(id) => favorites.has(id)}
        onToggleFavorite={(id) => favorites.toggle(id)}
        onIndex={(i) => setSelectedId(filtered[i].id)}
        onClose={() => setHuddleOpen(false)}
      />
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg p-3 border border-border">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
        {label}
      </div>
      <div className="text-sm mt-1 text-foreground">{children}</div>
    </div>
  );
}

function PlaybookFilters({
  search,
  setSearch,
  activeTags,
  toggleTag,
  favOnly,
  setFavOnly,
}: {
  search: string;
  setSearch: (s: string) => void;
  activeTags: Set<PlayTag>;
  toggleTag: (t: PlayTag) => void;
  favOnly: boolean;
  setFavOnly: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plays"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFavOnly(!favOnly)}
          className={`text-[11px] px-2 py-1 rounded-full font-display tracking-wide flex items-center gap-1 ${
            favOnly ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          <Star className={`h-3 w-3 ${favOnly ? "fill-primary-foreground" : ""}`} /> GAME DAY
        </button>
        {ALL_TAGS.map((t) => (
          <button
            key={t}
            onClick={() => toggleTag(t)}
            className={`text-[11px] px-2 py-1 rounded-full font-display tracking-wide ${
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
  );
}

function PlaybookList({
  plays,
  currentId,
  customs,
  setCustoms,
  favorites,
  onSelect,
  onEdit,
  onDuplicate,
  onNew,
}: {
  plays: Play[];
  currentId: string;
  customs: Play[];
  setCustoms: (p: Play[]) => void;
  favorites: ReturnType<typeof useFavorites>;
  onSelect: (id: string) => void;
  onEdit: (p: Play) => void;
  onDuplicate: (p: Play) => void;
  onNew: () => void;
}) {
  const remove = (id: string) => {
    const next = customs.filter((c) => c.id !== id);
    setCustoms(next);
    saveCustomPlays(next);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {plays.length} plays · {plays.filter((p) => p.custom).length} custom ·{" "}
          {plays.filter((p) => favorites.has(p.id)).length} starred
        </p>
        <Button size="sm" variant="ghost" onClick={onNew}>
          <Plus className="h-3 w-3 mr-1" /> New
        </Button>
      </div>
      {plays.map((p) => (
        <div
          key={p.id}
          className={`flex items-center gap-1 p-2 rounded-lg border transition ${
            p.id === currentId ? "border-primary bg-primary/10" : "border-border bg-secondary"
          }`}
        >
          <button
            onClick={() => favorites.toggle(p.id)}
            className="p-1.5"
            aria-label="Toggle favorite"
          >
            <Star
              className={`h-4 w-4 ${favorites.has(p.id) ? "fill-primary text-primary" : "text-muted-foreground"}`}
            />
          </button>
          <button onClick={() => onSelect(p.id)} className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-display text-base leading-none truncate">{p.name}</div>
              {p.playType === "run" && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-accent/40 text-accent-foreground font-display">
                  RUN
                </span>
              )}
              {p.custom && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-accent text-accent-foreground font-display">
                  CUSTOM
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {p.formation}
              {p.purpose ? " · " + p.purpose : ""}
            </div>
          </button>
          {p.custom ? (
            <>
              <Button size="icon" variant="ghost" onClick={() => onEdit(p)} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(p.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDuplicate(p)}
              aria-label="Duplicate to edit"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
