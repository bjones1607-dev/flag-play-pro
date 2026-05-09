export type DefenseType = "zone" | "man";

// Pass routes
export type PassRoute =
  | "go"
  | "slant"
  | "curl"
  | "hitch"
  | "in"
  | "out"
  | "post"
  | "dig"
  | "corner"
  | "flat"
  | "screen"
  | "cross"
  | "block"
  | "drag"
  | "delay"
  | "swing"
  | "wheel"
  | "pop"
  | "seam";

// Run paths (used when a player is the ball carrier on a run play)
export type RunRoute = "dive" | "sweep" | "counter";

export type RouteType = PassRoute | RunRoute;

export type PlayType = "pass" | "run";

export type QbAction = "pass" | "keep-left" | "keep-right" | "scramble";

export type PlayTag =
  | "short"
  | "deep"
  | "redzone"
  | "goalline"
  | "third-long"
  | "trick"
  | "run"
  | "screen"
  | "no-run-zone"
  | "center";

// Roster positions for 6v6 flag football
export type PlayerPosition = "qb" | "center" | "wr" | "rb" | "rusher" | "any";

export interface ReceiverRoute {
  id: string;
  x: number;
  y: number;
  route: RouteType;
  side?: "left" | "right";
  isCenter?: boolean;
  isRunner?: boolean;
}

export interface MotionPath {
  receiverId: string;
  toX: number;
  toY: number;
}

export interface Play {
  id: string;
  name: string;
  defense: DefenseType;
  receivers: ReceiverRoute[];
  qb: { x: number; y: number };
  qbAction?: QbAction;
  purpose: string;
  formation: string;
  keyRead: string;
  notes?: string;
  tags?: PlayTag[];
  motion?: MotionPath;
  playType?: PlayType;
  custom?: boolean;
}

export interface Player {
  id: string;
  name: string;
  number: string;
  position?: PlayerPosition;
}

export interface PlayerAssignment {
  // receiverId -> playerId, "qb" -> playerId
  [slot: string]: string;
}

// Game-day tracker
export interface GameState {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  down: 1 | 2 | 3 | 4;
  yardsToFirst: number; // 0 means crossed midfield / first
  ballOn: number; // 0..100 yards (own goal to opponent)
  noRunZone: boolean; // computed alert
  history: PlayCall[];
}

export interface PlayCall {
  id: string;
  name: string;
  t: number; // timestamp
}

// Multi-team
export interface Team {
  id: string;
  name: string;
  ageGroup?: string; // "U10", "U12", etc.
  color?: string; // hex color for branding
  createdAt: number;
}

// Practice planner
export interface PracticeBlock {
  id: string;
  name: string;
  minutes: number;
  notes: string;
  playIds: string[];
}

export interface PracticePlan {
  id: string;
  name: string;
  date?: string; // YYYY-MM-DD
  blocks: PracticeBlock[];
}
