import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { Play, Player, PlayerAssignment, RouteType } from "@/lib/types";
import { defensePositions } from "@/lib/plays";

function useAnimationProgress(active: boolean, durationMs: number, key?: number | string) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) {
      setT(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      setT(progress);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, durationMs, key]);
  return t;
}

interface AnimatedRouteProps {
  d: string;
  color: string;
  isRunner: boolean;
  t: number;
  enabled: boolean;
  start: [number, number];
  dotR: number;
  isCenter: boolean;
  label: string;
  labelSize: number;
  showLabels: boolean;
  arrowMarker: string;
  routeLabel: string;
  routeLabelEnd: [number, number];
  routeLabelSize: number;
}

function AnimatedRoute({
  d,
  color,
  isRunner,
  t,
  enabled,
  start,
  dotR,
  isCenter,
  label,
  labelSize,
  showLabels,
  arrowMarker,
  routeLabel,
  routeLabelEnd,
  routeLabelSize,
}: AnimatedRouteProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  useLayoutEffect(() => {
    if (pathRef.current) {
      setLen(pathRef.current.getTotalLength());
    }
  }, [d]);

  // Compute the moving dot position when animating.
  let dotX = start[0];
  let dotY = start[1];
  if (enabled && len > 0 && pathRef.current) {
    const p = pathRef.current.getPointAtLength(t * len);
    dotX = p.x;
    dotY = p.y;
  }

  const labelY = routeLabelEnd[1] < 8 ? routeLabelEnd[1] + 4 : routeLabelEnd[1] - 1.8;

  return (
    <>
      <path
        ref={pathRef}
        d={d}
        stroke={isRunner ? "var(--primary)" : color}
        strokeWidth={isRunner ? 1.2 : 0.8}
        strokeDasharray={enabled && len > 0 ? `${len}` : isRunner ? "2 0.8" : undefined}
        strokeDashoffset={enabled && len > 0 ? len * (1 - t) : undefined}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={enabled && t < 0.95 ? undefined : arrowMarker}
        style={{ transition: enabled ? "none" : undefined }}
      />
      <circle
        cx={dotX}
        cy={dotY}
        r={dotR}
        fill={isCenter ? "var(--chalk)" : isRunner ? "var(--primary)" : color}
        stroke="var(--field-deep)"
        strokeWidth={isCenter ? 0.6 : 0.3}
      />
      {showLabels && (
        <text
          x={dotX}
          y={dotY + 1}
          textAnchor="middle"
          fontSize={labelSize}
          fill="#0a1a0e"
          fontWeight="800"
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
      )}
      {showLabels && !enabled && (
        <text
          x={routeLabelEnd[0]}
          y={labelY}
          textAnchor="middle"
          fontSize={routeLabelSize}
          fill={isRunner ? "var(--primary)" : color}
          fontWeight="800"
          style={{
            paintOrder: "stroke",
            stroke: "rgba(0,0,0,0.6)",
            strokeWidth: 0.5,
            pointerEvents: "none",
          }}
          fontFamily="var(--font-display)"
        >
          {routeLabel}
        </text>
      )}
    </>
  );
}

const ROUTE_COLORS = [
  "var(--route-1)",
  "var(--route-2)",
  "var(--route-3)",
  "var(--route-4)",
  "var(--route-5)",
];

// Coordinate system:
// SVG viewBox 100 wide x 100 tall.
// LOS at svgY = 70. Downfield = smaller y (toward 0). Behind LOS = larger y (toward 100).
// 1 yard ~ 0.7 svg units downfield.
const LOS = 70;
const SCALE = 0.7;

interface Props {
  play: Play;
  assignment?: PlayerAssignment;
  players?: Player[];
  showLabels?: boolean;
  big?: boolean; // larger labels/markers for huddle mode
  mirror?: boolean; // flip play left/right
  animate?: boolean; // animate routes from start to finish
  animationKey?: number | string; // change to restart animation
  animationMs?: number; // duration in ms
  onReceiverMove?: (id: string, x: number, y: number) => void;
  onQbMove?: (x: number, y: number) => void;
}

