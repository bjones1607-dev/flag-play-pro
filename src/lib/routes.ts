import type { RouteType, PassRoute, RunRoute, PlayTag, PlayerPosition } from "./types";

export const ROUTE_LABELS: Record<RouteType, string> = {
  go: "Go",
  slant: "Slant",
  curl: "Curl",
  hitch: "Hitch",
  in: "In",
  out: "Out",
  post: "Post",
  dig: "Dig",
  corner: "Corner",
  flat: "Flat",
  screen: "Screen",
  cross: "Cross",
  block: "Block / Shield",
  drag: "Drag",
  delay: "Delay",
  swing: "Swing",
  wheel: "Wheel",
  pop: "Pop Pass",
  seam: "Seam",
  dive: "Dive",
  sweep: "Sweep",
  counter: "Counter",
};

export const PASS_ROUTES: PassRoute[] = [
  "go",
  "slant",
  "curl",
  "hitch",
  "in",
  "out",
  "post",
  "dig",
  "corner",
  "flat",
  "screen",
  "cross",
  "drag",
  "delay",
  "swing",
  "wheel",
  "pop",
  "seam",
  "block",
];

export const RUN_ROUTES: RunRoute[] = ["dive", "sweep", "counter"];

export const ALL_ROUTES: RouteType[] = [...PASS_ROUTES, ...RUN_ROUTES];

export const TAG_LABELS: Record<PlayTag, string> = {
  short: "Short",
  deep: "Deep",
  redzone: "Red Zone",
  goalline: "Goal Line",
  "third-long": "3rd & Long",
  trick: "Trick",
  run: "Run",
  screen: "Screen",
  "no-run-zone": "No-Run Zone OK",
  center: "Center Play",
};

export const ALL_TAGS: PlayTag[] = [
  "short",
  "deep",
  "redzone",
  "goalline",
  "third-long",
  "trick",
  "run",
  "screen",
  "center",
];

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  qb: "QB",
  center: "Center",
  wr: "WR",
  rb: "RB",
  rusher: "Rusher",
  any: "Any",
};

export const ALL_POSITIONS: PlayerPosition[] = ["qb", "center", "wr", "rb", "rusher", "any"];
