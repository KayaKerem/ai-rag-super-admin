import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ConfigBlockKey } from '@/lib/validations'

export interface DaySchedule {
  start: string
  end: string
}

export interface WorkingHoursConfig {
  enabled?: boolean
  timezone?: string
  schedule?: Record<string, DaySchedule | null>
  outsideHoursMessage?: string
}

const dayLabels: Record<string, string> = {
  '1': 'Pazartesi',
  '2': 'Salı',
  '3': 'Çarşamba',
  '4': 'Perşembe',
  '5': 'Cuma',
  '6': 'Cumartesi',
  '0': 'Pazar',
}

const dayOrder = ['1', '2', '3', '4', '5', '6', '0']

const defaultSchedule: Record<string, DaySchedule | null> = {
  '0': null,
  '1': { start: '09:00', end: '18:00' },
  '2': { start: '09:00', end: '18:00' },
  '3': { start: '09:00', end: '18:00' },
  '4': { start: '09:00', end: '18:00' },
  '5': { start: '09:00', end: '18:00' },
  '6': null,
}

const timezones = [
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Tokyo',
  'UTC',
]

interface WorkingHoursFormProps {
  currentValues: WorkingHoursConfig | undefined
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function WorkingHoursForm({ currentValues, onSave, isSaving }: WorkingHoursFormProps) {
  const [enabled, setEnabled] = useState(currentValues?.enabled ?? false)
  const [timezone, setTimezone] = useState(currentValues?.timezone ?? 'Europe/Istanbul')
  const [schedule, setSchedule] = useState<Record<string, DaySchedule | null>>(
    currentValues?.schedule ?? defaultSchedule,
  )
  const [outsideMessage, setOutsideMessage] = useState(currentValues?.outsideHoursMessage ?? '')

  useEffect(() => {
    setEnabled(currentValues?.enabled ?? false)
    setTimezone(currentValues?.timezone ?? 'Europe/Istanbul')
    setSchedule(currentValues?.schedule ?? defaultSchedule)
    setOutsideMessage(currentValues?.outsideHoursMessage ?? '')
  }, [currentValues])

  function toggleDay(day: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { start: '09:00', end: '18:00' },
    }))
  }

  function updateDayTime(day: string, field: 'start' | 'end', value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? { start: '09:00', end: '18:00' }), [field]: value },
    }))
  }

  function handleSave() {
    onSave('workingHoursConfig', {
      enabled,
      timezone,
      schedule,
      outsideHoursMessage: outsideMessage || null,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <Label className="text-sm">Aktif</Label>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className={!enabled ? 'opacity-50 pointer-events-none' : ''}>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Zaman Dilimi</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mesai Dışı Mesajı</Label>
            <Input
              value={outsideMessage}
              onChange={(e) => setOutsideMessage(e.target.value)}
              placeholder="Boş bırakılırsa varsayılan mesaj"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Haftalık Program</Label>
          <div className="rounded-md border">
            {dayOrder.map((day) => {
              const isOpen = schedule[day] !== null
              return (
                <div
                  key={day}
                  className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
                >
                  <Switch checked={isOpen} onCheckedChange={() => toggleDay(day)} />
                  <span className="w-24 text-sm font-medium">{dayLabels[day]}</span>
                  {isOpen ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="time"
                        className="h-7 w-28 text-xs"
                        value={schedule[day]?.start ?? '09:00'}
                        onChange={(e) => updateDayTime(day, 'start', e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <Input
                        type="time"
                        className="h-7 w-28 text-xs"
                        value={schedule[day]?.end ?? '18:00'}
                        onChange={(e) => updateDayTime(day, 'end', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Kapalı</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t pt-3">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}
