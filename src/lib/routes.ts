import type { RouteType, PassRoute, RunRoute, PlayTag } from "./types";

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
  block: "Block",
  drag: "Drag",
  delay: "Delay",
  swing: "Swing",
  wheel: "Wheel",
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
];
