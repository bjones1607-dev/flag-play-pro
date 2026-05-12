import type { Situation } from "@/lib/storage";
import type { PlayTag } from "@/lib/types";

interface Props {
  situation: Situation;
  onChange: (s: Situation) => void;
  activePreset: string | null;
  onPreset: (preset: string | null) => void;
}

export const SITUATION_PRESETS: Record<string, { label: string; tags: PlayTag[]; downHint?: string }> = {
  "rz": { label: "RED ZONE", tags: ["redzone"] },
  "gl": { label: "GOAL LINE", tags: ["goalline"] },
  "3rd-long": { label: "3RD & LONG", tags: ["third-long", "deep"], downHint: "3 8" },
  "3rd-short": { label: "3RD & SHORT", tags: ["short"], downHint: "3 2" },
  "4th": { label: "4TH DOWN", tags: ["deep", "trick"], downHint: "4 4" },
  "2-min": { label: "2-MINUTE", tags: ["short"] },
};

export function SituationBar({ situation, onChange, activePreset, onPreset }: Props) {
  const setField = <K extends keyof Situation>(k: K, v: Situation[K]) =>
    onChange({ ...situation, [k]: v });

  const downColor =
    situation.down >= 3 ? "bg-destructive text-destructive-foreground"
    : situation.down === 2 ? "bg-accent text-accent-foreground"
    : "bg-primary text-primary-foreground";

  return (
    <div className="space-y-2">
      {/* Down · Distance · Yard line */}
      <div className="flex flex-wrap items-stretch gap-2">
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {[1, 2, 3, 4].map((d) => (
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
        <div className="flex items-center gap-1 bg-secondary rounded-lg px-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">Dist</span>
          <input
            type="number"
            min={1}
            max={99}
            value={situation.dist}
            onChange={(e) => setField("dist", Math.max(1, +e.target.value || 1))}
            className="w-12 bg-transparent font-display text-xl text-center outline-none"
          />
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg px-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">Ball on</span>
          <input
            type="number"
            min={1}
            max={99}
            value={situation.yardLine}
            onChange={(e) => setField("yardLine", Math.max(1, Math.min(99, +e.target.value || 25)))}
            className="w-12 bg-transparent font-display text-xl text-center outline-none"
          />
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
              if (p.downHint) {
                const [d, dist] = p.downHint.split(" ").map(Number);
                setField("down", d as Situation["down"]);
                setField("dist", dist);
              }
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
