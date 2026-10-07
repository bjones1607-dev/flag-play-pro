import type { ReceiverRoute } from "./types";

export const SHOTGUN_QB = { x: 50, y: 24 };
export const LOS_Y = 70;
export const BACKFIELD_BOTTOM = 96;

export function playerDepthFromFieldY(y: number, role: "receiver" | "qb") {
  const scale = role === "qb" ? 0.5 : 0.4;
  return (Math.max(LOS_Y, Math.min(BACKFIELD_BOTTOM, y)) - LOS_Y) / scale;
}

export function receiverSlotLabel(receivers: ReceiverRoute[], index: number): string {
  const receiver = receivers[index];
  if (!receiver) return "";
  if (receiver.isCenter) return "C";
  return String(receivers.slice(0, index + 1).filter((r) => !r.isCenter).length);
}