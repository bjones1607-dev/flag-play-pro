import { useEffect, useRef, useState } from "react";
import type { Play, Player, PlayerAssignment } from "@/lib/types";
import { FootballField } from "./FootballField";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Star, Play as PlayIcon, RotateCw, ThumbsUp, ThumbsDown } from "lucide-react";
import { pushRecentCall, tagLastCall } from "@/lib/storage";
import { toast } from "sonner";

interface Props {
  open: boolean;
  plays: Play[];
  index: number;
  assignment: PlayerAssignment;
  players: Player[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onIndex: (i: number) => void;
  onClose: () => void;
}

export function HuddleView({
  open,
  plays,
  index,
  assignment,
  players,
  isFavorite,
  onToggleFavorite,
  onIndex,
  onClose,
}: Props) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [animOn, setAnimOn] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndex((index - 1 + plays.length) % plays.length);
      if (e.key === "ArrowRight") onIndex((index + 1) % plays.length);
      if (e.key === " ") { e.preventDefault(); setAnimKey((k) => k + 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, plays.length, onClose, onIndex]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Replay animation when play changes
  useEffect(() => { setAnimKey((k) => k + 1); }, [index, open]);

  if (!open || plays.length === 0) return null;
  const play = plays[index];
  if (!play) return null;

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart == null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(dx) > 50) {
      if (dx < 0) onIndex((index + 1) % plays.length);
      else onIndex((index - 1 + plays.length) % plays.length);
    }
    setTouchStart(null);
  };

  const callIt = () => {
    pushRecentCall({ id: play.id, name: play.name });
    toast.success(`Called: ${play.name}`);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-background flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close huddle">
          <X className="h-6 w-6" />
        </Button>
        <div className="text-center flex-1 min-w-0 px-2">
          <div className="font-display text-3xl text-primary leading-none truncate">
            {play.name.toUpperCase()}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5 truncate">
            {play.formation} · {play.defense.toUpperCase()} · {index + 1}/{plays.length}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleFavorite(play.id)}
          aria-label={isFavorite(play.id) ? "Unstar" : "Star"}
        >
          <Star className={`h-6 w-6 ${isFavorite(play.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </Button>
      </div>

      {/* Field */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-2">
        <div className="w-full max-w-[640px] max-h-full">
          <FootballField
            play={play}
            assignment={assignment}
            players={players}
            big
            animate={animOn}
            animateKey={animKey}
          />
        </div>
      </div>

      {/* Animation controls */}
      <div className="px-3 flex items-center justify-center gap-2 -mt-1">
        <Button size="sm" variant="secondary" onClick={() => { setAnimOn(true); setAnimKey((k) => k + 1); }}>
          <PlayIcon className="h-4 w-4 mr-1.5" /> Play Routes
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setAnimKey((k) => k + 1)}>
          <RotateCw className="h-4 w-4 mr-1.5" /> Replay
        </Button>
      </div>

      {/* Bottom: key read + nav */}
      <div className="px-3 pt-2 pb-3 border-t border-border space-y-2 mt-2">
        {play.keyRead && (
          <div className="bg-card rounded-lg p-2.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-display">Key Read</div>
            <div className="text-sm leading-snug">{play.keyRead}</div>
          </div>
        )}
        {play.notes && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-2.5">
            <div className="text-[9px] uppercase tracking-widest text-accent font-display">Coaching Note</div>
            <div className="text-sm leading-snug">{play.notes}</div>
          </div>
        )}

        {/* Call & result */}
        <div className="grid grid-cols-3 gap-2">
          <Button size="lg" className="h-12 col-span-1" onClick={callIt}>
            <span className="font-display text-base">CALL IT</span>
          </Button>
          <Button size="lg" variant="secondary" className="h-12" onClick={() => { tagLastCall("good"); toast.success("Marked good"); }}>
            <ThumbsUp className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="secondary" className="h-12" onClick={() => { tagLastCall("bad"); toast("Marked bad"); }}>
            <ThumbsDown className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="lg" className="flex-1 h-14"
            onClick={() => onIndex((index - 1 + plays.length) % plays.length)}>
            <ChevronLeft className="h-6 w-6 mr-1" />
            <span className="font-display text-lg">PREV</span>
          </Button>
          <Button size="lg" className="flex-1 h-14"
            onClick={() => onIndex((index + 1) % plays.length)}>
            <span className="font-display text-lg">NEXT</span>
            <ChevronRight className="h-6 w-6 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
