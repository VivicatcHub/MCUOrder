import { LayoutGrid, GalleryVerticalEnd } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/shared/lib/utils";
import type { ViewMode } from "../hooks/useViewMode";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const board = mode === "board";

  return (
    <div className="hidden items-center gap-2.5 rounded-full border bg-card/70 py-1.5 pl-3 pr-3.5 md:flex">
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium transition-colors",
          board ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <LayoutGrid className="size-3.5" />
        Wall
      </span>
      <Switch
        checked={!board}
        onCheckedChange={(checked) => onChange(checked ? "reel" : "board")}
        aria-label="Switch between the wall and the scrolling reel"
      />
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium transition-colors",
          board ? "text-muted-foreground" : "text-foreground",
        )}
      >
        <GalleryVerticalEnd className="size-3.5" />
        Reel
      </span>
    </div>
  );
}
