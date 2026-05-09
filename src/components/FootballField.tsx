import type { Play, Player, PlayerAssignment } from "@/lib/types";
import { defensePositions } from "@/lib/plays";
import type { RouteType } from "@/lib/types";

const ROUTE_COLORS = [
  "var(--route-1)", "var(--route-2)", "var(--route-3)", "var(--route-4)", "var(--route-5)",
];

// Coordinate system:
// SVG viewBox 100 wide x 100 tall
// LOS at svgY = 70. Downfield = smaller y (toward 0). Behind LOS = larger y (toward 100).
// Receiver "depth" r.y in play data: small positive = on LOS, larger = behind (backfield).
// Route segments use "downfield" units (positive = toward endzone).
const LOS = 70;
const SCALE = 0.7; // 1 yard ~ 0.7 svg units downfield

interface Props {
  play: Play;
  assignment?: PlayerAssignment;
  players?: Player[];
  showLabels?: boolean;
}

// Returns array of [x, y] points in SVG coords for the given route starting at (sx, sBehindLOS).
function routeSvgPoints(
  route: RouteType,
  sx: number,
  sBehindLOS: number,
  side: "left" | "right"
): Array<[number, number]> {
  const startY = LOS + sBehindLOS * 0.4; // behind LOS slightly
  const sgn = side === "right" ? 1 : -1;
  const pts: Array<[number, number]> = [[sx, startY]];

  // Helper: move (dxRight in svg, dDownfield in svg)
  const downfield = (yards: number) => -yards * SCALE;
  const lateral = (yards: number) => yards; // svg x already 0-100 for ~ field width

  const last = () => pts[pts.length - 1];
  const move = (dx: number, dy: number) => pts.push([last()[0] + dx, last()[1] + dy]);

  switch (route) {
    case "go":
      move(0, downfield(55));
      break;
    case "slant":
      move(0, downfield(8));
      move(lateral(-sgn * 18), downfield(15));
      break;
    case "curl":
      move(0, downfield(22));
      move(lateral(-sgn * 4), downfield(-3));
      break;
    case "hitch":
      move(0, downfield(12));
      move(0, downfield(-3));
      break;
    case "in":
      move(0, downfield(18));
      move(lateral(-sgn * 28), 0);
      break;
    case "dig":
      move(0, downfield(28));
      move(lateral(-sgn * 30), 0);
      break;
    case "out":
      move(0, downfield(14));
      move(lateral(sgn * 18), 0);
      break;
    case "post":
      move(0, downfield(22));
      move(lateral(-sgn * 18), downfield(20));
      break;
    case "corner":
      move(0, downfield(20));
      move(lateral(sgn * 16), downfield(20));
      break;
    case "flat":
      move(lateral(sgn * 22), downfield(4));
      break;
    case "screen":
      move(lateral(sgn * 14), downfield(-2));
      break;
    case "cross":
      move(0, downfield(8));
      move(lateral(-sgn * 40), downfield(12));
      break;
  }
  return pts;
}

export function FootballField({ play, assignment = {}, players = [], showLabels = true }: Props) {
  const playerLabel = (slotId: string) => {
    const pid = assignment[slotId];
    if (!pid) return "";
    const p = players.find((x) => x.id === pid);
    return p ? p.number : "";
  };

  const defenders = defensePositions(play.defense);

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-auto rounded-xl shadow-2xl"
      style={{ background: "var(--field)" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {ROUTE_COLORS.map((c, i) => (
          <marker key={i} id={`arrow-${i}`} viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
          </marker>
        ))}
      </defs>

      {/* End zone */}
      <rect x="0" y="0" width="100" height="14" fill="var(--field-deep)" />
      <text x="50" y="9" textAnchor="middle" fontSize="4" fill="var(--chalk)"
        opacity="0.55" fontFamily="var(--font-display)" letterSpacing="0.3">END ZONE</text>

      {/* Yard lines */}
      {[20, 35, 50, 65].map((y) => (
        <line key={y} x1="0" y1={y} x2="100" y2={y}
          stroke="var(--chalk)" strokeWidth="0.2" opacity="0.3" />
      ))}
      {/* Sidelines */}
      <line x1="1" y1="0" x2="1" y2="100" stroke="var(--chalk)" strokeWidth="0.4" opacity="0.7" />
      <line x1="99" y1="0" x2="99" y2="100" stroke="var(--chalk)" strokeWidth="0.4" opacity="0.7" />

      {/* LOS */}
      <line x1="0" y1={LOS} x2="100" y2={LOS} stroke="var(--chalk)" strokeWidth="0.6" />
      <text x="3" y={LOS - 1} fontSize="2.2" fill="var(--chalk)" opacity="0.6" fontFamily="var(--font-display)">LOS</text>

      {/* Defenders */}
      {defenders.map((d, i) => (
        <g key={i}>
          <line x1={d.x - 2} y1={d.y - 2} x2={d.x + 2} y2={d.y + 2}
            stroke="var(--defense)" strokeWidth="0.9" strokeLinecap="round" />
          <line x1={d.x - 2} y1={d.y + 2} x2={d.x + 2} y2={d.y - 2}
            stroke="var(--defense)" strokeWidth="0.9" strokeLinecap="round" />
        </g>
      ))}

      {/* Routes & receivers */}
      {play.receivers.map((r, i) => {
        const color = ROUTE_COLORS[i % 5];
        const pts = routeSvgPoints(r.route, r.x, r.y, r.side ?? "right");
        const d = pts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
        const start = pts[0];
        const end = pts[pts.length - 1];
        const labelY = end[1] < 8 ? end[1] + 4 : end[1] - 1.8;

        return (
          <g key={r.id}>
            <path d={d} stroke={color} strokeWidth="0.8" fill="none"
              strokeLinecap="round" strokeLinejoin="round"
              markerEnd={`url(#arrow-${i % 5})`} />
            <circle cx={start[0]} cy={start[1]} r="2.8" fill={color}
              stroke="var(--chalk)" strokeWidth="0.3" />
            {showLabels && (
              <text x={start[0]} y={start[1] + 1} textAnchor="middle"
                fontSize="2.4" fill="#0a1a0e" fontWeight="800">
                {playerLabel(r.id) || (i + 1)}
              </text>
            )}
            {showLabels && (
              <text x={end[0]} y={labelY} textAnchor="middle"
                fontSize="2.2" fill={color} fontWeight="800"
                style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.6)", strokeWidth: 0.5 }}
                fontFamily="var(--font-display)">
                {r.route.toUpperCase()}
              </text>
            )}
          </g>
        );
      })}

      {/* QB */}
      <circle cx={play.qb.x} cy={LOS + play.qb.y * 0.5} r="3.2"
        fill="var(--qb)" stroke="var(--field-deep)" strokeWidth="0.4" />
      <text x={play.qb.x} y={LOS + play.qb.y * 0.5 + 1.1} textAnchor="middle"
        fontSize="2.6" fill="var(--field-deep)" fontWeight="800">
        {playerLabel("qb") || "QB"}
      </text>
    </svg>
  );
}
