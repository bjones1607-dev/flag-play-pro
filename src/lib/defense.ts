// Defensive call sheet for our own 3-3 zone (6v6, 3rd/4th grade).
// Coordinates match FootballField's system: SVG 100x100, LOS at y=70,
// offense below the LOS, defense above it.

export interface DefDefender {
  x: number;
  y: number;
  label: string;
  // Optional movement arrow (pre-snap shift or assignment), in SVG coords.
  arrow?: { toX: number; toY: number };
  // Optional zone bubble radius (drawn as a translucent ellipse).
  zone?: { rx: number; ry: number };
}

export interface DefensiveCall {
  id: string;
  name: string;
  subtitle: string;
  when: string;
  rules: { pos: string; rule: string }[];
  defenders: DefDefender[];
}

export const DEF_KID_RULES: { name: string; rule: string }[] = [
  {
    name: "STAY IN YOUR BOX",
    rule: "Zone means you guard grass, not a kid. Don't chase anyone out of your box.",
  },
  {
    name: "EYES ON THE QB",
    rule: "Watch the thrower, not the runners. When the ball flies, GO get it.",
  },
  {
    name: "FLAGS, NOT HUGS",
    rule: "Run through the flag. Two hands, rip it, hold it up high.",
  },
  {
    name: "EVERYBODY RUNS",
    rule: "When they catch it, ALL six of us sprint to the ball. Never watch.",
  },
  {
    name: "TALK!",
    rule: 'See a runner coming? Yell "BALL BALL BALL!" so your buddies know.',
  },
];

const UNDER_Y = 60; // ~9 yds off the LOS in field terms
const DEEP_Y = 38;

