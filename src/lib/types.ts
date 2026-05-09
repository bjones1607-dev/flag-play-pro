export type DefenseType = "zone" | "man";

export type RouteType =
  | "go" | "slant" | "curl" | "hitch" | "in" | "out" | "post" | "dig" | "corner" | "flat" | "screen" | "cross";

export interface ReceiverRoute {
  id: string;
  startX: number; // 0..100 (% of field width)
  startY: number; // 0..100 (% of field length, 0 = LOS, 100 = endzone)
  route: RouteType;
  side?: "left" | "right";
}

export interface Play {
  id: string;
  name: string;
  defense: DefenseType;
  receivers: ReceiverRoute[];
  qb: { x: number; y: number };
  purpose: string;
  formation: string;
  keyRead: string;
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
