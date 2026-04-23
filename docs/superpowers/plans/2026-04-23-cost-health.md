# Cost Health Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Super admin paneline `/admin/cost-health` sayfasını eklemek — provider/estimate/missing/legacy bucket breakdown, 4-segment stacked bar, by-event-type + by-model tabloları, URL-bound filter'lar (companyId + date range preset).

**Architecture:** Spec `docs/superpowers/specs/2026-04-23-cost-health-design.md`. Reusable primitive'ler önce (shadcn wrappers → useUrlFilterState → CompanyCombobox → DateRangePicker), sonra `src/features/cost-health/` feature modülü (types → hook → components → page), sonra entegrasyon (lazy route, sidebar). Mevcut patern'ler korunur: TanStack Query, axios interceptor, `@base-ui/react` primitive'leri.

**Tech Stack:** React 19, TypeScript, TanStack Query, axios, Tailwind, `@base-ui/react`, shadcn-style wrappers. Yeni dep'ler: `react-day-picker`, `date-fns`, `cmdk`. Otomatik test yok (repo konvansiyonu) — doğrulama `npx tsc --noEmit` + `npx eslint` + manuel smoke test ile yapılır.

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install runtime deps**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npm install react-day-picker date-fns cmdk
```

Expected: 3 package added, no peer dep warnings (react-day-picker peer `date-fns` satisfied).

- [ ] **Step 2: Verify install**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && node -e "require('react-day-picker'); require('date-fns'); require('cmdk'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add package.json package-lock.json && git commit -m "chore(deps): add react-day-picker + date-fns + cmdk for cost-health filters"
```

---

### Task 2: shadcn-style Component Wrappers (Popover, Calendar, Command)

**Files:**
- Create: `src/components/ui/popover.tsx`
- Create: `src/components/ui/calendar.tsx`
- Create: `src/components/ui/command.tsx`

- [ ] **Step 1: Popover wrapper (`@base-ui/react`)**

`src/components/ui/popover.tsx`:

```tsx
"use client"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />
}

function PopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger {...props} />
}

function PopoverContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> & {
  sideOffset?: number
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner sideOffset={sideOffset}>
        <PopoverPrimitive.Popup
          className={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
```

- [ ] **Step 2: Calendar wrapper (`react-day-picker`)**

`src/components/ui/calendar.tsx`:

```tsx
"use client"

import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"

type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      numberOfMonths={2}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button:
          "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 border rounded",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-1",
        cell: "h-8 w-8 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Command wrapper (`cmdk`)**

`src/components/ui/command.tsx`:

```tsx
"use client"

