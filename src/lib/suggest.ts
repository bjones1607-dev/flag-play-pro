import type { Play } from "./types";
import type { CallLogEntry } from "./storage";

// Simple suggestions: no situation tracking to maintain — rank by what's
// gaining today, the coach's starred plays, and what the defense hasn't
// just seen. Recording results is the only bookkeeping.

export interface PlayLiveStats {
  calls: number;
  yards: number;
  samples: number;
  good: number;
  bad: number;
}

export interface Suggestion {
  play: Play;
  reason: string;
}

export interface SuggestResult {
  headline: string;
  detail: string;
  suggestions: Suggestion[];
}

export function liveStatsFromLog(
  log: CallLogEntry[],
  since: number,
): Record<string, PlayLiveStats> {
  const out: Record<string, PlayLiveStats> = {};
  for (const e of log) {
    if (e.at < since) continue;
    const s = (out[e.playId] ??= { calls: 0, yards: 0, samples: 0, good: 0, bad: 0 });
    s.calls++;
    if (typeof e.yards === "number") {
      s.yards += e.yards;
      s.samples++;
    }
    if (e.result === "good") s.good++;
    if (e.result === "bad") s.bad++;
  }
  return out;
}

export function suggestPlays(
  plays: Play[],
  opts: {
    stats: Record<string, PlayLiveStats>;
    isStarred: (id: string) => boolean;
    recentIds: string[]; // most recent first
    count?: number;
    // "Fresh plays" support: skip these ids so a re-deal surfaces new options.
    excludeIds?: Set<string>;
  },
): SuggestResult {
  const count = opts.count ?? 4;
  const lastTwo = opts.recentIds.slice(0, 2);
  const pool = plays.filter((p) => !opts.excludeIds?.has(p.id));

  const scored = pool.map((play) => {
    const tags = new Set(play.tags ?? []);
    let score = 0;
    const reasons: string[] = [];

    if (opts.isStarred(play.id)) {
      score += 3;
      reasons.push("starred");
    }

    const st = opts.stats[play.id];
    if (st && st.samples > 0) {
      const avg = st.yards / st.samples;
      score += Math.max(-2, Math.min(4, avg * 0.5));
      if (avg >= 5) reasons.push(`avg +${avg.toFixed(0)} today`);
      else if (avg <= 0 && st.samples >= 2) {
        score -= 4;
        reasons.push("cold today");
      }
    }
    if (st && st.good + st.bad > 0 && st.good > st.bad) score += 1;

    // Tricks and the Emergency stuff shouldn't top a default deal.
    if (tags.has("trick")) score -= 2;
    // League allows one run per possession — at most surface runs modestly.
    if (play.playType === "run") score -= 1;

    // Don't suggest what we just ran (defense has seen it).
    if (lastTwo.includes(play.id)) score -= 5;

    return { play, score, reason: reasons.slice(0, 2).join(" · ") || "solid option" };
  });

  scored.sort((a, b) => b.score - a.score);
  return {
    headline: "COACH SAYS",
    detail: "Starred plays + what's gaining today. Record results and this re-ranks itself.",
    suggestions: scored.slice(0, count).map(({ play, reason }) => ({ play, reason })),
  };
}
