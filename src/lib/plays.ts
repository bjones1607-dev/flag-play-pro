import type { Play } from "./types";

const QB = { x: 50, y: 12 };

// Standard receiver start positions (y = 4 just above LOS, on LOS)
const POS = {
  farLeft: { x: 12, y: 4 },
  left: { x: 28, y: 4 },
  slotLeft: { x: 38, y: 4 },
  slotRight: { x: 62, y: 4 },
  right: { x: 72, y: 4 },
  farRight: { x: 88, y: 4 },
  backfield: { x: 38, y: 14 },
};

export const PRESET_PLAYS: Play[] = [
  // ZONE plays
  {
    id: "spread-go", name: "Spread Go", defense: "zone", qb: QB,
    formation: "Trips Spread", purpose: "Stretch the deep zone with three verticals.",
    keyRead: "Read the safety; throw to the receiver he doesn't cover.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "go", side: "left" },
      { id: "r2", ...POS.left, route: "post", side: "left" },
      { id: "r3", ...POS.right, route: "post", side: "right" },
      { id: "r4", ...POS.farRight, route: "go", side: "right" },
      { id: "r5", ...POS.backfield, route: "flat", side: "right" },
    ],
  },
  {
    id: "bunch-slants", name: "Bunch Slants", defense: "zone", qb: QB,
    formation: "Bunch Right", purpose: "Quick slants flood underneath zones.",
    keyRead: "Hit the first open slant window.",
    receivers: [
      { id: "r1", ...POS.left, route: "hitch", side: "left" },
      { id: "r2", x: 60, y: 4, route: "slant", side: "right" },
      { id: "r3", x: 68, y: 4, route: "slant", side: "right" },
      { id: "r4", x: 76, y: 4, route: "slant", side: "right" },
      { id: "r5", ...POS.backfield, route: "flat", side: "left" },
    ],
  },
  {
    id: "triangle-flood", name: "Triangle Flood", defense: "zone", qb: QB,
    formation: "Trips Right", purpose: "Three levels in one zone forces a choice.",
    keyRead: "High-low the flat defender.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "dig", side: "left" },
      { id: "r2", ...POS.slotRight, route: "corner", side: "right" },
      { id: "r3", ...POS.right, route: "out", side: "right" },
      { id: "r4", ...POS.farRight, route: "go", side: "right" },
      { id: "r5", ...POS.backfield, route: "flat", side: "right" },
    ],
  },
  {
    id: "four-verts", name: "Four Verticals", defense: "zone", qb: QB,
    formation: "Spread", purpose: "Four go routes stress every deep zone.",
    keyRead: "Find the seam between safeties.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "go", side: "left" },
      { id: "r2", ...POS.slotLeft, route: "go", side: "left" },
      { id: "r3", ...POS.slotRight, route: "go", side: "right" },
      { id: "r4", ...POS.farRight, route: "go", side: "right" },
      { id: "r5", ...POS.backfield, route: "curl", side: "right" },
    ],
  },
  {
    id: "curl-flat", name: "Curl-Flat", defense: "zone", qb: QB,
    formation: "Doubles", purpose: "Classic high-low on the flat defender.",
    keyRead: "If flat defender drops, throw flat. If he sits, throw curl.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "curl", side: "left" },
      { id: "r2", ...POS.slotLeft, route: "flat", side: "left" },
      { id: "r3", ...POS.slotRight, route: "flat", side: "right" },
      { id: "r4", ...POS.farRight, route: "curl", side: "right" },
      { id: "r5", ...POS.backfield, route: "screen", side: "right" },
    ],
  },
  {
    id: "smash", name: "Smash", defense: "zone", qb: QB,
    formation: "Doubles", purpose: "Hitch under, corner over: classic Cover-2 beater.",
    keyRead: "If corner sinks, hit hitch. If he stays flat, throw corner.",
    receivers: [
      { id: "r1", ...POS.left, route: "hitch", side: "left" },
      { id: "r2", ...POS.slotLeft, route: "corner", side: "left" },
      { id: "r3", ...POS.slotRight, route: "corner", side: "right" },
      { id: "r4", ...POS.right, route: "hitch", side: "right" },
      { id: "r5", ...POS.backfield, route: "flat", side: "left" },
    ],
  },
  {
    id: "screen-pass", name: "Screen Pass", defense: "zone", qb: QB,
    formation: "Empty", purpose: "Quick lateral release with blockers.",
    keyRead: "Throw immediately to back; let blockers work.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "go", side: "left" },
      { id: "r2", ...POS.left, route: "hitch", side: "left" },
      { id: "r3", ...POS.right, route: "hitch", side: "right" },
      { id: "r4", ...POS.farRight, route: "go", side: "right" },
      { id: "r5", ...POS.backfield, route: "screen", side: "right" },
    ],
  },
  {
    id: "stick", name: "Stick Concept", defense: "zone", qb: QB,
    formation: "Trips", purpose: "Three-level stretch on flat defender.",
    keyRead: "Read flat defender; stick or out.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "go", side: "left" },
      { id: "r2", ...POS.slotRight, route: "out", side: "right" },
      { id: "r3", ...POS.right, route: "curl", side: "right" },
      { id: "r4", ...POS.farRight, route: "flat", side: "right" },
      { id: "r5", ...POS.backfield, route: "hitch", side: "left" },
    ],
  },

  // MAN plays
  {
    id: "cross-routes", name: "Cross Routes", defense: "man", qb: QB,
    formation: "Doubles", purpose: "Crossing routes pick off man defenders.",
    keyRead: "Throw to the receiver who clears traffic first.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "cross", side: "left" },
      { id: "r2", ...POS.slotLeft, route: "go", side: "left" },
      { id: "r3", ...POS.slotRight, route: "cross", side: "right" },
      { id: "r4", ...POS.farRight, route: "go", side: "right" },
      { id: "r5", ...POS.backfield, route: "flat", side: "right" },
    ],
  },
  {
    id: "play-action-dig", name: "Play Action Dig", defense: "man", qb: QB,
    formation: "I-Form", purpose: "Fake handoff, hit the deep dig.",
    keyRead: "Sell fake, find dig in the void.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "go", side: "left" },
      { id: "r2", ...POS.left, route: "dig", side: "left" },
      { id: "r3", ...POS.right, route: "post", side: "right" },
      { id: "r4", ...POS.farRight, route: "out", side: "right" },
      { id: "r5", ...POS.backfield, route: "flat", side: "left" },
    ],
  },
  {
    id: "mesh", name: "Mesh", defense: "man", qb: QB,
    formation: "Spread", purpose: "Two shallow crossers create a natural pick.",
    keyRead: "Throw to the receiver running away from coverage.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "cross", side: "left" },
      { id: "r2", ...POS.slotRight, route: "corner", side: "right" },
      { id: "r3", ...POS.slotLeft, route: "corner", side: "left" },
      { id: "r4", ...POS.farRight, route: "cross", side: "right" },
      { id: "r5", ...POS.backfield, route: "curl", side: "right" },
    ],
  },
  {
    id: "double-slants", name: "Double Slants", defense: "man", qb: QB,
    formation: "Doubles", purpose: "Quick-hitting slants beat tight man.",
    keyRead: "Throw to the leverage side.",
    receivers: [
      { id: "r1", ...POS.left, route: "slant", side: "left" },
      { id: "r2", ...POS.slotLeft, route: "go", side: "left" },
      { id: "r3", ...POS.slotRight, route: "go", side: "right" },
      { id: "r4", ...POS.right, route: "slant", side: "right" },
      { id: "r5", ...POS.backfield, route: "flat", side: "right" },
    ],
  },
  {
    id: "wheel-post", name: "Wheel & Post", defense: "man", qb: QB,
    formation: "Trips Right", purpose: "Wheel route from back beats LB in man.",
    keyRead: "Look post first; check down to wheel.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "post", side: "left" },
      { id: "r2", ...POS.slotRight, route: "in", side: "right" },
      { id: "r3", ...POS.right, route: "go", side: "right" },
      { id: "r4", ...POS.farRight, route: "out", side: "right" },
      { id: "r5", ...POS.backfield, route: "corner", side: "right" },
    ],
  },
  {
    id: "drive", name: "Drive Concept", defense: "man", qb: QB,
    formation: "Doubles", purpose: "Shallow + dig combo crushes inside leverage.",
    keyRead: "Hit shallow vs. soft, dig vs. tight.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "dig", side: "left" },
      { id: "r2", ...POS.left, route: "cross", side: "left" },
      { id: "r3", ...POS.right, route: "go", side: "right" },
      { id: "r4", ...POS.farRight, route: "corner", side: "right" },
      { id: "r5", ...POS.backfield, route: "flat", side: "right" },
    ],
  },
  {
    id: "iso-go", name: "Iso Go", defense: "man", qb: QB,
    formation: "Empty", purpose: "Isolate your best receiver one-on-one deep.",
    keyRead: "Throw to the matchup; everyone else clears.",
    receivers: [
      { id: "r1", ...POS.farLeft, route: "go", side: "left" },
      { id: "r2", ...POS.slotLeft, route: "cross", side: "left" },
      { id: "r3", ...POS.slotRight, route: "cross", side: "right" },
      { id: "r4", ...POS.farRight, route: "out", side: "right" },
      { id: "r5", ...POS.backfield, route: "flat", side: "left" },
    ],
  },
];

// Defense positions (3 defenders) in % coords.
export function defensePositions(d: "zone" | "man") {
  if (d === "zone") {
    // 3-3 zone: deep middle, deep right-ish, flat-ish — for 3 defenders show 3 zones
    return [
      { x: 25, y: 35, label: "Z" },
      { x: 50, y: 50, label: "Z" },
      { x: 75, y: 35, label: "Z" },
    ];
  }
  // man: line up across from receivers
  return [
    { x: 25, y: 22, label: "M" },
    { x: 50, y: 22, label: "M" },
    { x: 75, y: 22, label: "M" },
  ];
}
