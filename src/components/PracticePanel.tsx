import { useState } from "react";
import type { Play, PracticeBlock, PracticePlan } from "@/lib/types";
import { usePractices } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Clock,
  GripVertical,
  Copy as CopyIcon,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  allPlays: Play[];
}

const newId = () => `pp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const TEMPLATES: Record<string, PracticeBlock[]> = {
  "60-min Standard": [
    {
      id: newId(),
      name: "Warm-up & Stretch",
      minutes: 5,
      notes: "Dynamic stretches, light routes",
      playIds: [],
    },
    {
      id: newId(),
      name: "Individual Routes",
      minutes: 10,
      notes: "Cone drills: slants, outs, posts",
      playIds: [],
    },
    {
      id: newId(),
      name: "Pass Install",
      minutes: 15,
      notes: "Walk through 3 pass concepts",
      playIds: [],
    },
    {
      id: newId(),
      name: "Run Install",
      minutes: 10,
      notes: "Walk through 2 run concepts",
      playIds: [],
    },
    {
      id: newId(),
      name: "7-on-7 / Team",
      minutes: 15,
      notes: "Full speed vs. scout team",
      playIds: [],
    },
    { id: newId(), name: "Cool Down", minutes: 5, notes: "Stretch, talk", playIds: [] },
  ],
  "45-min Midweek": [
    { id: newId(), name: "Warm-up", minutes: 5, notes: "", playIds: [] },
    {
      id: newId(),
      name: "Pass Install",
      minutes: 10,
      notes: "Top 3 pass plays for game day",
      playIds: [],
    },
    { id: newId(), name: "Run Install", minutes: 10, notes: "Sweep + dive", playIds: [] },
    { id: newId(), name: "Team Period", minutes: 15, notes: "Live", playIds: [] },
    { id: newId(), name: "Cool Down", minutes: 5, notes: "", playIds: [] },
  ],
  "Game-Day Walkthrough": [
    { id: newId(), name: "Stretch", minutes: 5, notes: "", playIds: [] },
    { id: newId(), name: "Script Review", minutes: 10, notes: "Walk through openers", playIds: [] },
    {
      id: newId(),
      name: "Red Zone",
      minutes: 10,
      notes: "Goal-line + redzone packages",
      playIds: [],
    },
    { id: newId(), name: "Final Talk", minutes: 5, notes: "Energy + assignments", playIds: [] },
  ],
};

export function PracticePanel({ allPlays }: Props) {
  const { plans, set } = usePractices();
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);

  const open = openPlanId ? plans.find((p) => p.id === openPlanId) : null;

  const newFromTemplate = (templateName: string) => {
    const blocks = TEMPLATES[templateName].map((b) => ({
      ...b,
      id: newId(),
      playIds: [...b.playIds],
    }));
    const plan: PracticePlan = {
      id: newId(),
      name: templateName,
      date: new Date().toISOString().slice(0, 10),
      blocks,
    };
    set([plan, ...plans]);
    setOpenPlanId(plan.id);
  };

  const newBlank = () => {
    const plan: PracticePlan = {
      id: newId(),
      name: "New Practice",
      date: new Date().toISOString().slice(0, 10),
      blocks: [],
    };
    set([plan, ...plans]);
    setOpenPlanId(plan.id);
  };

  const updatePlan = (next: PracticePlan) => set(plans.map((p) => (p.id === next.id ? next : p)));
  const removePlan = (id: string) => {
    set(plans.filter((p) => p.id !== id));
    if (openPlanId === id) setOpenPlanId(null);
  };
  const dupPlan = (p: PracticePlan) => {
    const copy: PracticePlan = {
      ...p,
      id: newId(),
      name: `${p.name} (copy)`,
      blocks: p.blocks.map((b) => ({ ...b, id: newId() })),
    };
    set([copy, ...plans]);
    toast.success("Practice duplicated");
  };

  if (open) {
    return (
      <PracticeEditor
        plan={open}
        allPlays={allPlays}
        onChange={updatePlan}
        onBack={() => setOpenPlanId(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" onClick={newBlank}>
          <Plus className="h-4 w-4 mr-1" /> Blank
        </Button>
        <Button size="sm" variant="secondary" onClick={() => newFromTemplate("60-min Standard")}>
          From Template
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
          Quick Templates
        </p>
        {Object.keys(TEMPLATES).map((t) => (
          <Button
            key={t}
            size="sm"
            variant="ghost"
            className="justify-start"
            onClick={() => newFromTemplate(t)}
          >
            <Plus className="h-3 w-3 mr-1.5" /> {t}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
          Saved Practices ({plans.length})
        </p>
        {plans.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No practice plans yet. Pick a template above to start.
          </p>
        )}
        {plans.map((p) => {
          const total = p.blocks.reduce((acc, b) => acc + b.minutes, 0);
          return (
            <div key={p.id} className="bg-secondary rounded-lg p-2.5 flex items-center gap-2">
              <button onClick={() => setOpenPlanId(p.id)} className="flex-1 text-left">
                <div className="font-display text-base leading-none">{p.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  {p.date && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> {p.date}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {total} min
                  </span>
                  <span>{p.blocks.length} blocks</span>
                </div>
              </button>
              <Button size="icon" variant="ghost" onClick={() => dupPlan(p)} aria-label="Duplicate">
                <CopyIcon className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removePlan(p.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PracticeEditor({
  plan,
  allPlays,
  onChange,
  onBack,
}: {
  plan: PracticePlan;
  allPlays: Play[];
  onChange: (p: PracticePlan) => void;
  onBack: () => void;
}) {
  const total = plan.blocks.reduce((a, b) => a + b.minutes, 0);

  const addBlock = () =>
    onChange({
      ...plan,
      blocks: [
        ...plan.blocks,
        { id: newId(), name: "New Block", minutes: 10, notes: "", playIds: [] },
      ],
    });

  const updateBlock = (id: string, patch: Partial<PracticeBlock>) =>
    onChange({
      ...plan,
      blocks: plan.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });

  const removeBlock = (id: string) =>
    onChange({ ...plan, blocks: plan.blocks.filter((b) => b.id !== id) });

  const moveBlock = (id: string, dir: -1 | 1) => {
    const i = plan.blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= plan.blocks.length) return;
    const next = [...plan.blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...plan, blocks: next });
  };

  return (
    <div className="space-y-3">
      <Button size="sm" variant="ghost" onClick={onBack} className="-ml-2">
        <ChevronLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid grid-cols-[1fr_140px] gap-2">
        <Input
          value={plan.name}
          onChange={(e) => onChange({ ...plan, name: e.target.value })}
          placeholder="Practice name"
        />
        <Input
          type="date"
          value={plan.date ?? ""}
          onChange={(e) => onChange({ ...plan, date: e.target.value })}
        />
      </div>

      <div className="text-[11px] text-muted-foreground flex items-center justify-between">
        <span>
          {plan.blocks.length} blocks · {total} min total
        </span>
        <Button size="sm" variant="ghost" onClick={addBlock}>
          <Plus className="h-3 w-3 mr-1" /> Add Block
        </Button>
      </div>

      <div className="space-y-2">
        {plan.blocks.map((b, i) => (
          <div key={b.id} className="bg-card rounded-lg p-2.5 border border-border space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveBlock(b.id, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground disabled:opacity-30 text-xs"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveBlock(b.id, 1)}
                  disabled={i === plan.blocks.length - 1}
                  className="text-muted-foreground disabled:opacity-30 text-xs"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Input
                value={b.name}
                onChange={(e) => updateBlock(b.id, { name: e.target.value })}
                className="flex-1"
                placeholder="Block name"
              />
              <Input
                type="number"
                value={b.minutes}
                onChange={(e) =>
                  updateBlock(b.id, { minutes: Math.max(0, Number(e.target.value) || 0) })
                }
                className="w-16 text-center"
                min={0}
              />
              <span className="text-[10px] text-muted-foreground font-display">MIN</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeBlock(b.id)}
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Textarea
              value={b.notes}
              onChange={(e) => updateBlock(b.id, { notes: e.target.value })}
              rows={2}
              placeholder="Notes / coaching points"
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
                  Plays to drill ({b.playIds.length})
                </p>
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (!v) return;
                    if (b.playIds.includes(v)) return;
                    updateBlock(b.id, { playIds: [...b.playIds, v] });
                  }}
                >
                  <SelectTrigger className="h-7 w-[180px] text-xs">
                    <SelectValue placeholder="+ Add play" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPlays.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-1">
                {b.playIds.length === 0 && (
                  <span className="text-[11px] text-muted-foreground">No plays attached</span>
                )}
                {b.playIds.map((pid) => {
                  const p = allPlays.find((x) => x.id === pid);
                  if (!p) return null;
                  return (
                    <button
                      key={pid}
                      onClick={() =>
                        updateBlock(b.id, { playIds: b.playIds.filter((x) => x !== pid) })
                      }
                      className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition"
                    >
                      {p.name} ✕
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        {plan.blocks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No blocks yet. Tap "Add Block" to get started.
          </p>
        )}
      </div>
    </div>
  );
}