function mirrorPlay(p: Play): Play {
  const flipSide = (s?: "left" | "right") => (s === "left" ? "right" : s === "right" ? "left" : s);
  return {
    ...p,
    qb: { ...p.qb, x: 100 - p.qb.x },
    qbAction:
      p.qbAction === "keep-left"
        ? "keep-right"
        : p.qbAction === "keep-right"
          ? "keep-left"
          : p.qbAction,
    motion: p.motion ? { ...p.motion, toX: 100 - p.motion.toX } : undefined,
    receivers: p.receivers.map((r) => ({
      ...r,
      x: 100 - r.x,
      side: flipSide(r.side),
    })),
  };
}

export interface FootballFieldHandle {
  svg: () => SVGSVGElement | null;
}

const RUN_ROUTES = new Set<RouteType>(["dive", "sweep", "counter"]);

function routeSvgPoints(
  route: RouteType,
  sx: number,
  sBehindLOS: number,
  side: "left" | "right",
): Array<[number, number]> {
  const startY = LOS + sBehindLOS * 0.4;
  const sgn = side === "right" ? 1 : -1;
  const pts: Array<[number, number]> = [[sx, startY]];

  const downfield = (yards: number) => -yards * SCALE;
  const lateral = (yards: number) => yards;

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
    case "drag":
      move(lateral(-sgn * 32), downfield(4));
      break;
    case "delay":
      // 1-count pause then a 5-yard out — eligible center release
      move(0, downfield(2));
      move(lateral(sgn * 14), downfield(4));
      break;
    case "pop":
      // Quick pop pass: 4 yards straight up the seam
      move(0, downfield(8));
      break;
    case "seam":
      // Vertical up the middle seam
      move(0, downfield(40));
      break;
    case "swing":
      move(lateral(sgn * 18), downfield(-2));
      break;
    case "wheel":
      move(lateral(sgn * 14), downfield(2));
      move(lateral(sgn * 6), downfield(28));
      break;
    case "block":
      // No real path; drawn separately as a block mark
      move(0, 0);
      break;
    case "dive":
      move(0, downfield(14));
      break;
    case "sweep":
      move(lateral(sgn * 22), downfield(2));
      move(lateral(sgn * 6), downfield(20));
      break;
    case "counter":
      move(lateral(-sgn * 4), downfield(2));
      move(lateral(sgn * 22), downfield(4));
      move(lateral(sgn * 4), downfield(20));
      break;
  }
  return pts;
}

