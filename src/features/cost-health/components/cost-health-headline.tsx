import { Loader2 } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CompanyCombobox } from '@/components/filters/company-combobox'
import { DateRangePicker } from '@/components/filters/date-range-picker'
import { formatCurrency } from '@/lib/utils'
import type { CostHealthFilters } from '../types'

export interface CostHealthHeadlineProps {
  total: number
  periodStart: string
  periodEnd: string
  filters: CostHealthFilters
  onFiltersChange: (next: Partial<CostHealthFilters>) => void
  isFetching: boolean
}

function formatPeriod(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const days = differenceInCalendarDays(end, start) // periodEnd exclusive → no +1
  const fmt = (d: Date) => format(d, 'd MMMM yyyy', { locale: tr })
  return `${fmt(start)} → ${fmt(end)} (${days} gün)`
}

export function CostHealthHeadline({
  total,
  periodStart,
  periodEnd,
  filters,
  onFiltersChange,
  isFetching,
}: CostHealthHeadlineProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {formatCurrency(total)}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {formatPeriod(periodStart, periodEnd)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isFetching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <CompanyCombobox
          value={filters.companyId}
          onChange={(companyId) => onFiltersChange({ companyId })}
        />
        <DateRangePicker
          preset={filters.preset}
          customRange={{ from: filters.from, to: filters.to }}
          onChange={(next) => onFiltersChange(next)}
        />
      </div>
    </div>
  )
}
