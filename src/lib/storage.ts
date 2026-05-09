import type { Play, Player, PlayerAssignment } from "./types";

const PLAYERS_KEY = "ff_players_v1";
const CUSTOM_PLAYS_KEY = "ff_custom_plays_v1";
const ASSIGN_KEY = "ff_assignment_v1";
const FAVORITES_KEY = "ff_favorites_v1";

const ROSTER_EVENT = "ff:roster-changed";
const ASSIGN_EVENT = "ff:assignment-changed";
const PLAYS_EVENT = "ff:plays-changed";
const FAV_EVENT = "ff:favorites-changed";

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

export const EVENTS = {
  ROSTER: ROSTER_EVENT,
  ASSIGN: ASSIGN_EVENT,
  PLAYS: PLAYS_EVENT,
  FAV: FAV_EVENT,
};