export const FootballField = forwardRef<FootballFieldHandle, Props>(function FootballField(
  {
    play: rawPlay,
    assignment = {},
    players = [],
    showLabels = true,
    big = false,
    mirror = false,
    animate = false,
    animationKey,
    animationMs = 3000,
    onReceiverMove,
    onQbMove,
  },
  ref,
) {
  const play = mirror ? mirrorPlay(rawPlay) : rawPlay;
  const animT = useAnimationProgress(animate, animationMs, animationKey);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<string | null>(null);
  const draggable = !!onReceiverMove || !!onQbMove;

  useImperativeHandle(ref, () => ({ svg: () => svgRef.current }));

  const playerLabel = (slotId: string) => {
    const pid = assignment[slotId];
    if (!pid) return "";
    const p = players.find((x) => x.id === pid);
    return p ? p.number : "";
  };

  const defenders = defensePositions(play.defense);
  const isRun = play.playType === "run";

  const toSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const startDrag = (id: string) => (e: React.PointerEvent) => {
    if (!draggable) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    draggingRef.current = id;
  };

  const handleMove = (e: React.PointerEvent) => {
    const id = draggingRef.current;
    if (!id) return;
    const { x, y } = toSvgCoords(e.clientX, e.clientY);
    const cx = Math.max(4, Math.min(96, x));
    if (id === "qb") {
      const depth = Math.max(0, Math.min(28, (y - LOS) / 0.5));
      onQbMove?.(cx, depth);
    } else {
      const depth = Math.max(0, Math.min(20, (y - LOS) / 0.4));
      onReceiverMove?.(id, cx, depth);
    }
  };

  const endDrag = () => {
    draggingRef.current = null;
  };

  // QB run path (for keep / scramble / draw)
  const qbX = play.qb.x;
  const qbY = LOS + play.qb.y * 0.5;
  const qbRunPath: Array<[number, number]> | null = (() => {
    if (!isRun) return null;
    const a = play.qbAction;
    if (a === "keep-left") {
      return [
        [qbX, qbY],
        [qbX - 18, qbY - 4],
        [qbX - 24, qbY - 22],
      ];
    }
    if (a === "keep-right") {
      return [
        [qbX, qbY],
        [qbX + 18, qbY - 4],
        [qbX + 24, qbY - 22],
      ];
    }
    if (a === "scramble") {
      return [
        [qbX, qbY],
        [qbX, qbY - 18],
      ];
    }
    return null;
  })();

  // Handoff: from QB to runner if a runner exists and QB isn't running
  const runner = play.receivers.find((r) => r.isRunner);
  const handoff: Array<[number, number]> | null =
    isRun && runner && !qbRunPath
      ? [
          [qbX, qbY],
          [runner.x, LOS + runner.y * 0.4],
        ]
      : null;

  const labelSize = big ? 3.4 : 2.4;
  const dotR = big ? 4.0 : draggable ? 3.6 : 2.8;
  const qbR = big ? 4.4 : draggable ? 3.8 : 3.2;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className="w-full h-auto rounded-xl shadow-2xl select-none"
      style={{ background: "var(--field)", touchAction: draggable ? "none" : "auto" }}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={draggable ? handleMove : undefined}
      onPointerUp={draggable ? endDrag : undefined}
      onPointerCancel={draggable ? endDrag : undefined}
    >
      <defs>
        {ROUTE_COLORS.map((c, i) => (
          <marker
            key={i}
            id={`arrow-${i}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
          </marker>
        ))}
        <marker
          id="run-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" />
        </marker>
        <marker
          id="motion-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--chalk)" />
        </marker>
        <marker
          id="handoff-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="3.5"
          markerHeight="3.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--qb)" />
        </marker>
      </defs>

      {/* End zone */}
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
        END ZONE
      </text>

      {/* Yard lines (every ~10 yds: 7 svg units) */}
      {[63, 56, 49, 42, 35, 28, 21].map((y, i) => {
        const yds = (i + 1) * 10;
        return (
          <g key={y}>
            <line
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="var(--chalk)"
              strokeWidth="0.18"
              opacity="0.28"
            />
            {/* hash marks - inside */}
            <line
              x1="36"
              y1={y - 0.4}
              x2="36"
              y2={y + 0.4}
              stroke="var(--chalk)"
              strokeWidth="0.25"
              opacity="0.5"
            />
            <line
              x1="64"
              y1={y - 0.4}
              x2="64"
              y2={y + 0.4}
              stroke="var(--chalk)"
              strokeWidth="0.25"
              opacity="0.5"
            />
            <text
              x="6"
              y={y - 0.6}
              fontSize="2"
              fill="var(--chalk)"
              opacity="0.45"
              fontFamily="var(--font-display)"
            >
              {yds}
            </text>
            <text
              x="94"
              y={y - 0.6}
              fontSize="2"
              fill="var(--chalk)"
              opacity="0.45"
              fontFamily="var(--font-display)"
              textAnchor="end"
            >
              {yds}
            </text>
          </g>
        );
      })}

      {/* Sidelines */}
      <line x1="1" y1="0" x2="1" y2="100" stroke="var(--chalk)" strokeWidth="0.4" opacity="0.7" />
      <line x1="99" y1="0" x2="99" y2="100" stroke="var(--chalk)" strokeWidth="0.4" opacity="0.7" />

      {/* Line of scrimmage */}
      <line x1="0" y1={LOS} x2="100" y2={LOS} stroke="var(--chalk)" strokeWidth="0.6" />
      <text
        x="3"
        y={LOS - 1}
        fontSize="2.2"
        fill="var(--chalk)"
        opacity="0.6"
        fontFamily="var(--font-display)"
      >
        LOS
      </text>

      {/* Defenders */}
      {defenders.map((d, i) => (
        <g key={i}>
          <line
            x1={d.x - 1.6}
            y1={d.y - 1.6}
            x2={d.x + 1.6}
            y2={d.y + 1.6}
            stroke="var(--defense)"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <line
            x1={d.x - 1.6}
            y1={d.y + 1.6}
            x2={d.x + 1.6}
            y2={d.y - 1.6}
            stroke="var(--defense)"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <text
            x={d.x}
            y={d.y + 4.2}
            fontSize="1.8"
            fill="var(--defense)"
            opacity="0.85"
            textAnchor="middle"
            fontFamily="var(--font-display)"
          >
            {d.label}
          </text>
        </g>
      ))}

      {/* Motion arrow */}
      {play.motion &&
        (() => {
          const r = play.receivers.find((x) => x.id === play.motion!.receiverId);
          if (!r) return null;
          const fromX = r.x,
            fromY = LOS + r.y * 0.4;
          const toX = play.motion!.toX,
            toY = LOS + play.motion!.toY * 0.4;
          const midX = (fromX + toX) / 2,
            midY = Math.min(fromY, toY) - 2.5;
          return (
            <path
              d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
              fill="none"
              stroke="var(--chalk)"
              strokeWidth="0.5"
              strokeDasharray="1.2 1"
              opacity="0.85"
              markerEnd="url(#motion-arrow)"
            />
          );
        })()}

      {/* Receiver routes */}
      {play.receivers.map((r, i) => {
        const color = ROUTE_COLORS[i % 5];
        const isRunner = !!r.isRunner;
        const isBlock = r.route === "block";
        const start: [number, number] = [r.x, LOS + r.y * 0.4];

        // Block mark: small wedge in front of player
        if (isBlock) {
          return (
            <g key={r.id}>
              <line
                x1={start[0] - 2}
                y1={start[1] - 1.5}
                x2={start[0] + 2}
                y2={start[1] - 1.5}
                stroke="var(--chalk)"
                strokeWidth="0.7"
                opacity="0.85"
                strokeLinecap="round"
              />
              <circle
                cx={start[0]}
                cy={start[1]}
                r={dotR}
                fill={r.isCenter ? "var(--chalk)" : color}
                stroke="var(--field-deep)"
                strokeWidth={r.isCenter ? 0.6 : 0.3}
                style={{ cursor: draggable ? "grab" : "default" }}
                onPointerDown={startDrag(r.id)}
              />
              {showLabels && (
                <text
                  x={start[0]}
                  y={start[1] + 1}
                  textAnchor="middle"
                  fontSize={labelSize}
                  fill="#0a1a0e"
                  fontWeight="800"
                  style={{ pointerEvents: "none" }}
                >
                  {playerLabel(r.id) || (r.isCenter ? "C" : i + 1)}
                </text>
              )}
            </g>
          );
        }

        const pts = routeSvgPoints(r.route, r.x, r.y, r.side ?? "right");
        const d = pts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
        const end = pts[pts.length - 1];
        const arrowMarker = isRunner ? "url(#run-arrow)" : `url(#arrow-${i % 5})`;
        const label = playerLabel(r.id) || (r.isCenter ? "C" : String(i + 1));

        return (
          <g
            key={r.id}
            style={{ cursor: draggable ? "grab" : "default" }}
            onPointerDown={draggable ? startDrag(r.id) : undefined}
          >
            <AnimatedRoute
              d={d}
              color={color}
              isRunner={isRunner}
              t={animT}
              enabled={animate}
              start={start}
              dotR={dotR}
              isCenter={!!r.isCenter}
              label={label}
              labelSize={labelSize}
              showLabels={showLabels}
              arrowMarker={arrowMarker}
              routeLabel={r.route.toUpperCase()}
              routeLabelEnd={[end[0], end[1]]}
              routeLabelSize={isRunner ? (big ? 3.2 : 2.6) : big ? 2.8 : 2.2}
            />
          </g>
        );
      })}

      {/* Handoff dotted line from QB to runner */}
      {handoff && (
        <line
          x1={handoff[0][0]}
          y1={handoff[0][1]}
          x2={handoff[1][0]}
          y2={handoff[1][1]}
          stroke="var(--qb)"
          strokeWidth="0.5"
          strokeDasharray="0.8 0.8"
          opacity="0.85"
          markerEnd="url(#handoff-arrow)"
        />
      )}

      {/* QB run path */}
      {qbRunPath && (
        <path
          d={qbRunPath.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.2"
          strokeDasharray="2 0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd="url(#run-arrow)"
        />
      )}

      {/* QB */}
      <circle
        cx={qbX}
        cy={qbY}
        r={qbR}
        fill="var(--qb)"
        stroke="var(--field-deep)"
        strokeWidth="0.4"
        style={{ cursor: draggable ? "grab" : "default" }}
        onPointerDown={startDrag("qb")}
      />
      <text
        x={qbX}
        y={qbY + 1.1}
        textAnchor="middle"
        fontSize={big ? 3.4 : 2.6}
        fill="var(--field-deep)"
        fontWeight="800"
        style={{ pointerEvents: "none" }}
      >
        {playerLabel("qb") || "QB"}
      </text>
    </svg>
  );
});
