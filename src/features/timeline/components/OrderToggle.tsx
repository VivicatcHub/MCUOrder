import { CalendarDays, History } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/shared/lib/utils";
import type { OrderMode } from "@/domain/entities/title";

interface OrderToggleProps {
  mode: OrderMode;
  onChange: (mode: OrderMode) => void;
}

export function OrderToggle({ mode, onChange }: OrderToggleProps) {
  const chronological = mode === "chronological";

  return (
    <div className="flex items-center gap-2.5 rounded-full border bg-card/70 py-1.5 pl-3 pr-3.5">
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium transition-colors",
          chronological ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <History className="size-3.5" />
        Lore
      </span>
      <Switch
        checked={!chronological}
        onCheckedChange={(checked) =>
          onChange(checked ? "release" : "chronological")
        }
        aria-label="Switch between lore chronology and release order"
      />
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium transition-colors",
          chronological ? "text-muted-foreground" : "text-foreground",
        )}
      >
        <CalendarDays className="size-3.5" />
        Release
      </span>
    </div>
  );
}