import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        className={cn(
          "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  )
}

function CommandEmpty(props: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className="py-6 text-center text-sm" {...props} />
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden p-1 text-foreground",
        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
}
```

- [ ] **Step 4: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors. If `@base-ui/react/popover` API surface farklıysa (ör. `Popup` vs `Content`), hatayı oku ve düzelt — `node_modules/@base-ui/react/popover/index.d.ts`'ye bakabilirsin.

- [ ] **Step 5: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/components/ui/popover.tsx src/components/ui/calendar.tsx src/components/ui/command.tsx && git commit -m "feat(ui): add popover/calendar/command shadcn-style wrappers"
```

---

### Task 3: Route Loading Fallback

**Files:**
- Create: `src/components/layout/route-loading-fallback.tsx`

- [ ] **Step 1: Create component**

`src/components/layout/route-loading-fallback.tsx`:

```tsx
import { Loader2 } from 'lucide-react'

export function RouteLoadingFallback() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="ml-2 text-sm">Yükleniyor...</span>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/components/layout/route-loading-fallback.tsx && git commit -m "feat(layout): add RouteLoadingFallback for lazy route Suspense"
```

---

### Task 4: `useUrlFilterState` Hook

**Files:**
- Create: `src/lib/hooks/use-url-filter-state.ts`

- [ ] **Step 1: Write hook**

`src/lib/hooks/use-url-filter-state.ts`:

```ts
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface UseUrlFilterStateOptions<T> {
  defaults: T
  parse: (params: URLSearchParams) => T
  serialize: (value: T) => Record<string, string | undefined>
}

type Updater<T> = Partial<T> | ((prev: T) => T)

export function useUrlFilterState<T extends object>(
  opts: UseUrlFilterStateOptions<T>
): [T, (updater: Updater<T>) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const value = useMemo(() => opts.parse(searchParams), [searchParams, opts])

  const setValue = useCallback(
    (updater: Updater<T>) => {
      const next =
        typeof updater === 'function'
          ? updater(value)
          : { ...value, ...updater }

      const serialized = opts.serialize(next)
      const nextParams = new URLSearchParams(searchParams)
      for (const [key, val] of Object.entries(serialized)) {
        if (val === undefined || val === '') {
          nextParams.delete(key)
        } else {
          nextParams.set(key, val)
        }
      }
      setSearchParams(nextParams, { replace: true })
    },
    [value, opts, searchParams, setSearchParams]
  )

  return [value, setValue]
}
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/lib/hooks/use-url-filter-state.ts && git commit -m "feat(lib): add useUrlFilterState generic hook for URL-bound filter state"
```

---

### Task 5: Cost Health Types + Query Key + Threshold Util

**Files:**
- Create: `src/features/cost-health/types.ts`
- Create: `src/features/cost-health/lib/cost-health-threshold.ts`
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: Types**

`src/features/cost-health/types.ts`:

```ts
export type CostSource = 'provider' | 'estimate' | 'missing' | 'legacy'
export type DatePreset = '7d' | '30d' | '90d' | 'custom'

export interface CostBucket {
  costUsd: number
  eventCount: number
  pct: number
}

export interface CostByEventType {
  eventType: string
  totalCostUsd: number
  estimatePct: number
}

export interface CostByModel {
  modelName: string
  totalCostUsd: number
  estimatePct: number
}

export interface CostHealthResponse {
  periodStart: string
  periodEnd: string
  totalCostUsd: number
  breakdown: Record<CostSource, CostBucket>
  byEventType: CostByEventType[]
  byModel: CostByModel[]
}

export interface CostHealthFilters {
  companyId: string | null
  preset: DatePreset
  from: Date | null
  to: Date | null
}

export interface ResolvedCostHealthRange {
  from: Date | null
  to: Date | null
}
```

- [ ] **Step 2: Threshold utility**

`src/features/cost-health/lib/cost-health-threshold.ts`:

```ts
export type ProviderBand = 'healthy' | 'watch' | 'action'
export type EstimateBand = 'healthy' | 'watch' | 'action'

// Sınır davranışı: >= inclusive. 90.0 → healthy, 89.9 → watch, 70.0 → watch, 69.9 → action.
export function getProviderBand(providerPct: number): ProviderBand {
  if (providerPct >= 90) return 'healthy'
  if (providerPct >= 70) return 'watch'
  return 'action'
}

// Düşük estimate = sağlıklı. 10.0 → healthy, 10.1 → watch, 30.0 → watch, 30.1 → action.
export function getEstimateBand(estimatePct: number): EstimateBand {
  if (estimatePct <= 10) return 'healthy'
  if (estimatePct <= 30) return 'watch'
  return 'action'
}

export const BAND_CLASSES: Record<ProviderBand, string> = {
  healthy: 'text-green-700 bg-green-50 border-green-200',
  watch: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  action: 'text-red-700 bg-red-50 border-red-200',
}
```

- [ ] **Step 3: queryKeys.admin namespace**

`src/lib/query-keys.ts` — mevcut dosya iki top-level key içerir: `companies` ve `platform`. `platform` objesinin kapanış `}` + virgülünden sonra (ama dış `queryKeys` objesinin kapanış `}`'ından önce) yeni `admin` namespace ekle:

```ts
  // ... platform: { ... },
  admin: {
    all: ['admin'] as const,
    costHealth: (params: {
      companyId: string | null
      fromIso: string | null
      toIso: string | null
    }) => ['admin', 'cost-health', params] as const,
  },
}
```

Sonuçta dosya `companies: {...}, platform: {...}, admin: {...}` şeklinde üç top-level namespace içerir.

- [ ] **Step 4: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/features/cost-health/types.ts src/features/cost-health/lib/cost-health-threshold.ts src/lib/query-keys.ts && git commit -m "feat(cost-health): add types, threshold util, and admin query-key namespace"
```

---

### Task 6: `useCostHealth` Hook

**Files:**
- Create: `src/features/cost-health/hooks/use-cost-health.ts`

- [ ] **Step 1: Write hook**

`src/features/cost-health/hooks/use-cost-health.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { CostHealthResponse, ResolvedCostHealthRange } from '../types'

export interface UseCostHealthArgs {
  companyId: string | null
  range: ResolvedCostHealthRange
}

export function useCostHealth({ companyId, range }: UseCostHealthArgs) {
  const fromIso = range.from?.toISOString() ?? null
  const toIso = range.to?.toISOString() ?? null

  return useQuery<CostHealthResponse>({
    queryKey: queryKeys.admin.costHealth({ companyId, fromIso, toIso }),
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (companyId) params.companyId = companyId
      if (fromIso) params.from = fromIso
      if (toIso) params.to = toIso
      const { data } = await apiClient.get<CostHealthResponse>(
        '/platform/admin/cost-health',
        { params }
      )
      return data
    },
    staleTime: 60_000,
  })
}
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/features/cost-health/hooks/use-cost-health.ts && git commit -m "feat(cost-health): add useCostHealth TanStack Query hook"
```

---

### Task 7: `CompanyCombobox` Filter Primitive

**Files:**
- Create: `src/components/filters/company-combobox.tsx`

- [ ] **Step 1: Write component**

`src/components/filters/company-combobox.tsx`:

```tsx
import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useCompanies } from '@/features/companies/hooks/use-companies'
import { cn } from '@/lib/utils'

