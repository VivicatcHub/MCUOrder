import type { ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/shared/lib/utils";

interface SegmentedFilterProps<T extends string> {
  label: string;
  icon: ReactNode;
  value: T;
  options: readonly T[];
  labelFor: Record<T, string>;
  titleFor: Record<T, string>;
  neutral: T;
  onChange: (next: T) => void;
}

export function SegmentedFilter<T extends string>({
  label,
  icon,
  value,
  options,
  labelFor,
  titleFor,
  neutral,
  onChange,
}: SegmentedFilterProps<T>) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border bg-card/70 py-1 pl-3 pr-1">
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium transition-colors",
          value === neutral ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </span>

      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => onChange((next as T) || neutral)}
        aria-label={label}
        className="gap-0.5"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option}
            value={option}
            title={titleFor[option]}
            aria-label={titleFor[option]}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium sm:h-7 sm:px-2.5",
              option === neutral
                ? "data-[state=on]:bg-muted data-[state=on]:text-muted-foreground"
                : "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
            )}
          >
            {labelFor[option]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
