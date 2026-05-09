import type { Play, Player, PlayerAssignment } from "@/lib/types";
import { routePath } from "@/lib/routes";
import { defensePositions } from "@/lib/plays";

const ROUTE_COLORS = [
  "var(--route-1)", "var(--route-2)", "var(--route-3)", "var(--route-4)", "var(--route-5)",
];

interface Props {
  play: Play;
  assignment?: PlayerAssignment;
  players?: Player[];
  showLabels?: boolean;
}

export function FootballField({ play, assignment = {}, players = [], showLabels = true }: Props) {
  const W = 100, H = 100;
  // Field y: 0 = top (endzone), 100 = bottom (own goal). LOS at y=70 (so most field is downfield/up).
  const losY = 70;
  // Convert "play y" (0=LOS, 100=endzone deep) to SVG y: svgY = losY - playY * (losY/100)
  const toSvgY = (py: number) => losY - py * (losY / 100);

  const playerLabel = (slotId: string) => {
    const pid = assignment[slotId];
    if (!pid) return "";
    const p = players.find((x) => x.id === pid);
    return p ? p.number : "";
  };

  const defenders = defensePositions(play.defense);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto rounded-xl"
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
      <rect x="0" y="0" width={W} height="14" fill="var(--field-deep)" />
      <text x="50" y="9" textAnchor="middle" fontSize="4" fill="var(--chalk)"
        opacity="0.5" fontFamily="var(--font-display)" letterSpacing="0.3">END ZONE</text>

      {/* Yard lines every 10 yards (40-yard field, 4 lines) */}
      {[20, 35, 50, 65].map((y) => (
        <line key={y} x1="0" y1={y} x2={W} y2={y}
          stroke="var(--chalk)" strokeWidth="0.2" opacity="0.35" />
      ))}
      {/* Sidelines */}
      <line x1="1" y1="0" x2="1" y2={H} stroke="var(--chalk)" strokeWidth="0.4" opacity="0.7" />
      <line x1={W-1} y1="0" x2={W-1} y2={H} stroke="var(--chalk)" strokeWidth="0.4" opacity="0.7" />

      {/* LOS */}
      <line x1="0" y1={losY} x2={W} y2={losY}
        stroke="var(--chalk)" strokeWidth="0.6" />

      {/* Defenders */}
      {defenders.map((d, i) => (
        <g key={i}>
          <line x1={d.x - 2} y1={d.y - 2} x2={d.x + 2} y2={d.y + 2}
            stroke="var(--defense)" strokeWidth="0.8" strokeLinecap="round" />
          <line x1={d.x - 2} y1={d.y + 2} x2={d.x + 2} y2={d.y - 2}
            stroke="var(--defense)" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ))}

      {/* Routes */}
      {play.receivers.map((r, i) => {
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
        // Build path in svg coords: translate y values
        const { d } = routePath(r.route, r.x, 0, r.side ?? "right");
        // routePath returns coords with sx,sy and growing toward up by subtracting from sy.
        // We need to remap: each (x,y) in returned path -> svg (x, toSvgY(0 - y_offset))
        // Simpler: rebuild path from raw segments.
        const rawSegs = parseSegments(d);
        // First seg starts at (r.x, 0) in "play y"; downfield grows positive in our route generator (we did sy - dy).
        // Reconstruct play-space coords.
        const playSegs: Array<[number, number]> = rawSegs.map(([px, py]) => {
          // py was: starting at 0, then 0 - dy = -dy (dy positive downfield)
          // So downfield distance = -py
          const downfield = -py;
          return [px, downfield];
        });
        // Start receiver at r.y (their position above LOS)
        const startDownfield = r.y;
        const svgPath = playSegs
          .map(([px, downfield], idx) =>
            `${idx === 0 ? "M" : "L"} ${px} ${toSvgY(startDownfield + downfield)}`)
          .join(" ");

        const lastIdx = playSegs.length - 1;
        const endX = playSegs[lastIdx][0];
        const endY = toSvgY(startDownfield + playSegs[lastIdx][1]);

        return (
          <g key={r.id}>
            <path d={svgPath} stroke={color} strokeWidth="0.7" fill="none"
              strokeLinecap="round" strokeLinejoin="round"
              markerEnd={`url(#arrow-${i % 5})`} />
            {/* Receiver dot */}
            <circle cx={r.x} cy={toSvgY(r.y)} r="2.6" fill={color} stroke="var(--chalk)" strokeWidth="0.3" />
            {showLabels && (
              <text x={r.x} y={toSvgY(r.y) + 0.9} textAnchor="middle"
                fontSize="2.2" fill="#0a1a0e" fontWeight="700">
                {playerLabel(r.id) || (i + 1)}
              </text>
            )}
            {/* Route label near end */}
            {showLabels && (
              <text x={endX} y={endY - 1.5} textAnchor="middle"
                fontSize="2" fill={color} fontWeight="700"
                style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.5)", strokeWidth: 0.4 }}>
                {r.route.toUpperCase()}
              </text>
            )}
          </g>
        );
      })}

      {/* QB */}
      <circle cx={play.qb.x} cy={toSvgY(-play.qb.y)} r="3" fill="var(--qb)"
        stroke="var(--field-deep)" strokeWidth="0.4" />
      <text x={play.qb.x} y={toSvgY(-play.qb.y) + 1} textAnchor="middle"
        fontSize="2.4" fill="var(--field-deep)" fontWeight="800">
        {playerLabel("qb") || "QB"}
      </text>
    </svg>
  );
}

function parseSegments(d: string): Array<[number, number]> {
  return d.split(/(?=[ML])/).map((seg) => {
    const parts = seg.trim().split(/\s+/);
    return [parseFloat(parts[1]), parseFloat(parts[2])] as [number, number];
  });
}
