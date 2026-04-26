import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CompanyCombobox } from '@/components/filters/company-combobox'
import { METRIC_META, type AgentQualityMetric } from '../types'

export interface AgentQualityAlertsFiltersState {
  status: 'open' | 'all'
  companyId: string | null
  metric: AgentQualityMetric | null
}

export interface AgentQualityAlertsFiltersProps {
  value: AgentQualityAlertsFiltersState
  onChange: (next: Partial<AgentQualityAlertsFiltersState>) => void
}

export function AgentQualityAlertsFilters({
  value,
  onChange,
}: AgentQualityAlertsFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="alerts-status" className="text-xs">
          Durum
        </Label>
        <Select
          value={value.status}
          onValueChange={(v) => onChange({ status: v as 'open' | 'all' })}
        >
          <SelectTrigger id="alerts-status" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Açık</SelectItem>
            <SelectItem value="all">Tümü</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Şirket</Label>
        <CompanyCombobox
          value={value.companyId}
          onChange={(companyId) => onChange({ companyId })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="alerts-metric" className="text-xs">
          Metric
        </Label>
        <Select
          value={value.metric ?? 'all'}
          onValueChange={(v) =>
            onChange({
              metric: v === 'all' ? null : (v as AgentQualityMetric),
            })
          }
        >
          <SelectTrigger id="alerts-metric" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {(
              Object.entries(METRIC_META) as [
                AgentQualityMetric,
                { label: string; tone: string }
              ][]
            ).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
