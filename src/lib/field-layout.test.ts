/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { PRESET_PLAYS } from "./plays";
import { LOS_Y, playerDepthFromFieldY, receiverSlotLabel } from "./field-layout";

describe("coach formation rules", () => {
  test("every default QB is in shotgun behind the center", () => {
    expect(PRESET_PLAYS.length).toBeGreaterThan(0);
    for (const play of PRESET_PLAYS) {
      const center = play.receivers.find((r) => r.isCenter);
      expect(center).toBeDefined();
      expect(play.qb.y).toBe(24);
      expect(play.qb.x).toBe(center?.x);
      expect(LOS_Y + play.qb.y * 0.5 - (LOS_Y + (center?.y ?? 0) * 0.4)).toBeGreaterThan(8);
    }
  });
  test("receivers can move beside and behind the shotgun QB without leaving the field", () => {
    expect(playerDepthFromFieldY(82, "receiver") * 0.4 + LOS_Y).toBe(82);
    expect(playerDepthFromFieldY(92, "receiver") * 0.4 + LOS_Y).toBe(92);
    expect(playerDepthFromFieldY(120, "receiver") * 0.4 + LOS_Y).toBe(96);
    expect(playerDepthFromFieldY(120, "qb") * 0.5 + LOS_Y).toBe(96);
    expect(playerDepthFromFieldY(20, "receiver")).toBe(0);
  });
  test("every default play has receivers numbered 1–4 and a separate C, never 5", () => {
    for (const play of PRESET_PLAYS) {
      const labels = play.receivers.map((_, i) => receiverSlotLabel(play.receivers, i));
      expect(labels.filter((label) => label !== "C")).toEqual(["1", "2", "3", "4"]);
      expect(labels.filter((label) => label === "C")).toHaveLength(1);
      expect(labels).not.toContain("5");
    }
  });
});