export interface CompanyComboboxProps {
  value: string | null
  onChange: (companyId: string | null) => void
}

export function CompanyCombobox({ value, onChange }: CompanyComboboxProps) {
  const [open, setOpen] = useState(false)
  const { data: companies, isLoading } = useCompanies()

  const selected = companies?.find((c) => c.id === value) ?? null
  const label = selected?.name ?? 'Tüm Şirketler'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[220px] justify-between"
          >
            <span className="truncate">{label}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Şirket ara..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Yükleniyor...' : 'Şirket bulunamadı'}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === null ? 'opacity-100' : 'opacity-0'
                  )}
                />
                Tüm Şirketler
              </CommandItem>
              {(companies ?? []).map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.id}`}
                  onSelect={() => {
                    onChange(c.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === c.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{c.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors. `@base-ui/react` PopoverTrigger `render` prop'u farklı bir imzaya sahipse (ör. `children` yerine `render`), mevcut `sidebar.tsx`'deki TooltipTrigger paterni ile hizala.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/components/filters/company-combobox.tsx && git commit -m "feat(filters): add CompanyCombobox searchable dropdown"
```

---

### Task 8: `DateRangePicker` Filter Primitive

**Files:**
- Create: `src/components/filters/date-range-picker.tsx`

- [ ] **Step 1: Write component**

`src/components/filters/date-range-picker.tsx`:

```tsx
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
        <PopoverContent className="w-auto p-0" align="end">
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
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors. `react-day-picker` `mode="range"` için `onSelect` imzası `(range: DateRange | undefined) => void`; hata varsa `DateRange` tipi import et.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/components/filters/date-range-picker.tsx && git commit -m "feat(filters): add DateRangePicker with 7d/30d/90d presets + custom range"
```

---

### Task 9: `CostHealthHeadline` Component

**Files:**
- Create: `src/features/cost-health/components/cost-health-headline.tsx`

- [ ] **Step 1: Write component**

`src/features/cost-health/components/cost-health-headline.tsx`:

```tsx
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
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/features/cost-health/components/cost-health-headline.tsx && git commit -m "feat(cost-health): add CostHealthHeadline with total + filters + isFetching spinner"
```

---

### Task 10: `CostHealthStackedBar` Component

**Files:**
- Create: `src/features/cost-health/components/cost-health-stacked-bar.tsx`

- [ ] **Step 1: Write component**

`src/features/cost-health/components/cost-health-stacked-bar.tsx`:

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { CostBucket, CostSource } from '../types'

export interface CostHealthStackedBarProps {
  breakdown: Record<CostSource, CostBucket>
  totalCostUsd: number
}

const SEGMENT_META: Record<
  CostSource,
  { label: string; bg: string; dot: string }
> = {
  provider: {
    label: 'Provider (Gerçek Fatura)',
    bg: 'bg-green-500',
    dot: 'bg-green-500',
  },
  estimate: {
    label: 'Estimate (Token Tahmini)',
    bg: 'bg-yellow-500',
    dot: 'bg-yellow-500',
  },
  missing: {
    label: 'Missing (Hiç Kayıt Yok)',
    bg: 'bg-red-500',
    dot: 'bg-red-500',
  },
  legacy: {
    label: 'Legacy (Migration Öncesi)',
    bg: 'bg-gray-400',
    dot: 'bg-gray-400',
  },
}

