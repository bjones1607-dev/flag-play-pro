// The 3x3 Zone Attack play sheet for the 3rd/4th grade division.
// League rules: 50-yard field · 3 downs to reach midfield · then 4 downs to score.
// Sections follow that drive structure so play calls match the game state.

import type { Play } from "./types";

export interface PlaysheetSection {
  title: string;
  subtitle: string;
  playIds: string[];
}

// Flat, deduped sheet order — the same numbering the play sheet and
// wristband cards use.
export function playsheetOrder(all: Play[]): Play[] {
  const byId = new Map(all.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const list: Play[] = [];
  for (const s of PLAYSHEET_SECTIONS) {
    for (const id of s.playIds) {
      if (seen.has(id)) continue;
      const p = byId.get(id);
      if (p) {
        seen.add(id);
        list.push(p);
      }
    }
  }
  return list;
}

export const KID_RULES: { name: string; rule: string }[] = [
  {
    name: "FIND THE GRASS",
    rule: "Against zone, stop in the open space. Don't run into a defender — sit where they aren't.",
  },
  {
    name: "MAKE A SANDWICH",
    rule: "One friend short + one friend deep on the same defender. He can't guard both.",
  },
  {
    name: "FLOOD THE SIDE",
    rule: "Three catchers on one side vs two defenders — somebody is ALWAYS open.",
  },
  {
    name: "CATCH, TURN, RUN NORTH",
    rule: "Catch it first, then turn upfield right away. No dancing sideways.",
  },
];

export const QB_GOLDEN_RULE =
  'QB golden rule: count "one-two-three" — if nobody\'s open, throw to the center sitting in the middle. Never take a sack.';

export const PLAYSHEET_SECTIONS: PlaysheetSection[] = [
  {
    title: "PART 1 · GET TO MIDFIELD",
    subtitle: "3 downs to cross midfield — easy throws, easy yards",
    playIds: ["zb-pizza", "zb-oreo", "zb-popcorn", "zb-waves", "zb-secret-agent"],
  },
  {
    title: "PART 2 · GO SCORE",
    subtitle: "4 downs to the end zone — attack the seams and sidelines",
    playIds: ["zb-rocket", "zb-rainbow", "zb-ladder", "zb-periscope"],
  },
  {
    title: "MONEY DOWNS",
    subtitle: "3rd/4th down and long — we need it NOW",
    playIds: ["zb-safety-net", "zb-trojan"],
  },
  {
    title: "GOAL LINE",
    subtitle: "Punch it in — passes only, runs are illegal inside their 5",
    playIds: ["zb-thunder", "zb-secret-agent"],
  },
  {
    title: "THE ONE RUN",
    subtitle: "League rule: one run per possession, never inside their 5 — pick your moment",
    playIds: ["rb-dive", "zb-slingshot", "jet-sweep-left", "counter-trey", "zb-trojan"],
  },
  {
    title: "CHANGE-UPS",
    subtitle: "Once-a-game specials — save them for the right moment",
    playIds: ["zb-turtle"],
  },
  {
    title: "EMERGENCY",
    subtitle: "Down late, need a miracle — practice these so they're not chaos",
    playIds: ["zb-hook-ladder", "zb-boomerang", "zb-moon-shot"],
  },
];
