import { Building2 } from "lucide-react";
import { useMemo } from "react";
import { ValuePicker } from "./ValuePicker";
import {
  ALL_STUDIOS,
  studiosOf,
  type StudioFilter,
} from "@/domain/services/studio-filter";
import type { Title } from "@/domain/entities/title";

interface StudioPickerProps {
  titles: readonly Title[];
  value: StudioFilter;
  onChange: (next: StudioFilter) => void;
}

export function StudioPicker({ titles, value, onChange }: StudioPickerProps) {
  const options = useMemo(() => studiosOf(titles), [titles]);

  return (
    <ValuePicker
      icon={<Building2 className="size-3.5" />}
      title="Follow a studio"
      description="Everything outside it leaves the wall."
      placeholder="Any studio"
      searchPlaceholder="Search a studio…"
      options={options}
      value={value === ALL_STUDIOS ? null : value}
      onChange={(next) => onChange(next ?? ALL_STUDIOS)}
    />
  );
}