const SEGMENT_ORDER: CostSource[] = ['provider', 'estimate', 'missing', 'legacy']

export function CostHealthStackedBar({
  breakdown,
  totalCostUsd,
}: CostHealthStackedBarProps) {
  if (totalCostUsd <= 0) return null

  const sumPct = SEGMENT_ORDER.reduce(
    (acc, key) => acc + breakdown[key].pct,
    0
  )
  const normalize = (pct: number) => (sumPct > 0 ? (pct / sumPct) * 100 : 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Maliyet Kalite Dağılımı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-8 w-full overflow-hidden rounded-md">
          {SEGMENT_ORDER.map((source) => {
            const bucket = breakdown[source]
            const width = normalize(bucket.pct)
            if (width === 0) return null
            const meta = SEGMENT_META[source]
            return (
              <Tooltip key={source}>
                <TooltipTrigger
                  render={
                    <div
                      className={`${meta.bg} flex h-full items-center justify-center text-xs font-medium text-white`}
                      style={{ width: `${width}%` }}
                    >
                      {bucket.pct >= 6 && `%${bucket.pct.toFixed(1)}`}
                    </div>
                  }
                />
                <TooltipContent side="top">
                  <div className="text-xs">
                    <strong>{source}:</strong>{' '}
                    {formatCurrency(bucket.costUsd)} ({bucket.eventCount} event,
                    %{bucket.pct.toFixed(1)})
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {SEGMENT_ORDER.map((source) => {
            const meta = SEGMENT_META[source]
            const bucket = breakdown[source]
            return (
              <div key={source} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-sm ${meta.dot}`} />
                <span className="text-muted-foreground">
                  {meta.label} <strong>%{bucket.pct.toFixed(1)}</strong>
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors. `TooltipTrigger render={...}` paterni `src/components/layout/sidebar.tsx:40-57`'deki kullanımla birebir olmalı.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/features/cost-health/components/cost-health-stacked-bar.tsx && git commit -m "feat(cost-health): add CostHealthStackedBar with normalized 4-segment bar + legend"
```

---

### Task 11: `CostHealthBreakdownTables` Component

**Files:**
- Create: `src/features/cost-health/components/cost-health-breakdown-tables.tsx`

- [ ] **Step 1: Write component**

`src/features/cost-health/components/cost-health-breakdown-tables.tsx`:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { getEstimateBand, BAND_CLASSES } from '../lib/cost-health-threshold'
import type { CostByEventType, CostByModel } from '../types'

export interface CostHealthBreakdownTablesProps {
  byEventType: CostByEventType[]
  byModel: CostByModel[]
}

function EstimatePctBadge({ pct }: { pct: number }) {
  const band = getEstimateBand(pct)
  return (
    <Badge variant="outline" className={BAND_CLASSES[band]}>
      %{pct.toFixed(1)}
    </Badge>
  )
}

export function CostHealthBreakdownTables({
  byEventType,
  byModel,
}: CostHealthBreakdownTablesProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Type'a Göre</CardTitle>
        </CardHeader>
        <CardContent>
          {byEventType.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Bu dönemde kayıt yok
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead className="text-right">Estimate %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byEventType.map((row) => (
                  <TableRow key={row.eventType}>
                    <TableCell className="font-mono text-xs">
                      {row.eventType}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.totalCostUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <EstimatePctBadge pct={row.estimatePct} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model'e Göre</CardTitle>
        </CardHeader>
        <CardContent>
          {byModel.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Bu dönemde kayıt yok
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead className="text-right">Estimate %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byModel.map((row) => (
                  <TableRow key={row.modelName}>
                    <TableCell className="font-mono text-xs">
                      {row.modelName}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.totalCostUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <EstimatePctBadge pct={row.estimatePct} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/features/cost-health/components/cost-health-breakdown-tables.tsx && git commit -m "feat(cost-health): add CostHealthBreakdownTables (byEventType + byModel)"
```

---

### Task 12: `CostHealthPage` Wiring

**Files:**
- Create: `src/features/cost-health/pages/cost-health-page.tsx`

- [ ] **Step 1: Write page**

`src/features/cost-health/pages/cost-health-page.tsx`:

```tsx
import { useMemo } from 'react'
import { subDays } from 'date-fns'
import { AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { useCostHealth } from '../hooks/use-cost-health'
import { CostHealthHeadline } from '../components/cost-health-headline'
import { CostHealthStackedBar } from '../components/cost-health-stacked-bar'
import { CostHealthBreakdownTables } from '../components/cost-health-breakdown-tables'
import type {
  CostHealthFilters,
  DatePreset,
  ResolvedCostHealthRange,
} from '../types'

const FILTER_OPTIONS = {
  defaults: {
    companyId: null,
    preset: '30d',
    from: null,
    to: null,
  } as CostHealthFilters,
  parse: (p: URLSearchParams): CostHealthFilters => {
    const raw = (p.get('preset') ?? '30d') as DatePreset
    const preset: DatePreset = (['7d', '30d', '90d', 'custom'] as const).includes(
      raw
    )
      ? raw
      : '30d'
    return {
      companyId: p.get('companyId') ?? null,
      preset,
      from: preset === 'custom' && p.get('from') ? new Date(p.get('from')!) : null,
      to: preset === 'custom' && p.get('to') ? new Date(p.get('to')!) : null,
    }
  },
  serialize: (v: CostHealthFilters): Record<string, string | undefined> => ({
    companyId: v.companyId ?? undefined,
    preset: v.preset === '30d' ? undefined : v.preset,
    from: v.preset === 'custom' ? v.from?.toISOString() : undefined,
    to: v.preset === 'custom' ? v.to?.toISOString() : undefined,
  }),
}

function resolvePreset(f: CostHealthFilters): ResolvedCostHealthRange {
  if (f.preset === 'custom') return { from: f.from, to: f.to }
  const now = new Date()
  if (f.preset === '7d') return { from: subDays(now, 7), to: now }
  if (f.preset === '30d') return { from: subDays(now, 30), to: now }
  if (f.preset === '90d') return { from: subDays(now, 90), to: now }
  return { from: null, to: null }
}

export function CostHealthPage() {
  const [filters, setFilters] = useUrlFilterState<CostHealthFilters>(
    FILTER_OPTIONS
  )

  const range = useMemo(
    () => resolvePreset(filters),
    [filters.preset, filters.from, filters.to]
  )

  const query = useCostHealth({ companyId: filters.companyId, range })

  if (query.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded bg-muted" />
          <div className="h-48 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (query.isError) {
    const status = (query.error as { response?: { status?: number } })?.response
      ?.status
    const code = (
      query.error as { response?: { data?: { code?: string } } }
    )?.response?.data?.code
    const isForbidden = status === 403 || code === 'platform_admin_required'
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h2 className="text-lg font-semibold">
              {isForbidden
                ? 'Bu sayfaya erişim yetkiniz yok'
                : 'Veri yüklenemedi'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isForbidden
                ? 'Cost Health yalnızca platform yöneticilerine açıktır.'
                : 'Bir hata oluştu. Lütfen tekrar deneyin.'}
            </p>
            {!isForbidden && (
              <Button onClick={() => query.refetch()}>Tekrar Dene</Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = query.data!
  const isEmpty = data.totalCostUsd <= 0

  return (
    <div className="space-y-6 p-6">
      <CostHealthHeadline
        total={data.totalCostUsd}
        periodStart={data.periodStart}
        periodEnd={data.periodEnd}
        filters={filters}
        onFiltersChange={(next) => setFilters(next)}
        isFetching={query.isFetching}
      />

      {isEmpty ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Info className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Seçilen dönemde AI harcaması yok.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <CostHealthStackedBar
            breakdown={data.breakdown}
            totalCostUsd={data.totalCostUsd}
          />
          <CostHealthBreakdownTables
            byEventType={data.byEventType}
            byModel={data.byModel}
          />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/features/cost-health/pages/cost-health-page.tsx && git commit -m "feat(cost-health): wire CostHealthPage — filters, URL state, loading/error/empty states"
```

---

### Task 13: Lazy Route in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add lazy import + Suspense route**

`src/App.tsx` — şu değişiklikleri yap:

1. Üst import bloğuna ekle:

```tsx
import { lazy, Suspense } from 'react'
import { RouteLoadingFallback } from '@/components/layout/route-loading-fallback'
```

2. Statik import'ların sonuna (DocsPage'den sonra):

```tsx
const CostHealthPage = lazy(() =>
  import('@/features/cost-health/pages/cost-health-page').then((m) => ({
    default: m.CostHealthPage,
  }))
)
```

3. `<Route path="/docs" ... />` satırının altına yeni route ekle:

```tsx
<Route
  path="/admin/cost-health"
  element={
    <Suspense fallback={<RouteLoadingFallback />}>
      <CostHealthPage />
    </Suspense>
  }
/>
```

- [ ] **Step 2: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/App.tsx && git commit -m "feat(routes): add lazy-loaded /admin/cost-health route"
```

---

### Task 14: Sidebar Integration

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add Activity icon to lucide import**

`src/components/layout/sidebar.tsx`:2 — mevcut import satırını bul:

```tsx
import { LayoutDashboard, Building2, Settings, LogOut, Mail, KeyRound, BookOpen } from 'lucide-react'
```

ve `Activity`'yi ekle:

```tsx
import { LayoutDashboard, Building2, Settings, LogOut, Mail, KeyRound, BookOpen, Activity } from 'lucide-react'
```

- [ ] **Step 2: Platform items + render helper**

`src/components/layout/sidebar.tsx`:8-15 — mevcut `navItems` array'inin altına ekle:

```tsx
const platformItems = [
  { to: '/admin/cost-health', icon: Activity, label: 'Cost Health' },
]
```

- [ ] **Step 3: Extract renderNavItem helper + update nav render**

`sidebar.tsx`:37-61 — mevcut `<nav>` bloğunu şu şekilde değiştir:

```tsx
        <nav className="flex flex-1 flex-col items-center gap-2">
          {navItems.map(renderNavItem)}
          <div className="h-px w-8 bg-border my-1" aria-hidden="true" />
          {platformItems.map(renderNavItem)}
        </nav>
```

ve component body'sinin üstüne (return'den hemen önce) helper'ı ekle:

```tsx
  function renderNavItem(item: { to: string; icon: typeof Activity; label: string }) {
    return (
      <Tooltip key={item.to}>
        <TooltipTrigger
          render={
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
            </NavLink>
          }
        />
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }
```

- [ ] **Step 4: Type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add src/components/layout/sidebar.tsx && git commit -m "feat(sidebar): add separator + Cost Health item under platform section"
```

---

### Task 15: Build, Bundle & Smoke Verification

**Files:** (none modified — validation only)

- [ ] **Step 1: Full type check**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npm run lint 2>&1 | tail -30
```

Expected: No errors. Uyarı varsa düzelt (yalnızca yeni eklenen dosyalar için).

- [ ] **Step 3: Build + verify lazy chunk**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npm run build 2>&1 | tail -50
```

Expected: Build başarılı. Çıktıda `dist/assets/` altında ayrı bir chunk dosyası olmalı — adı genelde `cost-health-page-*.js` veya benzeri (Vite hash-based isimlendirme). `grep` ile doğrula:

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && ls dist/assets/ | grep -i "cost-health\|index-" | head
```

Expected: En az bir `cost-health*` dosyası görünür. `react-day-picker`, `date-fns`, `cmdk` bu chunk'ta yer almalı, main `index-*.js` içinde olmamalı.

- [ ] **Step 4: Manuel smoke test**

Dev server'ı başlat:

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npm run dev
```

Tarayıcıda şu adımları yap:

1. `http://localhost:5173/login` → superadmin hesabı ile giriş yap
2. Sidebar'da alt kısımda **görsel ayraç çizgisi** + `Activity` ikonlu yeni item görünür olmalı. Tooltip: "Cost Health"
3. Tıkla → `/admin/cost-health` route'una git. Lazy load spinner göster, sonra sayfa yüklensin
4. Headline'da toplam `$X.XX` + "30 gün" metni görünür
5. Stacked bar 4 renkli segment gösterir (provider yeşil, estimate sarı, missing kırmızı, legacy gri)
6. Her segment'e hover → tooltip `{source}: $X.XX (N event, %P)` formatında çıkar
7. Alt tarafta 2 tablo: "Event Type'a Göre" + "Model'e Göre". Estimate % badge rengi eşiklere göre değişir
8. **Filter test 1:** "7 gün" butonuna tıkla → URL `?preset=7d` olur, sayfa refetch eder, sağ üstte `isFetching` spinner kısa süre görünür
9. **Filter test 2:** "Özel" butonuna tıkla → Popover içinde Calendar açılır, bir range seç → URL `?preset=custom&from=ISO&to=ISO` olur
10. **Filter test 3:** CompanyCombobox'ta şirket ara ve seç → URL `?companyId=X` olur
11. **Refresh test:** Sayfayı F5 ile yenile → tüm filtreler korunur (URL'den okunur)
12. **Empty test:** backend'de `totalCostUsd = 0` dönen bir şirket/dönem seç → "Seçilen dönemde AI harcaması yok" banner görünür, bar ve tablolar gizli

- [ ] **Step 5: Memory update (manuel)**

Sprint 7 progress'i memory'e işle — `project_next_session_todo.md` veya `project_superadmin_status.md` dosyasını güncelle (bu plan'ın shipping durumu + kalan lazy-split follow-up).

Not: bu adım otomatik değil, plan execute edilirken manuel olarak yapılır. Bu plan adımının içeriği:
- Ship durumu: Cost Health page shipped, lazy patern kuruldu
- Follow-up: diğer route'ları lazy'ye çevir, `<PlatformAdminGuard>` guard'ı ekle

- [ ] **Step 6: Final commit (yalnızca bundle raporu değiştirdiyse)**

Eğer adımlar sırasında herhangi bir küçük düzeltme gerekti ise (ör. lint fix), commit et:

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git status
```

Temizse bir şey yapma. Değişiklik varsa:

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git add -A && git commit -m "chore(cost-health): post-smoke fixes"
```

---

## Kabul Kriterleri Eşlemesi (spec §7 ile çapraz doğrulama)

| # | Kriter | Doğrulayan Task |
|---|--------|------------------|
| 1 | `/admin/cost-health` açılır, backend verisi render | Task 13 + 15 smoke adımı 3-5 |
| 2 | Sidebar'da separator + Cost Health item | Task 14 + 15 smoke adımı 2 |
| 3 | provider ≥ 90% → yeşil dominant | Task 10 + 15 smoke adımı 5 |
| 4 | CompanyCombobox → URL `?companyId=X` + refresh sonrası korur | Task 7 + 12 + 15 smoke 10, 11 |
| 5 | "7 gün" preset → URL `?preset=7d`, button highlight | Task 8 + 12 + 15 smoke 8 |
| 6 | "Özel" preset → Popover açılır, Calendar range | Task 8 + 15 smoke 9 |
| 7 | `totalCostUsd = 0` → empty state banner | Task 12 + 15 smoke 12 |
| 8 | `Estimate %` badge rengi eşik doğrultusunda | Task 5 + 11 + 15 smoke 7 |
| 9 | `npm run build` başarılı + cost-health chunk ayrı | Task 15 step 3 |
| 10 | Lint temiz | Task 15 step 2 |
| 11 | Yeni dep'ler lazy chunk'a düşer | Task 15 step 3 |
| 12 | 403 error card render, redirect yok | Task 12 + manuel test (opsiyonel) |
| 13 | Manuel smoke geçer | Task 15 step 4 |

---

## Notlar

- **Commit sıklığı:** 14 task = 14 commit (Task 15 genelde commit eklemez). Her task atomic ve bağımsız test edilebilir.
- **@base-ui/react API edge case'leri:** Popover prop signature'ları (`PopoverTrigger render` vs `children`, `PopoverContent` vs `Popup`) doküman ile `node_modules/@base-ui/react/popover/index.d.ts` arasında farklılık varsa Task 2 veya 7'de düzelt; mevcut `tooltip.tsx:2` ve `sidebar.tsx:40-57`'deki kullanım paterni referanstır.
- **react-day-picker v9 API:** `onSelect` imzası `(range: DateRange | undefined) => void`. `mode="range"` prop zorunlu. Versiyona göre `classNames` slot isimleri değişebilir; Task 2 step 2'deki wrapper sınıfları v9'a göredir.
- **Bundle doğrulama:** Vite content-hash kullanır, dosya adları `cost-health-page-ABC123.js` şeklinde olur — exact match yerine glob ile ara.
- **Smoke test eksikse:** Task 15 step 4'teki senaryolardan biri geçmezse, ilgili task'a geri dön ve düzelt; yeni bir task açma.
