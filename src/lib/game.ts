import { toast } from "sonner";
import { loadSituation, saveSituation, setYardsOnLastCall, tagLastCall } from "./storage";

// Dead-simple result recording: yards (or incomplete) per snap for stats,
// and a one-tap touchdown that bumps the score. No down/distance tracking.

export function recordYardsResult(yards: number) {
  setYardsOnLastCall(yards);
  // Auto-tag for stats: gained = good, stopped/incomplete = bad.
  tagLastCall(yards > 0 ? "good" : "bad");
  toast(yards === 0 ? "Incomplete recorded" : `${yards > 0 ? "+" : ""}${yards} yds recorded`);
}

export function recordTouchdownResult() {
  tagLastCall("good");
  const s = loadSituation();
  saveSituation({ ...s, ourScore: s.ourScore + 6 });
  toast.success("TOUCHDOWN — +6 US");
}

export function addScore(side: "us" | "them", points: number) {
  const s = loadSituation();
  saveSituation(
    side === "us"
      ? { ...s, ourScore: Math.max(0, s.ourScore + points) }
      : { ...s, oppScore: Math.max(0, s.oppScore + points) },
  );
}

export const YARD_CHIPS = [-3, 3, 5, 8, 12, 20];
