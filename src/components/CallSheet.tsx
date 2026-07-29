import { useMemo, useState } from "react";
import type { Play, Player, PlayerAssignment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { FootballField } from "@/components/FootballField";
import { ClipboardList, Printer, Trash2, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { useFavorites, useRecentCalls } from "@/hooks/use-storage";
import { pushRecentCall, saveRecentCalls, tagLastCall } from "@/lib/storage";
import { toast } from "sonner";

interface Props {
  plays: Play[];
  onSelect: (id: string) => void;
  onShowHuddle: () => void;
  assignment?: PlayerAssignment;
  players?: Player[];
}

export function CallSheet({ plays, onSelect, onShowHuddle, assignment = {}, players = [] }: Props) {
  const [open, setOpen] = useState(false);
  const favorites = useFavorites();
  const recent = useRecentCalls();

  // Order: favorites first, then by formation
  const ordered = useMemo(() => {
    const favs = plays.filter((p) => favorites.has(p.id));
    const rest = plays.filter((p) => !favorites.has(p.id));
    const all = [...favs, ...rest];
    const groups = new Map<string, Play[]>();
    for (const p of all) {
      const key = p.tags?.includes("run") ? "RUN GAME" : p.formation || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return [...groups.entries()];
  }, [plays, favorites]);

  const flat = ordered.flatMap(([, ps]) => ps);

  const call = (p: Play) => {
    pushRecentCall({ id: p.id, name: p.name });
    onSelect(p.id);
    onShowHuddle();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="gap-1.5 px-3" aria-label="Game-day call sheet">
          <ClipboardList className="h-4 w-4" />
          <span className="font-display text-sm hidden sm:inline">CALL SHEET</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[95vw] sm:w-[640px] sm:max-w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center justify-between">
            <span>Game Day Call Sheet</span>
            <button
              onClick={() => window.print()}
              className="text-xs font-sans bg-secondary px-2 py-1 rounded flex items-center gap-1 no-print"
            >
              <Printer className="h-3 w-3" /> Print Wristband
            </button>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Visual call sheet for game day. Scroll the play diagrams and tap one to call it and
            expand it fullscreen for the huddle.
          </SheetDescription>
        </SheetHeader>

        {/* Recent calls */}
        <div className="mt-4 no-print">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
              Just Called
            </div>
            {recent.length > 0 && (
              <button
                onClick={() => {
                  saveRecentCalls([]);
                  toast("Cleared");
                }}
                className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-2">
              No calls yet — tap a play to call it.
            </div>
          ) : (
            <div className="space-y-1">
              {recent.slice(0, 4).map((r, i) => (
                <div
                  key={r.at}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm border ${
                    r.result === "good"
                      ? "border-primary/40 bg-primary/5"
                      : r.result === "bad"
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-border bg-secondary/40"
                  }`}
                >
                  <span className="text-[10px] text-muted-foreground w-6 font-display">
                    #{recent.length - i}
                  </span>
                  <span className="flex-1 truncate font-display tracking-wide">{r.name}</span>
                  {i === 0 && (
                    <>
                      <button
                        onClick={() => {
                          tagLastCall("good");
                          toast.success("Marked good");
                        }}
                        className="p-1 rounded hover:bg-primary/20"
                        aria-label="Good"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          tagLastCall("bad");
                          toast("Marked bad");
                        }}
                        className="p-1 rounded hover:bg-destructive/20"
                        aria-label="Bad"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  {r.result === "good" && <ThumbsUp className="h-3.5 w-3.5 text-primary" />}
                  {r.result === "bad" && <ThumbsDown className="h-3.5 w-3.5 text-destructive" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visual play grid — see the routes, tap to call & expand */}
        <div className="mt-5 space-y-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display no-print">
            Scroll the plays · tap a diagram to call it and show the huddle
          </div>
          <div className="grid grid-cols-2 gap-3">
            {flat.map((p, i) => (
              <button
                key={p.id}
                onClick={() => call(p)}
                className="text-left rounded-lg bg-secondary/60 hover:bg-secondary border border-border overflow-hidden active:scale-[0.98] transition"
                aria-label={`Call ${p.name} and show it fullscreen`}
              >
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground font-display text-base flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm leading-tight truncate flex items-center gap-1">
                      {favorites.has(p.id) && (
                        <Star className="h-3 w-3 fill-primary text-primary shrink-0" />
                      )}
                      {p.name}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">
                      {p.formation}
                    </div>
                  </div>
                </div>
                <div className="px-1.5 pb-1.5">
                  <FootballField play={p} assignment={assignment} players={players} />
                </div>
                <div className="px-2 pb-2 text-[10px] text-muted-foreground leading-snug line-clamp-2">
                  {p.keyRead || p.purpose}
                </div>
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
