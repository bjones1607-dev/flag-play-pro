import type { GameState, Play, PlayCall } from "./types";

export interface Suggestion {
  play: Play;
  score: number;
  reasons: string[];
}

// Rule-based play suggester — given the game state and recent calls,
// rank plays from a candidate pool and return the top 3 with reasons.
export function suggestPlays(
  candidates: Play[],
  game: GameState,
  history: PlayCall[],
  defense: "zone" | "man",
): Suggestion[] {
  const recentIds = new Set(history.slice(0, 4).map((h) => h.id));
  const sameDefense = candidates.filter((p) => p.defense === defense);
  const pool = sameDefense.length >= 6 ? sameDefense : candidates;

  const inNoRunZone = game.noRunZone;
  const isShortYardage = game.yardsToFirst <= 3;
  const isLong = game.yardsToFirst >= 8;
  const isThird = game.down === 3;
  const isFourth = game.down === 4;
  const isRedZone = game.ballOn >= 80;
  const isGoalLine = game.ballOn >= 95;

  const scored: Suggestion[] = pool.map((p) => {
    const tags = new Set(p.tags ?? []);
    const reasons: string[] = [];
    let score = 0;

    if (recentIds.has(p.id)) score -= 25; // discourage same-play repeat

    if (p.defense === defense) score += 5;

    // Goal line / red zone
    if (isGoalLine) {
      if (tags.has("goalline")) {
        score += 30;
        reasons.push("Built for the goal line");
      }
    } else if (isRedZone) {
      if (tags.has("redzone") || tags.has("goalline")) {
        score += 18;
        reasons.push("Red-zone concept");
      }
    }

    // No-run zone — running plays disqualified
    if (inNoRunZone && (p.playType === "run" || tags.has("run"))) {
      score -= 100;
      reasons.push("⚠ No-run zone");
    }

    // Down + distance
    if (isShortYardage) {
      if (p.playType === "run" && !inNoRunZone) {
        score += 22;
        reasons.push("Short yardage = run");
      }
      if (tags.has("short") && !p.playType) {
        score += 14;
        reasons.push("Short pass concept");
      }
    }

    if (isLong) {
      if (tags.has("deep")) {
        score += 18;
        reasons.push("Long yardage = deep shot");
      }
      if (tags.has("third-long") && (isThird || isFourth)) {
        score += 22;
        reasons.push("3rd & long built-in");
      }
    }

    if (isThird || isFourth) {
      if (tags.has("third-long")) {
        score += 14;
      }
      if (p.playType === "run" && isLong) {
        score -= 15;
      }
    }

    // Center plays are great vs aggressive man defense
    if (defense === "man" && tags.has("center")) {
      score += 12;
      reasons.push("Center exploits man");
    }

    // Trick plays — bonus on 3rd down or red zone
    if (tags.has("trick") && (isThird || isRedZone)) {
      score += 8;
      reasons.push("Element of surprise");
    }

    // Slight bonus for screen on long downs
    if (tags.has("screen") && isLong) {
      score += 6;
    }

    // Mild penalty for plays already shown recently
    if (history.some((h) => h.id === p.id)) {
      score -= 5;
    }

    // Default reason for high baseline plays
    if (reasons.length === 0 && score > 0) {
      reasons.push("Sound base concept");
    }

    return { play: p, score, reasons };
  });

  return scored
    .filter((s) => s.score > -50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
