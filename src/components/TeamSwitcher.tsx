import { useState } from "react";
import type { Team } from "@/lib/types";
import { useTeams } from "@/hooks/use-storage";
import { deleteTeam } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export function TeamSwitcher() {
  const { teams, activeId, active, setActive, setTeams } = useTeams();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");

  const create = () => {
    if (!name.trim()) return;
    const t: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: name.trim(),
      ageGroup: ageGroup.trim() || undefined,
      createdAt: Date.now(),
    };
    setTeams([...teams, t]);
    setActive(t.id);
    setName("");
    setAgeGroup("");
    setCreating(false);
    toast.success(`Switched to "${t.name}"`);
  };

  const remove = (t: Team) => {
    if (teams.length <= 1) {
      toast.error("Can't delete your only team");
      return;
    }
    if (!confirm(`Delete "${t.name}" and all its data?`)) return;
    deleteTeam(t.id);
    if (t.id === activeId) {
      const fallback = teams.find((x) => x.id !== t.id);
      if (fallback) setActive(fallback.id);
    }
    toast.success(`Deleted "${t.name}"`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2 -ml-1 max-w-[180px]"
            aria-label="Switch team"
          >
            <span className="font-display tracking-wide truncate text-base">
              {active?.name?.toUpperCase() || "TEAM"}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          <DropdownMenuLabel>Your Teams</DropdownMenuLabel>
          {teams.map((t) => (
            <DropdownMenuItem
              key={t.id}
              className="flex items-center gap-2"
              onSelect={() => setActive(t.id)}
            >
              <Check
                className={`h-4 w-4 ${t.id === activeId ? "opacity-100 text-primary" : "opacity-0"}`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.name}</div>
                {t.ageGroup && (
                  <div className="text-[10px] text-muted-foreground">{t.ageGroup}</div>
                )}
              </div>
              {teams.length > 1 && (
                <Trash2
                  className="h-3 w-3 text-destructive opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(t);
                  }}
                />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Team name (e.g. Lions, Mighty Ducks)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <Input
              placeholder="Age group (optional, e.g. U10)"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <p className="text-xs text-muted-foreground">
              Each team has its own roster, plays, favorites, game state, and practices.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={create}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
