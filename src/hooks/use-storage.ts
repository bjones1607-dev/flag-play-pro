import { useEffect, useState } from "react";
import {
  EVENTS,
  ensureDefaultTeam,
  getActiveTeamId,
  loadAssignment,
  loadCustomPlays,
  loadFavorites,
  loadGame,
  loadPlayers,
  loadPractices,
  loadTeams,
  saveFavorites,
  saveGame,
  savePractices,
  saveTeams,
  setActiveTeamId,
} from "@/lib/storage";
import type { GameState, Play, Player, PlayerAssignment, PracticePlan, Team } from "@/lib/types";

function subscribe(events: string[], cb: () => void) {
  events.forEach((e) => window.addEventListener(e, cb));
  // also react to other tabs
  window.addEventListener("storage", cb);
  return () => {
    events.forEach((e) => window.removeEventListener(e, cb));
    window.removeEventListener("storage", cb);
  };
}

// All per-team hooks re-load when the active team changes.
const TEAM_RELOAD_EVENTS = [EVENTS.ACTIVE_TEAM];

export function usePlayers(): Player[] {
  const [v, setV] = useState<Player[]>([]);
  useEffect(() => {
    setV(loadPlayers());
    return subscribe([EVENTS.ROSTER, ...TEAM_RELOAD_EVENTS], () => setV(loadPlayers()));
  }, []);
  return v;
}

export function useAssignment(): PlayerAssignment {
  const [v, setV] = useState<PlayerAssignment>({});
  useEffect(() => {
    setV(loadAssignment());
    return subscribe([EVENTS.ASSIGN, ...TEAM_RELOAD_EVENTS], () => setV(loadAssignment()));
  }, []);
  return v;
}

export function useCustomPlays(): [Play[], (next: Play[]) => void] {
  const [v, setV] = useState<Play[]>([]);
  useEffect(() => {
    setV(loadCustomPlays());
    return subscribe([EVENTS.PLAYS, ...TEAM_RELOAD_EVENTS], () => setV(loadCustomPlays()));
  }, []);
  return [v, setV];
}

export function useFavorites(): {
  ids: Set<string>;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
} {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    setIds(new Set(loadFavorites()));
    return subscribe([EVENTS.FAV, ...TEAM_RELOAD_EVENTS], () => setIds(new Set(loadFavorites())));
  }, []);
  const toggle = (id: string) => {
    const next = new Set(ids);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    saveFavorites([...next]);
    setIds(next);
  };
  return { ids, has: (id) => ids.has(id), toggle };
}

export function useGame(): {
  game: GameState;
  set: (next: GameState) => void;
  patch: (p: Partial<GameState>) => void;
} {
  const [game, setGame] = useState<GameState>({
    homeName: "US",
    awayName: "OPP",
    homeScore: 0,
    awayScore: 0,
    down: 1,
    yardsToFirst: 20,
    ballOn: 50,
    noRunZone: false,
    history: [],
  });
  useEffect(() => {
    setGame(loadGame());
    return subscribe([EVENTS.GAME, ...TEAM_RELOAD_EVENTS], () => setGame(loadGame()));
  }, []);
  const set = (next: GameState) => {
    saveGame(next);
    setGame(next);
  };
  const patch = (p: Partial<GameState>) => set({ ...game, ...p });
  return { game, set, patch };
}

export function usePractices(): {
  plans: PracticePlan[];
  set: (next: PracticePlan[]) => void;
} {
  const [plans, setPlans] = useState<PracticePlan[]>([]);
  useEffect(() => {
    setPlans(loadPractices());
    return subscribe([EVENTS.PRACTICE, ...TEAM_RELOAD_EVENTS], () => setPlans(loadPractices()));
  }, []);
  const set = (next: PracticePlan[]) => {
    savePractices(next);
    setPlans(next);
  };
  return { plans, set };
}

export function useTeams(): {
  teams: Team[];
  activeId: string;
  active: Team | undefined;
  setActive: (id: string) => void;
  setTeams: (next: Team[]) => void;
} {
  const [teams, setTeamsState] = useState<Team[]>([]);
  const [activeId, setActiveIdState] = useState<string>("default");
  useEffect(() => {
    ensureDefaultTeam();
    setTeamsState(loadTeams());
    setActiveIdState(getActiveTeamId());
    return subscribe([EVENTS.TEAMS, EVENTS.ACTIVE_TEAM], () => {
      setTeamsState(loadTeams());
      setActiveIdState(getActiveTeamId());
    });
  }, []);
  const setActive = (id: string) => setActiveTeamId(id);
  const setTeams = (next: Team[]) => saveTeams(next);
  const active = teams.find((t) => t.id === activeId);
  return { teams, activeId, active, setActive, setTeams };
}
