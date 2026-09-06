import { Eye } from "lucide-react";
import { SegmentedFilter } from "./SegmentedFilter";
import {
  WATCHED_FILTERS,
  WATCHED_FILTER_LABEL,
  WATCHED_FILTER_TITLE,
  type WatchedFilter,
} from "@/domain/services/watched-filter";

interface WatchedToggleProps {
  value: WatchedFilter;
  onChange: (next: WatchedFilter) => void;
}

export function WatchedToggle({ value, onChange }: WatchedToggleProps) {
  return (
    <SegmentedFilter
      label="Status"
      icon={<Eye className="size-3.5" />}
      value={value}
      options={WATCHED_FILTERS}
      labelFor={WATCHED_FILTER_LABEL}
      titleFor={WATCHED_FILTER_TITLE}
      neutral="all"
      onChange={onChange}
    />
  );
}
