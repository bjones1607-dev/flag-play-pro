import type { Situation } from "@/lib/storage";
import { maxDown, yardsToGo } from "@/lib/storage";
import type { PlayTag } from "@/lib/types";

interface Props {
  situation: Situation;
  onChange: (s: Situation) => void;
  activePreset: string | null;
  onPreset: (preset: string | null) => void;
}

// League: 50-yd field, 3 downs to midfield, then 4 downs to score.
export const SITUATION_PRESETS: Record<
  string,
  { label: string; tags: PlayTag[]; apply?: Partial<Situation> }
> = {
  "backed-up":   { label: "BACKED UP",     tags: ["short"],                apply: { yardLine: 5,  series: "to-mid",   down: 1 } },
  "midfield":    { label: "MIDFIELD PUSH", tags: ["deep"],                 apply: { yardLine: 22, series: "to-mid",   down: 3 } },
  "rz":          { label: "RED ZONE",      tags: ["redzone"],              apply: { yardLine: 40, series: "to-score", down: 1 } },
  "gl":          { label: "GOAL LINE",     tags: ["goalline"],             apply: { yardLine: 47, series: "to-score", down: 1 } },
  "must-convert":{ label: "MUST CONVERT",  tags: ["third-long", "deep"],   apply: { down: 3 } },
  "4th-go":      { label: "4TH & GO",      tags: ["deep", "trick"],        apply: { series: "to-score", down: 4 } },
};

export function SituationBar({ situation, onChange, activePreset, onPreset }: Props) {
  const setField = <K extends keyof Situation>(k: K, v: Situation[K]) =>
    onChange({ ...situation, [k]: v });

  const md = maxDown(situation);
  const togo = yardsToGo(situation);
  const downColor =
    situation.down >= md ? "bg-destructive text-destructive-foreground"
    : situation.down === md - 1 ? "bg-accent text-accent-foreground"
    : "bg-primary text-primary-foreground";

  const downLabels = situation.series === "to-mid" ? [1, 2, 3] : [1, 2, 3, 4];
  const objective = situation.series === "to-mid" ? "TO MIDFIELD" : "TO SCORE";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-stretch gap-2">
        {/* Series toggle */}
        <div className="flex items-center bg-secondary rounded-lg p-1 text-xs">
          <button
            onClick={() => onChange({ ...situation, series: "to-mid", down: 1 })}
            className={`px-3 h-9 rounded-md font-display tracking-wide ${
              situation.series === "to-mid" ? "bg-foreground text-background" : "text-muted-foreground"
            }`}
          >TO MID</button>
          <button
            onClick={() => onChange({ ...situation, series: "to-score", down: 1 })}
            className={`px-3 h-9 rounded-md font-display tracking-wide ${
              situation.series === "to-score" ? "bg-foreground text-background" : "text-muted-foreground"
            }`}
          >TO SCORE</button>
        </div>

        {/* Down */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {downLabels.map((d) => (
            <button
              key={d}
              onClick={() => setField("down", d as Situation["down"])}
              className={`w-9 h-9 rounded-md font-display text-lg ${
                situation.down === d ? downColor : "text-muted-foreground hover:bg-background/40"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Yard line */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg px-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">Ball on</span>
          <input
            type="number"
            min={1}
            max={49}
            value={situation.yardLine}
            onChange={(e) => setField("yardLine", Math.max(1, Math.min(49, +e.target.value || 5)))}
            className="w-12 bg-transparent font-display text-xl text-center outline-none"
          />
        </div>

        {/* To-go computed badge */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg px-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">Need</span>
          <span className="font-display text-xl text-primary">{togo}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">{objective}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg px-2 ml-auto">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">Us</span>
          <input
            type="number" min={0} value={situation.ourScore}
            onChange={(e) => setField("ourScore", Math.max(0, +e.target.value || 0))}
            className="w-12 bg-transparent font-display text-xl text-center outline-none text-primary"
          />
          <span className="text-muted-foreground">·</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">Them</span>
          <input
            type="number" min={0} value={situation.oppScore}
            onChange={(e) => setField("oppScore", Math.max(0, +e.target.value || 0))}
            className="w-12 bg-transparent font-display text-xl text-center outline-none"
          />
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {[1, 2, 3, 4].map((p) => (
            <button
              key={p}
              onClick={() => setField("period", p as Situation["period"])}
              className={`w-7 h-9 rounded-md font-display text-sm ${
                situation.period === p ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              Q{p}
            </button>
          ))}
        </div>
      </div>

      {/* Situation presets */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(SITUATION_PRESETS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => {
              if (activePreset === key) { onPreset(null); return; }
              onPreset(key);
              if (p.apply) onChange({ ...situation, ...p.apply });
            }}
            className={`text-[11px] px-2.5 py-1.5 rounded-full font-display tracking-wider transition ${
              activePreset === key
                ? "bg-primary text-primary-foreground shadow"
                : "bg-secondary text-muted-foreground hover:bg-secondary/70"
            }`}
          >
            {p.label}
          </button>
        ))}
        {activePreset && (
          <button
            onClick={() => onPreset(null)}
            className="text-[11px] px-2.5 py-1.5 rounded-full font-display tracking-wider bg-background border border-border text-muted-foreground"
          >
            CLEAR
          </button>
        )}
      </div>
    </div>
  );
}
