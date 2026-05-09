import { useEffect, useMemo, useState } from "react";
import type { Play, ReceiverRoute, RouteType, DefenseType, PlayTag, PlayType } from "@/lib/types";
import { ALL_ROUTES, ALL_TAGS, RUN_ROUTES, ROUTE_LABELS, TAG_LABELS } from "@/lib/routes";

const RUN_SET = new Set<RouteType>(RUN_ROUTES);
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
import { FootballField } from "./FootballField";
import { saveCustomPlays, loadCustomPlays } from "@/lib/storage";
import { toast } from "sonner";

const SLOT_PRESETS = [
  { id: "r1", x: 12, y: 4, side: "left" as const },
  { id: "r2", x: 30, y: 4, side: "left" as const },
  { id: "r3", x: 50, y: 4, side: "right" as const },
  { id: "r4", x: 70, y: 4, side: "right" as const },
  { id: "r5", x: 88, y: 4, side: "right" as const },
];

interface Props {
  defense: DefenseType;
  initial?: Play | null;
  onSaved: () => void;
}

export function PlayBuilder({ defense, initial, onSaved }: Props) {
  // Seed from initial play if editing/duplicating
  const seed = useMemo(() => {
    if (!initial) {
      return {
        name: "",
        count: 5,
        positions: SLOT_PRESETS.map((p) => ({ x: p.x, y: p.y })),
        routes: ["go", "slant", "block", "out", "flat"] as RouteType[],
        runnerIdx: -1,
        centerIdx: 2,
        qb: { x: 50, y: 12 },
        purpose: "",
        keyRead: "",
        formation: "",
        notes: "",
        tags: [] as PlayTag[],
        playType: "pass" as PlayType,
        qbAction: "pass" as Play["qbAction"],
      };
    }
    const positions = SLOT_PRESETS.map((p) => ({ x: p.x, y: p.y }));
    const routes: RouteType[] = ["go", "slant", "block", "out", "flat"] as RouteType[];
    let runnerIdx = -1;
    let centerIdx = -1;
    initial.receivers.forEach((r, i) => {
      positions[i] = { x: r.x, y: r.y };
      routes[i] = r.route;
      if (r.isRunner) runnerIdx = i;
      if (r.isCenter) centerIdx = i;
    });
    return {
      name: initial.name,
      count: initial.receivers.length,
      positions,
      routes,
      runnerIdx,
      centerIdx,
      qb: initial.qb,
      purpose: initial.purpose,
      keyRead: initial.keyRead,
      formation: initial.formation,
      notes: initial.notes ?? "",
      tags: initial.tags ?? [],
      playType: initial.playType ?? "pass",
      qbAction: initial.qbAction ?? "pass",
    };
  }, [initial]);

  const [name, setName] = useState(seed.name);
  const [count, setCount] = useState(seed.count);
  const [routes, setRoutes] = useState<RouteType[]>(seed.routes);
  const [purpose, setPurpose] = useState(seed.purpose);
  const [keyRead, setKeyRead] = useState(seed.keyRead);
  const [formation, setFormation] = useState(seed.formation);
  const [notes, setNotes] = useState(seed.notes);
  const [tags, setTags] = useState<PlayTag[]>(seed.tags);
  const [positions, setPositions] = useState(seed.positions);
  const [qb, setQb] = useState(seed.qb);
  const [runnerIdx, setRunnerIdx] = useState(seed.runnerIdx);
  const [centerIdx, setCenterIdx] = useState(seed.centerIdx);
  const [playType, setPlayType] = useState<PlayType>(seed.playType);
  const [qbAction, setQbAction] = useState<Play["qbAction"]>(seed.qbAction);

  // Re-seed when switching plays in/out of editor
  useEffect(() => {
    setName(seed.name);
    setCount(seed.count);
    setRoutes(seed.routes);
    setPurpose(seed.purpose);
    setKeyRead(seed.keyRead);
    setFormation(seed.formation);
    setNotes(seed.notes);
    setTags(seed.tags);
    setPositions(seed.positions);
    setQb(seed.qb);
    setRunnerIdx(seed.runnerIdx);
    setCenterIdx(seed.centerIdx);
    setPlayType(seed.playType);
    setQbAction(seed.qbAction);
  }, [seed]);

  const receivers: ReceiverRoute[] = SLOT_PRESETS.slice(0, count).map((p, i) => {
    const pos = positions[i] ?? { x: p.x, y: p.y };
    const isRunner = playType === "run" && i === runnerIdx;
    const isCenter = i === centerIdx;
    let route = routes[i] ?? "hitch";
    // Force runner to a run route, non-runners shouldn't have run routes
    if (isRunner && !RUN_SET.has(route)) route = "sweep";
    if (!isRunner && RUN_SET.has(route)) route = "block";
    return {
      id: p.id,
      x: pos.x,
      y: pos.y,
      side: pos.x < 50 ? "left" : "right",
      route,
      isRunner: isRunner || undefined,
      isCenter: isCenter || undefined,
    };
  });

  const previewPlay: Play = {
    id: "preview",
    name: name || "New Play",
    defense,
    qb,
    receivers,
    purpose,
    formation: formation || `${count}-receiver`,
    keyRead,
    notes,
    tags,
    playType,
    qbAction,
  };

  const moveReceiver = (id: string, x: number, y: number) => {
    const idx = SLOT_PRESETS.findIndex((s) => s.id === id);
    if (idx < 0) return;
    setPositions((prev) => {
      const next = [...prev];
      next[idx] = { x, y };
      return next;
    });
  };

  const setRouteAt = (i: number, r: RouteType) => {
    const next = [...routes];
    next[i] = r;
    setRoutes(next);
  };

  const toggleTag = (t: PlayTag) => {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  const save = () => {
    if (!name.trim()) {
      toast.error("Name your play first");
      return;
    }
    if (playType === "run" && runnerIdx < 0 && qbAction === "pass") {
      toast.error("Pick a ball carrier (or set the QB to keep)");
      return;
    }
    const id = initial?.custom ? initial.id : `custom-${Date.now()}`;
    const play: Play = { ...previewPlay, id, name: name.trim(), custom: true };
    const customs = loadCustomPlays();
    const next = customs.some((c) => c.id === id)
      ? customs.map((c) => (c.id === id ? play : c))
      : [...customs, play];
    saveCustomPlays(next);
    toast.success(initial?.custom ? `Updated "${play.name}"` : `Saved "${play.name}"`);
    onSaved();
  };

  const availableRoutes: RouteType[] = ALL_ROUTES;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-2">
        <p className="text-[10px] uppercase tracking-widest text-primary font-display text-center mb-2">
          Drag receivers & QB · Pick routes below
        </p>
        <FootballField
          play={previewPlay}
          onReceiverMove={moveReceiver}
          onQbMove={(x, y) => setQb({ x, y })}
        />
      </div>
      <div className="space-y-3">
        <Input placeholder="Play name" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPlayType("pass")}
            className={`py-2 rounded-md font-display tracking-wide text-sm transition ${
              playType === "pass"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            PASS PLAY
          </button>
          <button
            onClick={() => setPlayType("run")}
            className={`py-2 rounded-md font-display tracking-wide text-sm transition ${
              playType === "run"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            RUN PLAY
          </button>
        </div>

        {playType === "run" && (
          <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-2">
            <div className="text-xs font-display tracking-wide text-primary">QB ACTION</div>
            <div className="grid grid-cols-4 gap-1">
              {(["pass", "keep-left", "keep-right", "scramble"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setQbAction(a)}
                  className={`text-[11px] py-1.5 rounded font-display tracking-wide ${
                    qbAction === a
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {a === "pass" ? "HANDOFF" : a.replace("-", " ").toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-display tracking-wide text-muted-foreground">PLAYERS</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                size="sm"
                variant={count === n ? "default" : "secondary"}
                onClick={() => setCount(n)}
                className="w-9 h-9 p-0"
              >
                {n}
              </Button>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground ml-1">+ QB = {count + 1}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: count }).map((_, i) => {
            const isRunner = playType === "run" && runnerIdx === i;
            const isCenter = centerIdx === i;
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs font-display text-muted-foreground">R{i + 1}</label>
                  <div className="flex gap-1">
                    {playType === "run" && (
                      <button
                        type="button"
                        onClick={() => setRunnerIdx(isRunner ? -1 : i)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-display tracking-wider ${
                          isRunner
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        BALL
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setCenterIdx(isCenter ? -1 : i)}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-display tracking-wider ${
                        isCenter
                          ? "bg-chalk text-field-deep bg-foreground text-background"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      C
                    </button>
                  </div>
                </div>
                <Select
                  value={routes[i] ?? "hitch"}
                  onValueChange={(v) => setRouteAt(i, v as RouteType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoutes.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROUTE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        <Input
          placeholder="Formation (e.g. Trips Right)"
          value={formation}
          onChange={(e) => setFormation(e.target.value)}
        />
        <Input
          placeholder="Purpose / strategy"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
        <Input
          placeholder="Key read (what to look for)"
          value={keyRead}
          onChange={(e) => setKeyRead(e.target.value)}
        />
        <Textarea
          placeholder="Coaching notes (shown in huddle)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div>
          <div className="text-xs font-display tracking-wide text-muted-foreground mb-1">TAGS</div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`text-[11px] px-2 py-1 rounded-full font-display tracking-wide transition ${
                  tags.includes(t)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {TAG_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={save} className="w-full" size="lg">
          {initial?.custom ? "Update Play" : "Save Play"}
        </Button>
      </div>
    </div>
  );
}
