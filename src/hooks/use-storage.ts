import { useEffect, useState } from "react";
import {
  applyLineup,
  deleteLineup,
  EVENTS,
  loadActiveLineupId,
  loadAssignment,
  loadCallLog,
  loadCustomPlays,
  loadFavorites,
  loadGameStart,
  loadLineups,
  loadPlayers,
  loadRecentCalls,
  loadSituation,
  saveCurrentAsLineup,
  saveFavorites,
  saveSituation,
  updateLineupFromCurrent,
  type CallLogEntry,
  type Lineup,
  type RecentCall,
  type Situation,
} from "@/lib/storage";
import type { Play, Player, PlayerAssignment } from "@/lib/types";

function subscribe(events: string[], cb: () => void) {
  events.forEach((e) => window.addEventListener(e, cb));
  // also react to other tabs
  window.addEventListener("storage", cb);
  return () => {
    events.forEach((e) => window.removeEventListener(e, cb));
    window.removeEventListener("storage", cb);
  };
}

export function usePlayers(): Player[] {
  const [v, setV] = useState<Player[]>([]);
  useEffect(() => {
    setV(loadPlayers());
    return subscribe([EVENTS.ROSTER], () => setV(loadPlayers()));
  }, []);
  return v;
}

export function useAssignment(): PlayerAssignment {
  const [v, setV] = useState<PlayerAssignment>({});
  useEffect(() => {
    setV(loadAssignment());
    return subscribe([EVENTS.ASSIGN], () => setV(loadAssignment()));
  }, []);
  return v;
}

export function useCustomPlays(): [Play[], (next: Play[]) => void] {
  const [v, setV] = useState<Play[]>([]);
  useEffect(() => {
    setV(loadCustomPlays());
    return subscribe([EVENTS.PLAYS], () => setV(loadCustomPlays()));
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
    return subscribe([EVENTS.FAV], () => setIds(new Set(loadFavorites())));
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

export function useLineups(): {
  lineups: Lineup[];
  activeId: string | null;
  apply: (id: string) => void;
  saveCurrent: (name: string) => Lineup;
  update: (id: string) => void;
  remove: (id: string) => void;
} {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => {
      setLineups(loadLineups());
      setActiveId(loadActiveLineupId());
    };
    refresh();
    return subscribe([EVENTS.LINEUPS], refresh);
  }, []);
  return {
    lineups,
    activeId,
    apply: applyLineup,
    saveCurrent: saveCurrentAsLineup,
    update: updateLineupFromCurrent,
    remove: deleteLineup,
  };
}

export function useRecentCalls(): RecentCall[] {
  const [v, setV] = useState<RecentCall[]>([]);
  useEffect(() => {
    setV(loadRecentCalls());
    return subscribe([EVENTS.RECENT], () => setV(loadRecentCalls()));
  }, []);
  return v;
}

export function useCallLog(): { log: CallLogEntry[]; gameStart: number } {
  const [log, setLog] = useState<CallLogEntry[]>([]);
  const [gameStart, setGameStart] = useState(0);
  useEffect(() => {
    const refresh = () => {
      setLog(loadCallLog());
      setGameStart(loadGameStart());
    };
    refresh();
    return subscribe([EVENTS.CALLLOG], refresh);
  }, []);
  return { log, gameStart };
}

export function useSituation(): [Situation, (s: Situation) => void] {
  const [v, setV] = useState<Situation>(() => loadSituation());
  useEffect(() => {
    setV(loadSituation());
    return subscribe([EVENTS.SITUATION], () => setV(loadSituation()));
  }, []);
  const set = (s: Situation) => {
    saveSituation(s);
    setV(s);
  };
  return [v, set];
}
