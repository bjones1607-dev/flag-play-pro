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
  // Center-specialty short routes (flag football)
  | "shovel"
  | "stick"
  | "sneak"
  | "pivot"
  | "leak"
  | "sit"
  | "chip"
  | "rub";

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
  | "zone-beater";

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
}

export interface PlayerAssignment {
  // receiverId -> playerId, "qb" -> playerId
  [slot: string]: string;
}
