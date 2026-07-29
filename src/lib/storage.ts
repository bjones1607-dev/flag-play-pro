import type { Play, Player, PlayerAssignment } from "./types";

const PLAYERS_KEY = "ff_players_v1";
const CUSTOM_PLAYS_KEY = "ff_custom_plays_v1";
const ASSIGN_KEY = "ff_assignment_v1";
const FAVORITES_KEY = "ff_favorites_v1";
const RECENT_KEY = "ff_recent_calls_v1";

const ROSTER_EVENT = "ff:roster-changed";
const ASSIGN_EVENT = "ff:assignment-changed";
const PLAYS_EVENT = "ff:plays-changed";
const FAV_EVENT = "ff:favorites-changed";
const RECENT_EVENT = "ff:recent-changed";

const emit = (name: string) => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(name));
};

export const loadPlayers = (): Player[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PLAYERS_KEY) || "[]");
  } catch {
    return [];
  }
};
export const savePlayers = (p: Player[]) => {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(p));
  emit(ROSTER_EVENT);
};

export const loadCustomPlays = (): Play[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_PLAYS_KEY) || "[]");
  } catch {
    return [];
  }
};
export const saveCustomPlays = (p: Play[]) => {
  localStorage.setItem(CUSTOM_PLAYS_KEY, JSON.stringify(p));
  emit(PLAYS_EVENT);
};

export const loadAssignment = (): PlayerAssignment => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ASSIGN_KEY) || "{}");
  } catch {
    return {};
  }
};
export const saveAssignment = (a: PlayerAssignment) => {
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(a));
  // Manual edits detach from the saved lineup they came from.
  localStorage.removeItem(ACTIVE_LINEUP_KEY);
  emit(LINEUP_EVENT);
  emit(ASSIGN_EVENT);
};

// ===== Lineups: named assignment sets (e.g. "Wave A" / "Wave B") =====
// The active assignment (ASSIGN_KEY) stays the single source of truth that
// every diagram reads; a lineup is a saved snapshot you can re-apply in one tap.
export interface Lineup {
  id: string;
  name: string;
  assignment: PlayerAssignment;
}
const LINEUPS_KEY = "ff_lineups_v1";
const ACTIVE_LINEUP_KEY = "ff_active_lineup_v1";
const LINEUP_EVENT = "ff:lineups-changed";

export const loadLineups = (): Lineup[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LINEUPS_KEY) || "[]");
  } catch {
    return [];
  }
};
export const saveLineups = (l: Lineup[]) => {
  localStorage.setItem(LINEUPS_KEY, JSON.stringify(l));
  emit(LINEUP_EVENT);
};
export const loadActiveLineupId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_LINEUP_KEY);
};
export const saveCurrentAsLineup = (name: string): Lineup => {
  const lineup: Lineup = {
    id: `lineup-${Date.now()}`,
    name,
    assignment: loadAssignment(),
  };
  saveLineups([...loadLineups(), lineup]);
  localStorage.setItem(ACTIVE_LINEUP_KEY, lineup.id);
  emit(LINEUP_EVENT);
  return lineup;
};
export const applyLineup = (id: string) => {
  const lineup = loadLineups().find((l) => l.id === id);
  if (!lineup) return;
  saveAssignment({ ...lineup.assignment });
  localStorage.setItem(ACTIVE_LINEUP_KEY, id);
  emit(LINEUP_EVENT);
};
export const updateLineupFromCurrent = (id: string) => {
  const next = loadLineups().map((l) => (l.id === id ? { ...l, assignment: loadAssignment() } : l));
  saveLineups(next);
  localStorage.setItem(ACTIVE_LINEUP_KEY, id);
  emit(LINEUP_EVENT);
};
export const deleteLineup = (id: string) => {
  saveLineups(loadLineups().filter((l) => l.id !== id));
  if (loadActiveLineupId() === id) localStorage.removeItem(ACTIVE_LINEUP_KEY);
  emit(LINEUP_EVENT);
};

export const loadFavorites = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
};
export const saveFavorites = (ids: string[]) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  emit(FAV_EVENT);
};

export interface RecentCall {
  id: string;
  name: string;
  at: number;
  result?: "good" | "bad";
}
export const loadRecentCalls = (): RecentCall[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
};
export const saveRecentCalls = (r: RecentCall[]) => {
  localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 25)));
  emit(RECENT_EVENT);
};
export const pushRecentCall = (play: { id: string; name: string }) => {
  const list = loadRecentCalls();
  const now = Date.now();
  // De-dupe: if same play was just called within 10s, refresh timestamp instead of stacking.
  if (list[0] && list[0].id === play.id && now - list[0].at < 10_000) {
    list[0] = { ...list[0], at: now };
    saveRecentCalls(list);
    return;
  }
  saveRecentCalls([{ id: play.id, name: play.name, at: now }, ...list]);
};

// ===== Game-day situation =====
// League rules: 50-yard field. 3 downs to reach midfield (yardLine 25) for a
// first down, then 4 downs to score (yardLine 50 = opponent goal line).
export interface Situation {
  down: 1 | 2 | 3 | 4;
  series: "to-mid" | "to-score"; // current series objective
  ourScore: number;
  oppScore: number;
  period: 1 | 2 | 3 | 4;
  yardLine: number; // 1-49 (0=own goal, 25=midfield, 50=opp goal)
  // legacy, kept for back-compat with old saves
  dist?: number;
}
const SITUATION_KEY = "ff_situation_v2";
const SITUATION_EVENT = "ff:situation-changed";
export const DEFAULT_SITUATION: Situation = {
  down: 1,
  series: "to-mid",
  ourScore: 0,
  oppScore: 0,
  period: 1,
  yardLine: 5,
};
export const yardsToGo = (s: Situation): number =>
  s.series === "to-mid" ? Math.max(0, 25 - s.yardLine) : Math.max(0, 50 - s.yardLine);
export const maxDown = (s: Situation): 3 | 4 => (s.series === "to-mid" ? 3 : 4);
export const loadSituation = (): Situation => {
  if (typeof window === "undefined") return DEFAULT_SITUATION;
  try {
    const raw = localStorage.getItem(SITUATION_KEY);
    return raw ? { ...DEFAULT_SITUATION, ...JSON.parse(raw) } : DEFAULT_SITUATION;
  } catch {
    return DEFAULT_SITUATION;
  }
};
export const saveSituation = (s: Situation) => {
  localStorage.setItem(SITUATION_KEY, JSON.stringify(s));
  emit(SITUATION_EVENT);
};
export const tagLastCall = (result: "good" | "bad") => {
  const list = loadRecentCalls();
  if (!list[0]) return;
  list[0] = { ...list[0], result };
  saveRecentCalls(list);
};

export const EVENTS = {
  ROSTER: ROSTER_EVENT,
  ASSIGN: ASSIGN_EVENT,
  PLAYS: PLAYS_EVENT,
  FAV: FAV_EVENT,
  RECENT: RECENT_EVENT,
  SITUATION: "ff:situation-changed",
  LINEUPS: LINEUP_EVENT,
};
