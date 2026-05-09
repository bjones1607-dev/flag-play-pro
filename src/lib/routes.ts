import type { RouteType } from "./types";

// All routes return SVG path string assuming start at (sx, sy) in % coords.
// y grows downfield (toward endzone). Side determines mirroring for in/out routes.
export function routePath(
  route: RouteType,
  sx: number,
  sy: number,
  side: "left" | "right" = "right"
): { d: string; end: { x: number; y: number } } {
  const s = side === "right" ? 1 : -1;
  let segs: Array<[number, number]> = [[sx, sy]];

  const push = (dx: number, dy: number) => {
    const last = segs[segs.length - 1];
    segs.push([last[0] + dx, last[1] - dy]); // dy negative = downfield (toward top)
  };

  switch (route) {
    case "go":
      push(0, 55);
      break;
    case "slant":
      push(0, 8);
      push(-s * 18, 18);
      break;
    case "curl":
      push(0, 22);
      push(-s * 4, -2);
      break;
    case "hitch":
      push(0, 12);
      push(0, -2);
      break;
    case "in":
    case "dig":
      push(0, route === "dig" ? 28 : 18);
      push(-s * 28, 0);
      break;
    case "out":
      push(0, 14);
      push(s * 18, 0);
      break;
    case "post":
      push(0, 22);
      push(-s * 18, 22);
      break;
    case "corner":
      push(0, 20);
      push(s * 16, 22);
      break;
    case "flat":
      push(s * 22, 6);
      break;
    case "screen":
      push(s * 14, -4);
      break;
    case "cross":
      push(0, 10);
      push(-s * 40, 14);
      break;
  }

  const d = segs
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
  const end = { x: segs[segs.length - 1][0], y: segs[segs.length - 1][1] };
  return { d, end };
}

export const ROUTE_LABELS: Record<RouteType, string> = {
  go: "Go", slant: "Slant", curl: "Curl", hitch: "Hitch",
  in: "In", out: "Out", post: "Post", dig: "Dig",
  corner: "Corner", flat: "Flat", screen: "Screen", cross: "Cross",
};

export const ALL_ROUTES: RouteType[] = [
  "go", "slant", "curl", "hitch", "in", "out", "post", "dig", "corner", "flat", "screen", "cross",
];
