import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type DatePreset = '7d' | '30d' | '90d' | 'custom'

export interface DateRangePickerProps {
  preset: DatePreset
  customRange: { from: Date | null; to: Date | null }
  onChange: (next: {
    preset: DatePreset
    from: Date | null
    to: Date | null
  }) => void
}

const PRESET_LABELS: Record<Exclude<DatePreset, 'custom'>, string> = {
  '7d': '7 gün',
  '30d': '30 gün',
  '90d': '90 gün',
}

export function DateRangePicker({
  preset,
  customRange,
  onChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  function customLabel() {
    if (!customRange.from || !customRange.to) return 'Özel'
    const fmt = (d: Date) => format(d, 'd MMM', { locale: tr })
    return `${fmt(customRange.from)} → ${fmt(customRange.to)}`
  }

  return (
    <div className="flex items-center gap-1">
      {(['7d', '30d', '90d'] as const).map((p) => (
        <Button
          key={p}
          size="sm"
          variant={preset === p ? 'default' : 'outline'}
          onClick={() => onChange({ preset: p, from: null, to: null })}
        >
          {PRESET_LABELS[p]}
        </Button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              size="sm"
              variant={preset === 'custom' ? 'default' : 'outline'}
              className={cn('min-w-[80px]')}
            >
              <CalendarIcon className="mr-1 h-3.5 w-3.5" />
              {customLabel()}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="range"
            selected={{
              from: customRange.from ?? undefined,
              to: customRange.to ?? undefined,
            }}
            onSelect={(range) => {
              if (range?.from && range.to) {
                onChange({
                  preset: 'custom',
                  from: range.from,
                  to: range.to,
                })
                setOpen(false)
              }
            }}
            locale={tr}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