export const DEFENSIVE_CALLS: DefensiveCall[] = [
  {
    id: "base-33",
    name: "Base 33",
    subtitle: "Our home defense — 3 short boxes, 3 deep boxes",
    when: "Start every drive here. If it ain't broke, don't fix it.",
    rules: [
      {
        pos: "Short Left / Short Right",
        rule: "Guard the sideline grass. Nothing catches the ball in your box in front of you.",
      },
      {
        pos: "Short Middle",
        rule: "Guard the middle. Watch the center sneaking out — he's the sneaky one.",
      },
      {
        pos: "Deep Left / Deep Right",
        rule: "NOTHING gets behind you. Backpedal early, don't peek at short stuff.",
      },
      {
        pos: "Deep Middle",
        rule: "You're the boss. Deepest kid on the field, always. Call out 'DEEP!' if someone runs long.",
      },
    ],
    defenders: [
      { x: 18, y: UNDER_Y, label: "SL", zone: { rx: 15, ry: 7 } },
      { x: 50, y: UNDER_Y, label: "SM", zone: { rx: 15, ry: 7 } },
      { x: 82, y: UNDER_Y, label: "SR", zone: { rx: 15, ry: 7 } },
      { x: 25, y: DEEP_Y, label: "DL", zone: { rx: 16, ry: 9 } },
      { x: 50, y: DEEP_Y - 4, label: "DM", zone: { rx: 16, ry: 9 } },
      { x: 75, y: DEEP_Y, label: "DR", zone: { rx: 16, ry: 9 } },
    ],
  },
  {
    id: "squeeze",
    name: "Squeeze",
    subtitle: "Slide the short boxes to their crowd",
    when: "They put 3 receivers on one side (trips/bunch). Call 'SQUEEZE LEFT' or 'SQUEEZE RIGHT' toward the crowd.",
    rules: [
      {
        pos: "All 3 short defenders",
        rule: "Slide one box toward the crowd before the snap. Same jobs, new spots.",
      },
      {
        pos: "Backside short",
        rule: "You own the whole empty side — watch the lone receiver AND the QB run.",
      },
      { pos: "Deep 3", rule: "Don't slide. Deep boxes stay balanced — they want you to lean." },
    ],
    defenders: [
      { x: 18, y: UNDER_Y, label: "SL", arrow: { toX: 34, toY: UNDER_Y } },
      { x: 50, y: UNDER_Y, label: "SM", arrow: { toX: 64, toY: UNDER_Y } },
      { x: 82, y: UNDER_Y, label: "SR", arrow: { toX: 90, toY: UNDER_Y } },
      { x: 25, y: DEEP_Y, label: "DL", zone: { rx: 16, ry: 9 } },
      { x: 50, y: DEEP_Y - 4, label: "DM", zone: { rx: 16, ry: 9 } },
      { x: 75, y: DEEP_Y, label: "DR", zone: { rx: 16, ry: 9 } },
    ],
  },
  {
    id: "spy",
    name: "Spy",
    subtitle: "Short middle shadows the QB",
    when: "Their QB keeps tucking it and running. The spy takes away his legs.",
    rules: [
      {
        pos: "Short Middle (SPY)",
        rule: "Forget your box — mirror the QB. He scrambles, you meet him at the line and pull the flag.",
      },
      {
        pos: "Short Left / Right",
        rule: "Pinch in a step — you're covering the middle grass the spy left behind.",
      },
      { pos: "Deep 3", rule: "Normal jobs. Do NOT come up for the QB — that's the spy's job." },
    ],
    defenders: [
      { x: 22, y: UNDER_Y, label: "SL", zone: { rx: 16, ry: 7 } },
      { x: 50, y: 64, label: "SPY", arrow: { toX: 50, toY: 71 } },
      { x: 78, y: UNDER_Y, label: "SR", zone: { rx: 16, ry: 7 } },
      { x: 25, y: DEEP_Y, label: "DL", zone: { rx: 16, ry: 9 } },
      { x: 50, y: DEEP_Y - 4, label: "DM", zone: { rx: 16, ry: 9 } },
      { x: 75, y: DEEP_Y, label: "DR", zone: { rx: 16, ry: 9 } },
    ],
  },
  {
    id: "goal-line",
    name: "Goal Line 33",
    subtitle: "Shrink every box — nothing easy",
    when: "Ball inside our 10. Short throws score here, so everything tightens.",
    rules: [
      {
        pos: "Short 3",
        rule: "Move up close. Jump the quick flats and slants — that's all they run down here.",
      },
      {
        pos: "Deep 3",
        rule: "Stand ON the goal line. Nobody behind you means nobody scores deep.",
      },
      {
        pos: "Everyone",
        rule: "When the ball is caught, swarm — a catch at the 3 is a win if we pull the flag fast.",
      },
    ],
    defenders: [
      { x: 18, y: 65, label: "SL", zone: { rx: 14, ry: 5 } },
      { x: 50, y: 65, label: "SM", zone: { rx: 14, ry: 5 } },
      { x: 82, y: 65, label: "SR", zone: { rx: 14, ry: 5 } },
      { x: 25, y: 50, label: "DL", zone: { rx: 15, ry: 6 } },
      { x: 50, y: 48, label: "DM", zone: { rx: 15, ry: 6 } },
      { x: 75, y: 50, label: "DR", zone: { rx: 15, ry: 6 } },
    ],
  },
  {
    id: "lock",
    name: "Lock",
    subtitle: "Man-to-man with one deep helper",
    when: "They keep finding the soft spots in our zone. Lock up for a series to change the picture.",
    rules: [
      {
        pos: "5 defenders",
        rule: "Pick your kid before the snap — point at him and call his number. Go everywhere he goes.",
      },
      { pos: "Deep Middle (FREE)", rule: "You have no kid. Stay deepest, help whoever gets beat." },
      { pos: "Everyone", rule: "If your kid blocks, you're free — go find the ball." },
    ],
    defenders: [
      { x: 12, y: 64, label: "M1", arrow: { toX: 12, toY: 69 } },
      { x: 30, y: 64, label: "M2", arrow: { toX: 30, toY: 69 } },
      { x: 50, y: 64, label: "M3", arrow: { toX: 50, toY: 69 } },
      { x: 70, y: 64, label: "M4", arrow: { toX: 70, toY: 69 } },
      { x: 88, y: 64, label: "M5", arrow: { toX: 88, toY: 69 } },
      { x: 50, y: 40, label: "FREE", zone: { rx: 24, ry: 10 } },
    ],
  },
];
