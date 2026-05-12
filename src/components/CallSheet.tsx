import { useMemo, useState } from "react";
import type { Play } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { ClipboardList, Printer, Trash2, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { useFavorites, useRecentCalls } from "@/hooks/use-storage";
import { pushRecentCall, saveRecentCalls, tagLastCall } from "@/lib/storage";
import { toast } from "sonner";

interface Props {
  plays: Play[];
  onSelect: (id: string) => void;
  onShowHuddle: () => void;
}

export function CallSheet({ plays, onSelect, onShowHuddle }: Props) {
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
      <SheetContent side="right" className="w-[95vw] sm:w-[520px] overflow-y-auto">
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
            Numbered call sheet for game day. Tap a play to call it and open the huddle view.
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
                onClick={() => { saveRecentCalls([]); toast("Cleared"); }}
                className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-2">No calls yet — tap a play to call it.</div>
          ) : (
            <div className="space-y-1">
              {recent.slice(0, 6).map((r, i) => (
                <div key={r.at}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm border ${
                    r.result === "good" ? "border-primary/40 bg-primary/5" :
                    r.result === "bad" ? "border-destructive/40 bg-destructive/5" :
                    "border-border bg-secondary/40"}`}>
                  <span className="text-[10px] text-muted-foreground w-6 font-display">#{recent.length - i}</span>
                  <span className="flex-1 truncate font-display tracking-wide">{r.name}</span>
                  {i === 0 && (
                    <>
                      <button onClick={() => { tagLastCall("good"); toast.success("Marked good"); }}
                        className="p-1 rounded hover:bg-primary/20" aria-label="Good">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { tagLastCall("bad"); toast("Marked bad"); }}
                        className="p-1 rounded hover:bg-destructive/20" aria-label="Bad">
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

        {/* Numbered call list — wristband style */}
        <div className="mt-5 space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display no-print">
            Tap a number to call · star plays for game day
          </div>
          {ordered.map(([group, list]) => (
            <div key={group}>
              <div className="text-[11px] font-display tracking-widest text-primary border-b border-border pb-1 mb-2">
                {group.toUpperCase()}
              </div>
              <div className="space-y-1.5">
                {list.map((p) => {
                  const num = flat.findIndex((x) => x.id === p.id) + 1;
                  return (
                    <button
                      key={p.id}
                      onClick={() => call(p)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-secondary/60 hover:bg-secondary border border-border text-left active:scale-[0.98] transition"
                    >
                      <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground font-display text-xl flex items-center justify-center shrink-0">
                        {num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-base leading-tight truncate flex items-center gap-1.5">
                          {favorites.has(p.id) && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                          {p.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {p.keyRead || p.purpose}
                        </div>
                      </div>
                      {p.tags && p.tags.length > 0 && (
                        <div className="hidden sm:flex gap-1">
                          {p.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-background/60 font-display tracking-wide">
                              {t.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
