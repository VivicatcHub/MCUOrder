import { Clapperboard } from "lucide-react";
import { SegmentedFilter } from "./SegmentedFilter";
import {
  TYPE_FILTERS,
  TYPE_FILTER_LABEL,
  TYPE_FILTER_TITLE,
  type TypeFilter,
} from "@/domain/services/type-filter";

interface TypeToggleProps {
  value: TypeFilter;
  onChange: (next: TypeFilter) => void;
}

export function TypeToggle({ value, onChange }: TypeToggleProps) {
  return (
    <SegmentedFilter
      label="Format"
      icon={<Clapperboard className="size-3.5" />}
      value={value}
      options={TYPE_FILTERS}
      labelFor={TYPE_FILTER_LABEL}
      titleFor={TYPE_FILTER_TITLE}
      neutral="all"
      onChange={onChange}
    />
  );
}
