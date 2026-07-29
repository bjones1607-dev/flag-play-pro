import { toast } from "sonner";
import {
  addSnapToDrive,
  closeDrive,
  loadSituation,
  maxDown,
  saveSituation,
  setYardsOnLastCall,
  tagLastCall,
  yardsToGo,
  type Situation,
} from "./storage";

// One tap per snap, callable from anywhere (sideline, huddle, home bar):
// record yards on the last call, move the ball, then advance the down,
// award the first down at midfield, or turn it over.

export const ORDINALS = ["", "1st", "2nd", "3rd", "4th"];

export function situationLabel(s: Situation): string {
  const need = yardsToGo(s);
  const objective = s.series === "to-mid" ? "midfield" : "score";
  return `${ORDINALS[s.down]} & ${need} to ${objective} · ball on ${s.yardLine}`;
}

export function recordYardsResult(yards: number, opts?: { isRun?: boolean }): Situation {
  setYardsOnLastCall(yards);
  // Auto-tag for stats: gained = good, stopped = bad. No extra tap.
  tagLastCall(yards > 0 ? "good" : "bad");
  addSnapToDrive(yards, !!opts?.isRun);
  const s = loadSituation();
  const newYard = Math.max(1, Math.min(49, s.yardLine + yards));
  let next: Situation;
  if (s.series === "to-mid" && newYard >= 25) {
    next = { ...s, series: "to-score", down: 1, yardLine: newYard };
    toast.success("FIRST DOWN — 4 downs to score!");
  } else {
    const md = maxDown(s);
    const n = s.down + 1;
    if (n > md) {
      next = { ...s, series: "to-mid", down: 1, yardLine: 5 };
      closeDrive("DOWNS");
      toast("Turnover on downs — their ball");
    } else {
      next = { ...s, down: n as Situation["down"], yardLine: newYard };
      toast(`${yards > 0 ? "+" : ""}${yards} yds · ${ORDINALS[n]} down`);
    }
  }
  saveSituation(next);
  return next;
}

export function recordTouchdownResult(opts?: { isRun?: boolean }): Situation {
  const s = loadSituation();
  setYardsOnLastCall(50 - s.yardLine);
  tagLastCall("good");
  addSnapToDrive(50 - s.yardLine, !!opts?.isRun);
  closeDrive("TD");
  toast.success("TOUCHDOWN — +6");
  const next: Situation = {
    ...s,
    ourScore: s.ourScore + 6,
    series: "to-mid",
    down: 1,
    yardLine: 5,
  };
  saveSituation(next);
  return next;
}

export const YARD_CHIPS = [-3, 0, 3, 5, 8, 12, 20];
