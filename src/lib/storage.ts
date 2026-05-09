import type {
  GameState,
  Play,
  PlayCall,
  Player,
  PlayerAssignment,
  PracticePlan,
  Team,
} from "./types";

// ===== Team registry =====
const TEAMS_KEY = "ff_teams_v1";
const ACTIVE_TEAM_KEY = "ff_active_team_v1";
const DEFAULT_TEAM_ID = "default";

// ===== Per-team key suffixes =====
const PLAYERS_KEY = "ff_players_v1";
const CUSTOM_PLAYS_KEY = "ff_custom_plays_v1";
const ASSIGN_KEY = "ff_assignment_v1";
const FAVORITES_KEY = "ff_favorites_v1";
const GAME_KEY = "ff_game_v1";
const PRACTICES_KEY = "ff_practices_v1";

// ===== Events =====
const ROSTER_EVENT = "ff:roster-changed";
const ASSIGN_EVENT = "ff:assignment-changed";
const PLAYS_EVENT = "ff:plays-changed";
const FAV_EVENT = "ff:favorites-changed";
const GAME_EVENT = "ff:game-changed";
const PRACTICE_EVENT = "ff:practices-changed";
const TEAMS_EVENT = "ff:teams-changed";
const ACTIVE_TEAM_EVENT = "ff:active-team-changed";

const emit = (name: string) => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(name));
};

const isBrowser = () => typeof window !== "undefined";

// ===== Team helpers =====
export const loadTeams = (): Team[] => {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(TEAMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveTeams = (teams: Team[]) => {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  emit(TEAMS_EVENT);
};

export const getActiveTeamId = (): string => {
  if (!isBrowser()) return DEFAULT_TEAM_ID;
  return localStorage.getItem(ACTIVE_TEAM_KEY) || DEFAULT_TEAM_ID;
};

export const setActiveTeamId = (id: string) => {
  localStorage.setItem(ACTIVE_TEAM_KEY, id);
  emit(ACTIVE_TEAM_EVENT);
};

// ===== Migration: ensure at least one team exists, migrate legacy keys =====
export const ensureDefaultTeam = (): void => {
  if (!isBrowser()) return;
  const teams = loadTeams();
  if (teams.length === 0) {
    const t: Team = {
      id: DEFAULT_TEAM_ID,
      name: "My Team",
      createdAt: Date.now(),
    };
    saveTeams([t]);
    setActiveTeamId(DEFAULT_TEAM_ID);

    // Migrate any legacy unscoped keys → default-scoped
    const legacyKeys = [
      PLAYERS_KEY,
      CUSTOM_PLAYS_KEY,
      ASSIGN_KEY,
      FAVORITES_KEY,
      GAME_KEY,
      PRACTICES_KEY,
    ];
    for (const k of legacyKeys) {
      const v = localStorage.getItem(k);
      if (v && !localStorage.getItem(scoped(k, DEFAULT_TEAM_ID))) {
        localStorage.setItem(scoped(k, DEFAULT_TEAM_ID), v);
      }
    }
  }
};

const scoped = (base: string, teamId?: string) => `${base}__${teamId ?? getActiveTeamId()}`;

// ===== Players =====
export const loadPlayers = (): Player[] => {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(scoped(PLAYERS_KEY)) || "[]");
  } catch {
    return [];
  }
};
export const savePlayers = (p: Player[]) => {
  localStorage.setItem(scoped(PLAYERS_KEY), JSON.stringify(p));
  emit(ROSTER_EVENT);
};

// ===== Custom plays =====
export const loadCustomPlays = (): Play[] => {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(scoped(CUSTOM_PLAYS_KEY)) || "[]");
  } catch {
    return [];
  }
};
export const saveCustomPlays = (p: Play[]) => {
  localStorage.setItem(scoped(CUSTOM_PLAYS_KEY), JSON.stringify(p));
  emit(PLAYS_EVENT);
};

// ===== Assignment =====
export const loadAssignment = (): PlayerAssignment => {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(localStorage.getItem(scoped(ASSIGN_KEY)) || "{}");
  } catch {
    return {};
  }
};
export const saveAssignment = (a: PlayerAssignment) => {
  localStorage.setItem(scoped(ASSIGN_KEY), JSON.stringify(a));
  emit(ASSIGN_EVENT);
};

// ===== Favorites =====
export const loadFavorites = (): string[] => {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(scoped(FAVORITES_KEY)) || "[]");
  } catch {
    return [];
  }
};
export const saveFavorites = (ids: string[]) => {
  localStorage.setItem(scoped(FAVORITES_KEY), JSON.stringify(ids));
  emit(FAV_EVENT);
};

// ===== Game state =====
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
  if (!isBrowser()) return DEFAULT_GAME;
  try {
    const raw = localStorage.getItem(scoped(GAME_KEY));
    if (!raw) return DEFAULT_GAME;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_GAME, ...parsed };
  } catch {
    return DEFAULT_GAME;
  }
};
export const saveGame = (g: GameState) => {
  localStorage.setItem(scoped(GAME_KEY), JSON.stringify(g));
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

// ===== Practice plans =====
export const loadPractices = (): PracticePlan[] => {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(scoped(PRACTICES_KEY)) || "[]");
  } catch {
    return [];
  }
};
export const savePractices = (p: PracticePlan[]) => {
  localStorage.setItem(scoped(PRACTICES_KEY), JSON.stringify(p));
  emit(PRACTICE_EVENT);
};

// ===== Delete a team and its data =====
export const deleteTeam = (id: string) => {
  for (const k of [
    PLAYERS_KEY,
    CUSTOM_PLAYS_KEY,
    ASSIGN_KEY,
    FAVORITES_KEY,
    GAME_KEY,
    PRACTICES_KEY,
  ]) {
    localStorage.removeItem(`${k}__${id}`);
  }
  saveTeams(loadTeams().filter((t) => t.id !== id));
};

export const EVENTS = {
  ROSTER: ROSTER_EVENT,
  ASSIGN: ASSIGN_EVENT,
  PLAYS: PLAYS_EVENT,
  FAV: FAV_EVENT,
  GAME: GAME_EVENT,
  PRACTICE: PRACTICE_EVENT,
  TEAMS: TEAMS_EVENT,
  ACTIVE_TEAM: ACTIVE_TEAM_EVENT,
};
