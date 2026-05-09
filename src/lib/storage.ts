import type { GameState, Play, PlayCall, Player, PlayerAssignment, PracticePlan } from "./types";

const PLAYERS_KEY = "ff_players_v1";
const CUSTOM_PLAYS_KEY = "ff_custom_plays_v1";
const ASSIGN_KEY = "ff_assignment_v1";
const FAVORITES_KEY = "ff_favorites_v1";
const GAME_KEY = "ff_game_v1";
const PRACTICES_KEY = "ff_practices_v1";

const ROSTER_EVENT = "ff:roster-changed";
const ASSIGN_EVENT = "ff:assignment-changed";
const PLAYS_EVENT = "ff:plays-changed";
const FAV_EVENT = "ff:favorites-changed";
const GAME_EVENT = "ff:game-changed";
const PRACTICE_EVENT = "ff:practices-changed";

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
  emit(ASSIGN_EVENT);
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

const DEFAULT_GAME: GameState = {
  homeName: "US",
  awayName: "OPP",
  homeScore: 0,
  awayScore: 0,
  down: 1,
  yardsToFirst: 20,
  ballOn: 50,
  noRunZone: false,
  history: [],
};

export const loadGame = (): GameState => {
  if (typeof window === "undefined") return DEFAULT_GAME;
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return DEFAULT_GAME;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_GAME, ...parsed };
  } catch {
    return DEFAULT_GAME;
  }
};
export const saveGame = (g: GameState) => {
  localStorage.setItem(GAME_KEY, JSON.stringify(g));
  emit(GAME_EVENT);
};

export const recordPlayCall = (call: PlayCall) => {
  const g = loadGame();
  const next: GameState = {
    ...g,
    history: [call, ...g.history].slice(0, 12),
  };
  saveGame(next);
};

export const loadPractices = (): PracticePlan[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PRACTICES_KEY) || "[]");
  } catch {
    return [];
  }
};
export const savePractices = (p: PracticePlan[]) => {
  localStorage.setItem(PRACTICES_KEY, JSON.stringify(p));
  emit(PRACTICE_EVENT);
};

export const EVENTS = {
  ROSTER: ROSTER_EVENT,
  ASSIGN: ASSIGN_EVENT,
  PLAYS: PLAYS_EVENT,
  FAV: FAV_EVENT,
  GAME: GAME_EVENT,
  PRACTICE: PRACTICE_EVENT,
};
