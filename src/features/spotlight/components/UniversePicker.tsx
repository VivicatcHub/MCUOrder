import { Globe } from "lucide-react";
import { useMemo } from "react";
import { ValuePicker } from "./ValuePicker";
import {
  ALL_UNIVERSES,
  universesOf,
  type UniverseFilter,
} from "@/domain/services/universe-filter";
import type { Title } from "@/domain/entities/title";

interface UniversePickerProps {
  titles: readonly Title[];
  value: UniverseFilter;
  onChange: (next: UniverseFilter) => void;
}

export function UniversePicker({
  titles,
  value,
  onChange,
}: UniversePickerProps) {
  const options = useMemo(() => universesOf(titles), [titles]);

  return (
    <ValuePicker
      icon={<Globe className="size-3.5" />}
      title="Follow a universe"
      description="Everything outside it leaves the wall."
      placeholder="Any universe"
      searchPlaceholder="Search a universe…"
      options={options}
      value={value === ALL_UNIVERSES ? null : value}
      onChange={(next) => onChange(next ?? ALL_UNIVERSES)}
    />
  );
}
