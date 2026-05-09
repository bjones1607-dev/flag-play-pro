import type { RouteType } from "./types";

export const ROUTE_LABELS: Record<RouteType, string> = {
  go: "Go", slant: "Slant", curl: "Curl", hitch: "Hitch",
  in: "In", out: "Out", post: "Post", dig: "Dig",
  corner: "Corner", flat: "Flat", screen: "Screen", cross: "Cross",
};

export const ALL_ROUTES: RouteType[] = [
  "go", "slant", "curl", "hitch", "in", "out", "post", "dig", "corner", "flat", "screen", "cross",
];
