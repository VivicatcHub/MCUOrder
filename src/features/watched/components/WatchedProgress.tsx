import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatched } from "../hooks/watched-context";

export function WatchedProgress({ total }: { total: number }) {
  const { count, clear } = useWatched();
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border bg-card/70 py-1.5 pl-3 pr-3.5 text-xs">
        <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-muted">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-watched transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </span>
        <span className="tabular-nums text-muted-foreground">
          <span className="font-medium text-watched">{count}</span> / {total}{" "}
          watched
        </span>
      </div>
      {count > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={clear}
          aria-label="Clear everything marked as watched"
          title="Clear watched list"
        >
          <Eraser className="size-4" />
        </Button>
      )}
    </div>
  );
}
