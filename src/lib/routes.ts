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
  shovel: "Shovel",
  stick: "Stick (3yd Out)",
  sneak: "Sneak",
  pivot: "Pivot",
  leak: "Leak",
  sit: "Sit (Soft Spot)",
  chip: "Chip & Release",
  rub: "Rub / Pick",
  pop: "Pop (8yd Middle)",
  seam: "Seam (Deep Pipe)",
};

// Center route options. League rule: the snapper is a fully eligible
// receiver after the snap, and zones routinely forget him — so he gets the
// quick outlets first, the zone-exploit middle routes next, and then the
// full route tree for complete customization.
export const CENTER_ROUTES: RouteType[] = [
  // Quick outlets
  "sit",
  "sneak",
  "shovel",
  "stick",
  "pivot",
  "leak",
  "chip",
  "rub",
  "delay",
  // Zone exploits up the middle
  "pop",
  "seam",
  // Full tree
  "drag",
  "swing",
  "flat",
  "hitch",
  "screen",
  "slant",
  "curl",
  "in",
  "out",
  "cross",
  "dig",
  "corner",
  "post",
  "go",
  "wheel",
];

export const CENTER_ROUTE_TIPS: Partial<Record<RouteType, string>> = {
  shovel: "Snap, flare 2yd behind LOS for shovel pass — beats blitz",
  stick: "Snap, 3yd burst, snap to sideline — money vs zone",
  sneak: "Snap, hard 2-3yd vertical — checkdown vs blitz",
  pivot: "Snap, hitch at 3yd, pivot opposite — beats trail man",
  leak: "Snap, count '1-2', leak to soft flat — late vs zone",
  sit: "Snap, 4yd then settle in window — find soft spot",
  chip: "Snap, chip rusher, release to flat — 2nd-level outlet",
  rub: "Snap, cross face of slot to free a teammate — pick play",
  delay: "Snap, count '1-2', release into vacated middle",
  drag: "Snap, 2yd then drag across — beats man",
  swing: "Snap, swing to backfield — screen / quick out",
  flat: "Snap, attack flat — outlet vs all-out blitz",
  hitch: "Snap, 4yd, snap back to QB",
  screen: "Snap, set up bubble screen behind LOS",
  pop: "Snap, count '1-2', BURST to 8yd behind the middle defender — zones forget the snapper",
  seam: "Snap, sell short for a count, then take off up the empty middle pipe — the deep shot nobody sees",
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
  // "block" removed: UA Flag rules — blocking is a spot foul + loss of down.
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
  "zone-beater": "Zone Beater",
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
  "zone-beater",
];
