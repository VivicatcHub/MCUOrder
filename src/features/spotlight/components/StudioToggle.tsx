import { Building2 } from 'lucide-react'
import { SegmentedFilter } from './SegmentedFilter'
import {
  STUDIO_FILTERS,
  STUDIO_FILTER_LABEL,
  STUDIO_FILTER_TITLE,
  type StudioFilter,
} from '@/domain/services/studio-filter'

interface StudioToggleProps {
  value: StudioFilter
  onChange: (next: StudioFilter) => void
}

export function StudioToggle({ value, onChange }: StudioToggleProps) {
  return (
    <SegmentedFilter
      label="Studio"
      icon={<Building2 className="size-3.5" />}
      value={value}
      options={STUDIO_FILTERS}
      labelFor={STUDIO_FILTER_LABEL}
      titleFor={STUDIO_FILTER_TITLE}
      neutral="all"
      onChange={onChange}
    />
  )
}
