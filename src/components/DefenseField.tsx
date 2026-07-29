import type { DefensiveCall } from "@/lib/defense";

// Mini diagram for a defensive call: our 6 defenders (with zone bubbles and
// shift arrows) vs a generic 5-wide offense. Same coordinate system as
// FootballField: viewBox 100x100, LOS at y=70, offense below the line.
const LOS = 70;
const OFFENSE_X = [12, 28, 50, 72, 88];

export function DefenseField({ call }: { call: DefensiveCall }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-auto rounded-xl shadow-2xl select-none"
      style={{ background: "var(--field)" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id="def-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4.5"
          markerHeight="4.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--defense)" />
        </marker>
      </defs>

      {/* Our end zone at the top (we defend it) */}
      <rect x="0" y="0" width="100" height="14" fill="var(--field-deep)" />
      <text
        x="50"
        y="9"
        textAnchor="middle"
        fontSize="4"
        fill="var(--chalk)"
        opacity="0.55"
        fontFamily="var(--font-display)"
        letterSpacing="0.3"
      >
        OUR END ZONE
      </text>

      {/* Yard lines */}
      {[63, 56, 49, 42, 35, 28, 21].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="100"
          y2={y}
          stroke="var(--chalk)"
          strokeWidth="0.18"
          opacity="0.28"
        />
      ))}
      <line x1="1" y1="0" x2="1" y2="100" stroke="var(--chalk)" strokeWidth="0.4" opacity="0.7" />
      <line x1="99" y1="0" x2="99" y2="100" stroke="var(--chalk)" strokeWidth="0.4" opacity="0.7" />
      <line x1="0" y1={LOS} x2="100" y2={LOS} stroke="var(--chalk)" strokeWidth="0.6" />

      {/* Zone bubbles first so defenders draw on top */}
      {call.defenders.map(
        (d, i) =>
          d.zone && (
            <ellipse
              key={`z-${i}`}
              cx={d.x}
              cy={d.y}
              rx={d.zone.rx}
              ry={d.zone.ry}
              fill="var(--defense)"
              opacity="0.12"
              stroke="var(--defense)"
              strokeWidth="0.3"
              strokeDasharray="1.5 1.2"
            />
          ),
      )}

      {/* Shift/assignment arrows */}
      {call.defenders.map(
        (d, i) =>
          d.arrow && (
            <line
              key={`a-${i}`}
              x1={d.x}
              y1={d.y}
              x2={d.arrow.toX}
              y2={d.arrow.toY}
              stroke="var(--defense)"
              strokeWidth="0.7"
              strokeDasharray="1.5 1"
              markerEnd="url(#def-arrow)"
            />
          ),
      )}

      {/* Defenders (our team) */}
      {call.defenders.map((d, i) => (
        <g key={i}>
          <circle
            cx={d.x}
            cy={d.y}
            r="3.4"
            fill="var(--defense)"
            stroke="var(--field-deep)"
            strokeWidth="0.4"
          />
          <text
            x={d.x}
            y={d.y + 1}
            textAnchor="middle"
            fontSize={d.label.length > 2 ? 1.9 : 2.4}
            fill="#fff"
            fontWeight="800"
            fontFamily="var(--font-display)"
          >
            {d.label}
          </text>
        </g>
      ))}

      {/* Generic offense (them) */}
      {OFFENSE_X.map((x) => (
        <g key={x}>
          <circle
            cx={x}
            cy={LOS + 2.6}
            r="2.4"
            fill="none"
            stroke="var(--chalk)"
            strokeWidth="0.6"
            opacity="0.8"
          />
        </g>
      ))}
      <circle
        cx="50"
        cy={LOS + 8}
        r="2.6"
        fill="none"
        stroke="var(--chalk)"
        strokeWidth="0.6"
        opacity="0.8"
      />
      <text
        x="50"
        y={LOS + 9}
        textAnchor="middle"
        fontSize="2"
        fill="var(--chalk)"
        opacity="0.8"
        fontFamily="var(--font-display)"
      >
        QB
      </text>
    </svg>
  );
}
