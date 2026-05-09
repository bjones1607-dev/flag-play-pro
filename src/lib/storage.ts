import type { Play, Player, PlayerAssignment } from "./types";

const PLAYERS_KEY = "ff_players_v1";
const CUSTOM_PLAYS_KEY = "ff_custom_plays_v1";
const ASSIGN_KEY = "ff_assignment_v1";

export const loadPlayers = (): Player[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(PLAYERS_KEY) || "[]"); } catch { return []; }
};
export const savePlayers = (p: Player[]) => localStorage.setItem(PLAYERS_KEY, JSON.stringify(p));

export const loadCustomPlays = (): Play[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CUSTOM_PLAYS_KEY) || "[]"); } catch { return []; }
};
export const saveCustomPlays = (p: Play[]) => localStorage.setItem(CUSTOM_PLAYS_KEY, JSON.stringify(p));

export const loadAssignment = (): PlayerAssignment => {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ASSIGN_KEY) || "{}"); } catch { return {}; }
};
export const saveAssignment = (a: PlayerAssignment) => localStorage.setItem(ASSIGN_KEY, JSON.stringify(a));
