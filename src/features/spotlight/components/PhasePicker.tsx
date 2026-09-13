import { Layers } from "lucide-react";
import { useMemo } from "react";
import { ValuePicker } from "./ValuePicker";
import {
  ALL_PHASES,
  phasesOf,
  type PhaseFilter,
} from "@/domain/services/phase-filter";
import type { Title } from "@/domain/entities/title";

interface PhasePickerProps {
  titles: readonly Title[];
  value: PhaseFilter;
  onChange: (next: PhaseFilter) => void;
}

export function PhasePicker({ titles, value, onChange }: PhasePickerProps) {
  const options = useMemo(() => phasesOf(titles), [titles]);

  return (
    <ValuePicker
      icon={<Layers className="size-3.5" />}
      title="Follow a phase"
      description="Everything outside it leaves the wall."
      placeholder="Any phase"
      searchPlaceholder="Search a phase…"
      options={options}
      value={value === ALL_PHASES ? null : value}
      onChange={(next) => onChange(next ?? ALL_PHASES)}
    />
  );
}
