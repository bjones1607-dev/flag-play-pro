import type { Play, PlayTag } from "./types";
import type { CallLogEntry, Situation } from "./storage";
import { maxDown, yardsToGo } from "./storage";

// Anticipatory play suggestions: read the drive (down, distance, downs left)
// plus what's actually gaining today, and surface the 3-4 best calls.

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

interface Bucket {
  want: PlayTag[];
  headline: string;
  detail: string;
  allowTricks: boolean;
}

const ORDINALS = ["", "1st", "2nd", "3rd", "4th"];

function bucketFor(s: Situation): Bucket {
  const need = yardsToGo(s);
  const downsLeft = maxDown(s) - s.down + 1;
  const lastDown = downsLeft <= 1;
  const objective = s.series === "to-mid" ? "midfield" : "the end zone";
  const downLabel = `${ORDINALS[s.down]} down · ${need} to ${objective}`;

  if (s.series === "to-score" && s.yardLine >= 42) {
    return {
      want: ["goalline", "redzone", "short", "run"],
      headline: "GOAL LINE — PUNCH IT IN",
      detail: `${downLabel}. Quick ball, no dancing.`,
      allowTricks: false,
    };
  }
  if (lastDown && need >= 10) {
    return {
      want: ["third-long", "deep", "trick"],
      headline: `LAST DOWN — NEED ${need}`,
      detail: `${downLabel}. Gotta have a chunk; tricks are on the table.`,
      allowTricks: true,
    };
  }
  if (lastDown) {
    return {
      want: ["short", "run", "screen"],
      headline: `LAST DOWN — NEED ${need}`,
      detail: `${downLabel}. Take the sure thing past the line.`,
      allowTricks: false,
    };
  }
  if (need <= 5) {
    return {
      want: ["short", "run", "screen"],
      headline: `${need} TO GO — CLOSE IT OUT`,
      detail: `${downLabel}. One easy completion moves the chains.`,
      allowTricks: false,
    };
  }
  if (need >= 15 && downsLeft <= 2) {
    return {
      want: ["deep", "third-long"],
      headline: "NEED A CHUNK",
      detail: `${downLabel} with ${downsLeft} downs left. Attack the seams.`,
      allowTricks: false,
    };
  }
  if (s.series === "to-score" && s.yardLine >= 30) {
    return {
      want: ["redzone", "short", "deep"],
      headline: "RED ZONE",
      detail: `${downLabel}. Sandwiches and rainbows score here.`,
      allowTricks: false,
    };
  }
  return {
    want: ["short", "screen", "run"],
    headline: `${ORDINALS[s.down]} & ${need}`,
    detail: `${downLabel}. Take what they give — the sticks come to you.`,
    allowTricks: false,
  };
}

export function suggestPlays(
  plays: Play[],
  situation: Situation,
  opts: {
    stats: Record<string, PlayLiveStats>;
    isStarred: (id: string) => boolean;
    recentIds: string[]; // most recent first
    count?: number;
    // "Fresh plays" support: skip these ids so a re-deal surfaces new options.
    excludeIds?: Set<string>;
  },
): SuggestResult {
  const bucket = bucketFor(situation);
  const count = opts.count ?? 4;
  const lastTwo = opts.recentIds.slice(0, 2);
  const pool =
    opts.excludeIds && opts.excludeIds.size > 0
      ? plays.filter((p) => !opts.excludeIds!.has(p.id))
      : plays;

  const scored = pool.map((play) => {
    const tags = new Set(play.tags ?? []);
    let score = 0;
    const reasons: string[] = [];

    let tagHits = 0;
    for (const t of bucket.want) if (tags.has(t)) tagHits++;
    score += Math.min(tagHits, 2) * 3;
    if (tagHits > 0) reasons.push("fits the situation");

    // Tricks never outrank a solid call — they just stop being penalized
    // when the situation is desperate.
    if (tags.has("trick")) {
      score += bucket.allowTricks ? -1 : -4;
    }

    if (opts.isStarred(play.id)) {
      score += 2;
      reasons.push("starred");
    }

    const st = opts.stats[play.id];
    if (st && st.samples > 0) {
      const avg = st.yards / st.samples;
      score += Math.max(-2, Math.min(3, avg * 0.4));
      if (avg >= 5) reasons.push(`avg +${avg.toFixed(0)} today`);
      else if (avg <= 0 && st.samples >= 2) {
        // Proven cold today — sink it below fresh options.
        score -= 4;
        reasons.push("cold today");
      }
    }
    if (st && st.good + st.bad > 0 && st.good > st.bad) score += 1;

    // Don't suggest what we just ran (defense has seen it twice in a row).
    if (lastTwo.includes(play.id)) score -= 5;

    return { play, score, reason: reasons.slice(0, 2).join(" · ") || "solid option" };
  });

  scored.sort((a, b) => b.score - a.score);
  return {
    headline: bucket.headline,
    detail: bucket.detail,
    suggestions: scored.slice(0, count).map(({ play, reason }) => ({ play, reason })),
  };
}
