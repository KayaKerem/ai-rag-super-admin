import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { WINDOW_DAYS_OPTIONS, type WindowDaysOption } from '../types'

export interface AgentQualityFiltersProps {
  windowDays: WindowDaysOption
  onWindowDaysChange: (value: WindowDaysOption) => void
  showLowSignal: boolean
  onShowLowSignalChange: (value: boolean) => void
  tenantsBelowSignalThreshold: number
}

export function AgentQualityFilters({
  windowDays,
  onWindowDaysChange,
  showLowSignal,
  onShowLowSignalChange,
  tenantsBelowSignalThreshold,
}: AgentQualityFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="window-days" className="text-sm">
          Pencere
        </Label>
        <Select
          value={String(windowDays)}
          onValueChange={(v) =>
            onWindowDaysChange(Number(v) as WindowDaysOption)
          }
        >
          <SelectTrigger id="window-days" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOW_DAYS_OPTIONS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d} gün
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="show-low-signal"
          checked={showLowSignal}
          onCheckedChange={onShowLowSignalChange}
        />
        <Label htmlFor="show-low-signal" className="text-sm">
          Low-signal göster
          {tenantsBelowSignalThreshold > 0 &&
            ` (${tenantsBelowSignalThreshold})`}
        </Label>
      </div>
    </div>
  )
}
