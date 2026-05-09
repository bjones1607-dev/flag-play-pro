import { useState } from "react";
import type { Play, ReceiverRoute, RouteType, DefenseType } from "@/lib/types";
import { ALL_ROUTES, ROUTE_LABELS } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FootballField } from "./FootballField";
import { saveCustomPlays, loadCustomPlays } from "@/lib/storage";
import { toast } from "sonner";

const SLOT_PRESETS = [
  { id: "r1", x: 12, y: 2, side: "left" as const },
  { id: "r2", x: 30, y: 2, side: "left" as const },
  { id: "r3", x: 50, y: 8, side: "right" as const },
  { id: "r4", x: 70, y: 2, side: "right" as const },
  { id: "r5", x: 88, y: 2, side: "right" as const },
];

interface Props {
  defense: DefenseType;
  onSaved: () => void;
}

export function PlayBuilder({ defense, onSaved }: Props) {
  const [name, setName] = useState("");
  const [count, setCount] = useState(5);
  const [routes, setRoutes] = useState<RouteType[]>(["go", "slant", "curl", "out", "flat"]);
  const [purpose, setPurpose] = useState("");
  const [positions, setPositions] = useState(SLOT_PRESETS.map((p) => ({ x: p.x, y: p.y })));
  const [qb, setQb] = useState({ x: 50, y: 12 });

  const receivers: ReceiverRoute[] = SLOT_PRESETS.slice(0, count).map((p, i) => ({
    id: p.id,
    x: positions[i]?.x ?? p.x,
    y: positions[i]?.y ?? p.y,
    side: (positions[i]?.x ?? p.x) < 50 ? "left" : "right",
    route: routes[i] ?? "hitch",
  }));

  const previewPlay: Play = {
    id: "preview", name: name || "New Play", defense,
    qb, receivers,
    purpose, formation: `${count}-receiver`, keyRead: "",
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
    const next = [...routes]; next[i] = r; setRoutes(next);
  };

  const save = () => {
    if (!name.trim()) { toast.error("Name your play first"); return; }
    const play: Play = { ...previewPlay, id: `custom-${Date.now()}`, name: name.trim(), custom: true };
    saveCustomPlays([...loadCustomPlays(), play]);
    toast.success(`Saved "${play.name}"`);
    setName(""); onSaved();
  };

  return (
    <div className="space-y-4">
      <FootballField play={previewPlay} />

      <div className="space-y-3">
        <Input placeholder="Play name" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="flex items-center gap-2">
          <span className="text-sm font-display tracking-wide text-muted-foreground">RECEIVERS</span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map((n) => (
              <Button key={n} size="sm" variant={count === n ? "default" : "secondary"}
                onClick={() => setCount(n)} className="w-9 h-9 p-0">{n}</Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-1">
              <label className="text-xs font-display text-muted-foreground">R{i+1}</label>
              <Select value={routes[i] ?? "hitch"} onValueChange={(v) => setRouteAt(i, v as RouteType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROUTES.map((r) => (
                    <SelectItem key={r} value={r}>{ROUTE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <Input placeholder="Purpose / strategy (optional)" value={purpose}
          onChange={(e) => setPurpose(e.target.value)} />

        <Button onClick={save} className="w-full" size="lg">Save Play</Button>
      </div>
    </div>
  );
}
