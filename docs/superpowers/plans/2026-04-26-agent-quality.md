# Agent Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Super admin paneline iki yeni lazy-loaded route eklemek — `/admin/agent-quality` (cross-tenant kalite snapshot tablosu + per-tenant trend paneli + turn-level drill-down drawer'ı) ve `/admin/agent-quality/alerts` (aktif threshold alarm listesi) — ek olarak sidebar'daki Alerts item'ında 30s polling'li open-count badge.

**Architecture:** Spec `docs/superpowers/specs/2026-04-26-agent-quality-design.md`. Sprint 7 cost-health primitive'lerini (lazy route + Suspense, `useUrlFilterState`, `RouteLoadingFallback`, `admin.*` query-key namespace, shadcn `popover`/`calendar`/`command` wrapper'ları) yeniden kullanır. Yeni eklenenler: shadcn `sheet` wrapper'ı, agent-quality feature modülü (types → 5 hook → primitive komponentler → ana komponentler → 2 sayfa), sidebar badge entegrasyonu.

**Tech Stack:** React 19, TypeScript, TanStack Query, axios, Tailwind, `@base-ui/react`, shadcn-style wrappers, `recharts` (cost-health'ten gelen). Yeni dep yok. Otomatik test yok (repo konvansiyonu) — doğrulama `npx tsc --noEmit` + `npx eslint` + manuel smoke test ile yapılır.

**Backend dokümantasyon kaynağı (READ-ONLY referans):**
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/18-agent-quality.md` — Phase F snapshot+trend + Phase F.1 turn drill-down
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/19-agent-quality-alerts.md` — Phase G threshold alerts

---

### Task 1: Types Module

**Files:**
- Create: `src/features/agent-quality/types.ts`

- [ ] **Step 1: Create types module**

`src/features/agent-quality/types.ts`:

```ts
export type AgentQualityMetric = 'guardrail' | 'retry' | 'force_followup'

export const METRIC_META: Record<
  AgentQualityMetric,
  { label: string; tone: 'red' | 'amber' | 'orange' }
> = {
  guardrail: { label: 'Guardrail', tone: 'red' },
  retry: { label: 'Retry Tükenmiş', tone: 'amber' },
  force_followup: { label: 'Force Follow-Up', tone: 'orange' },
}

// Pagination/window caps — server-authoritative; FE clamps before request.
export const WINDOW_DAYS_OPTIONS = [7, 14, 30, 90] as const
export type WindowDaysOption = (typeof WINDOW_DAYS_OPTIONS)[number]
export const TURNS_PAGE_MAX = 10_000 // 18.md drill-down: page 1..10000
export const TURNS_PAGE_SIZE = 20
export const ALERTS_PAGE_MAX = 500 // 19.md alerts list: page 1..500
export const ALERTS_PAGE_SIZE = 20

export interface AgentQualitySnapshotRow {
  companyId: string
  companyName: string | null
  assistantTurns: number
  lowSignal: boolean
  guardrailFireRate: number
  retryExhaustedRate: number
  forceFollowUpRate: number
  retrievalQualityBySource: {
    knowledge: number | null
    drive: number | null
    notes: number | null
    aggregate: number | null
  }
  costByRole: Record<string, number>
  totalCostUsd: number
}

export interface AgentQualitySnapshotResponse {
  windowDays: number
  generatedAt: string
  tenantsBelowSignalThreshold: number
  tenants: AgentQualitySnapshotRow[]
}

export interface AgentQualityTrendDay {
  date: string // YYYY-MM-DD
  assistantTurns: number
  guardrailFireRate: number | null
  retryExhaustedRate: number | null
  forceFollowUpRate: number | null
  retrievalQualityScore: number | null
}

export interface AgentQualityCostSeriesDay {
  date: string
  byRole: Record<string, number>
}

export interface AgentQualityTrendResponse {
  windowDays: number
  companyId: string
  series: AgentQualityTrendDay[]
  costByRoleSeries: AgentQualityCostSeriesDay[]
}

export type MetricReason =
  | { metric: 'guardrail'; blockingReasonCodes: string[] }
  | { metric: 'retry'; retryExhausted: true }
  | { metric: 'force_followup'; forceFollowUp: true }

export interface AgentQualityTurn {
  id: string
  conversationId: string
  createdAt: string
  role: string
  modelName: string
  costUsd: number
  inputTokens: number
  outputTokens: number
  contentPreview: string | null
  citationCount: number
  metricReason: MetricReason
}

export interface AgentQualityTurnsResponse {
  companyId: string
  metric: AgentQualityMetric
  date: string
  page: number
  pageSize: number
  total: number
  turns: AgentQualityTurn[]
}

export interface AgentQualityAlertRow {
  id: string
  companyId: string
  companyName: string | null
  metric: AgentQualityMetric
  value: number
  threshold: number
  assistantTurns: number
  firedAt: string
  resolvedAt: string | null
}

export interface AgentQualityAlertsFilters {
  status: 'open' | 'all'
  companyId?: string
  metric?: AgentQualityMetric
  page: number
  pageSize: number
}

export interface AgentQualityAlertsResponse {
  total: number
  page: number
  pageSize: number
  alerts: AgentQualityAlertRow[]
}

// Helpers used by URL parsing/clamping (Section 3.6 in spec).
export function clampWindowDays(value: number | undefined): WindowDaysOption {
  if (value === undefined) return 7
  return (WINDOW_DAYS_OPTIONS as readonly number[]).includes(value)
    ? (value as WindowDaysOption)
    : 7
}

export function clampPage(value: number | undefined, max: number): number {
  if (!Number.isFinite(value) || value === undefined) return 1
  if (value < 1) return 1
  if (value > max) return 1
  return Math.floor(value)
}

export function isAgentQualityMetric(v: unknown): v is AgentQualityMetric {
  return v === 'guardrail' || v === 'retry' || v === 'force_followup'
}

export function isYmd(v: unknown): v is string {
  if (typeof v !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(`${v}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return false
  // Reject future dates (drill-down disallows future per 18.md).
  const todayUtc = new Date()
  todayUtc.setUTCHours(0, 0, 0, 0)
  return d.getTime() <= todayUtc.getTime()
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/types.ts && \
git commit -m "feat(agent-quality): add types module + clamping helpers"
```

---

### Task 2: Query Keys Extension

**Files:**
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: Add agent-quality namespaces**

Edit `src/lib/query-keys.ts`. Add the following imports at the top:

```ts
import type {
  AgentQualityMetric,
  AgentQualityAlertsFilters,
} from '@/features/agent-quality/types'
```

Inside the `admin` block, after `costHealth`, add:

```ts
    agentQuality: {
      all: ['admin', 'agent-quality'] as const,
      snapshot: (windowDays: number) =>
        ['admin', 'agent-quality', 'snapshot', windowDays] as const,
      trend: (companyId: string, windowDays: number) =>
        ['admin', 'agent-quality', 'trend', companyId, windowDays] as const,
      turns: (params: {
        companyId: string
        metric: AgentQualityMetric
        date: string
        page: number
        pageSize: number
      }) => ['admin', 'agent-quality', 'turns', params] as const,
    },
    agentQualityAlerts: {
      all: ['admin', 'agent-quality-alerts'] as const,
      list: (filters: AgentQualityAlertsFilters) =>
        ['admin', 'agent-quality-alerts', 'list', filters] as const,
      count: () => ['admin', 'agent-quality-alerts', 'count'] as const,
    },
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/lib/query-keys.ts && \
git commit -m "feat(query-keys): add admin.agentQuality + admin.agentQualityAlerts namespaces"
```

---

### Task 3: Hooks — Snapshot + Trend

**Files:**
- Create: `src/features/agent-quality/hooks/use-agent-quality-snapshot.ts`
- Create: `src/features/agent-quality/hooks/use-agent-quality-trend.ts`

- [ ] **Step 1: Snapshot hook**

`src/features/agent-quality/hooks/use-agent-quality-snapshot.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AgentQualitySnapshotResponse } from '../types'

export function useAgentQualitySnapshot(windowDays: number) {
  return useQuery<AgentQualitySnapshotResponse>({
    queryKey: queryKeys.admin.agentQuality.snapshot(windowDays),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentQualitySnapshotResponse>(
        '/platform/admin/agent-quality',
        { params: { windowDays } }
      )
      return data
    },
    staleTime: 60_000,
  })
}
```

- [ ] **Step 2: Trend hook**

`src/features/agent-quality/hooks/use-agent-quality-trend.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AgentQualityTrendResponse } from '../types'

export function useAgentQualityTrend(
  companyId: string | null,
  windowDays: number
) {
  return useQuery<AgentQualityTrendResponse>({
    queryKey: queryKeys.admin.agentQuality.trend(companyId ?? '', windowDays),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentQualityTrendResponse>(
        `/platform/admin/agent-quality/${companyId}/trend`,
        { params: { windowDays } }
      )
      return data
    },
    staleTime: 5 * 60_000,
    enabled: !!companyId,
  })
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/hooks/use-agent-quality-snapshot.ts \
        src/features/agent-quality/hooks/use-agent-quality-trend.ts && \
git commit -m "feat(agent-quality): add snapshot + trend TanStack Query hooks"
```

---

### Task 4: Hooks — Turns + Alerts List

**Files:**
- Create: `src/features/agent-quality/hooks/use-agent-quality-turns.ts`
- Create: `src/features/agent-quality/hooks/use-agent-quality-alerts.ts`

- [ ] **Step 1: Turns hook**

`src/features/agent-quality/hooks/use-agent-quality-turns.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type {
  AgentQualityMetric,
  AgentQualityTurnsResponse,
} from '../types'
import { TURNS_PAGE_SIZE } from '../types'

export interface UseAgentQualityTurnsArgs {
  companyId: string
  metric: AgentQualityMetric
  date: string
  page: number
}

export function useAgentQualityTurns(args: UseAgentQualityTurnsArgs | null) {
  return useQuery<AgentQualityTurnsResponse>({
    queryKey: queryKeys.admin.agentQuality.turns({
      companyId: args?.companyId ?? '',
      metric: args?.metric ?? 'guardrail',
      date: args?.date ?? '',
      page: args?.page ?? 1,
      pageSize: TURNS_PAGE_SIZE,
    }),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentQualityTurnsResponse>(
        `/platform/admin/agent-quality/${args!.companyId}/turns`,
        {
          params: {
            metric: args!.metric,
            date: args!.date,
            page: args!.page,
            pageSize: TURNS_PAGE_SIZE,
          },
        }
      )
      return data
    },
    staleTime: 60_000,
    enabled: !!args,
  })
}
```

- [ ] **Step 2: Alerts list hook**

`src/features/agent-quality/hooks/use-agent-quality-alerts.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type {
  AgentQualityAlertsFilters,
  AgentQualityAlertsResponse,
} from '../types'

export function useAgentQualityAlerts(filters: AgentQualityAlertsFilters) {
  return useQuery<AgentQualityAlertsResponse>({
    queryKey: queryKeys.admin.agentQualityAlerts.list(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        status: filters.status,
        page: filters.page,
        pageSize: filters.pageSize,
      }
      if (filters.companyId) params.companyId = filters.companyId
      if (filters.metric) params.metric = filters.metric
      const { data } = await apiClient.get<AgentQualityAlertsResponse>(
        '/platform/admin/agent-quality/alerts',
        { params }
      )
      return data
    },
    staleTime: 30_000,
  })
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/hooks/use-agent-quality-turns.ts \
        src/features/agent-quality/hooks/use-agent-quality-alerts.ts && \
git commit -m "feat(agent-quality): add turns + alerts-list TanStack Query hooks"
```

---

### Task 5: Hook — Alert Count (Polling Badge)

**Files:**
- Create: `src/features/agent-quality/hooks/use-agent-quality-alert-count.ts`

- [ ] **Step 1: Alert count hook with 30s polling**

`src/features/agent-quality/hooks/use-agent-quality-alert-count.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

interface AgentQualityAlertCountResponse {
  open: number
}

export function useAgentQualityAlertCount() {
  return useQuery<AgentQualityAlertCountResponse>({
    queryKey: queryKeys.admin.agentQualityAlerts.count(),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentQualityAlertCountResponse>(
        '/platform/admin/agent-quality/alerts/count'
      )
      return data
    },
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false, // sessiz fail — eski sayı korunur
  })
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/hooks/use-agent-quality-alert-count.ts && \
git commit -m "feat(agent-quality): add alert-count polling hook (30s, foreground-only)"
```

---

### Task 6: shadcn Sheet Wrapper

**Files:**
- Create: `src/components/ui/sheet.tsx`

The repo's drawer/turn list uses a side-mounted Sheet built on `@base-ui/react/dialog` (same primitive as `dialog.tsx`) but with `data-side` attributes and slide animations. Mirrors `dialog.tsx` patterns.

- [ ] **Step 1: Sheet wrapper**

`src/components/ui/sheet.tsx`:

```tsx
import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

type SheetSide = 'right' | 'left' | 'top' | 'bottom'

function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: DialogPrimitive.Popup.Props & { side?: SheetSide }) {
  const sideClass: Record<SheetSide, string> = {
    right:
      'inset-y-0 right-0 h-full w-3/4 sm:max-w-md border-l data-[open]:slide-in-from-right data-[closed]:slide-out-to-right',
    left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-md border-r data-[open]:slide-in-from-left data-[closed]:slide-out-to-left',
    top: 'inset-x-0 top-0 h-1/3 border-b data-[open]:slide-in-from-top data-[closed]:slide-out-to-top',
    bottom:
      'inset-x-0 bottom-0 h-1/3 border-t data-[open]:slide-in-from-bottom data-[closed]:slide-out-to-bottom',
  }
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 bg-background p-6 shadow-lg outline-none data-[open]:animate-in data-[closed]:animate-out',
          sideClass[side],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2"
          aria-label="Kapat"
        >
          <XIcon className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 mb-4', className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}
```

- [ ] **Step 2: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && npx eslint src/components/ui/sheet.tsx
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/components/ui/sheet.tsx && \
git commit -m "feat(ui): add shadcn-style Sheet wrapper on @base-ui/react/dialog"
```

---

### Task 7: Primitives — MetricLabel + RatePill

**Files:**
- Create: `src/features/agent-quality/components/metric-label.tsx`
- Create: `src/features/agent-quality/components/rate-pill.tsx`

- [ ] **Step 1: MetricLabel**

`src/features/agent-quality/components/metric-label.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { METRIC_META, type AgentQualityMetric } from '../types'

const TONE_CLASS: Record<'red' | 'amber' | 'orange', string> = {
  red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  orange:
    'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
}

export interface MetricLabelProps {
  metric: AgentQualityMetric
  className?: string
}

export function MetricLabel({ metric, className }: MetricLabelProps) {
  const meta = METRIC_META[metric]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[meta.tone],
        className
      )}
    >
      {meta.label}
    </span>
  )
}
```

- [ ] **Step 2: RatePill**

`src/features/agent-quality/components/rate-pill.tsx`:

```tsx
import { cn } from '@/lib/utils'

export interface RatePillProps {
  value: number | null
  className?: string
}

export function RatePill({ value, className }: RatePillProps) {
  if (value == null) {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }
  return (
    <span className={cn('tabular-nums', className)}>
      {(value * 100).toFixed(1)}%
    </span>
  )
}
```

- [ ] **Step 3: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/features/agent-quality/components/metric-label.tsx src/features/agent-quality/components/rate-pill.tsx
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/components/metric-label.tsx \
        src/features/agent-quality/components/rate-pill.tsx && \
git commit -m "feat(agent-quality): add MetricLabel + RatePill primitives"
```

---

### Task 8: Primitive — TrendSparkline

**Files:**
- Create: `src/features/agent-quality/components/trend-sparkline.tsx`

Recharts `LineChart` üstü ince wrapper. `null` günler `connectNulls={false}` ile gap render. Bar tıklamak yerine her dot'a click handler bağlanır (sparkline = küçük çizgi grafiği; tıklanan x ekseni günü ile callback tetiklenir).

- [ ] **Step 1: Sparkline component**

`src/features/agent-quality/components/trend-sparkline.tsx`:

```tsx
import { useMemo } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'

export interface TrendSparklinePoint {
  date: string // YYYY-MM-DD
  value: number | null
}

export interface TrendSparklineProps {
  data: TrendSparklinePoint[]
  label: string
  tooltipFormat?: (value: number | null, date: string) => string
  onPointClick?: (date: string, value: number | null) => void
  className?: string
  height?: number
}

export function TrendSparkline({
  data,
  label,
  tooltipFormat,
  onPointClick,
  className,
  height = 80,
}: TrendSparklineProps) {
  const chartData = useMemo(
    () => data.map((d) => ({ date: d.date, value: d.value })),
    [data]
  )

  const allNull = chartData.every((d) => d.value == null)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {allNull && (
          <span className="text-xs text-muted-foreground">Veri yok</span>
        )}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
          >
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, 'dataMax']} />
            <Tooltip
              formatter={(v: number) =>
                tooltipFormat ? tooltipFormat(v, '') : `${(v * 100).toFixed(2)}%`
              }
              labelFormatter={(label: string) => label}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="currentColor"
              strokeWidth={2}
              dot={{
                r: 3,
                cursor: onPointClick ? 'pointer' : 'default',
                onClick: onPointClick
                  ? (_e, payload) => {
                      const p = payload as unknown as {
                        payload: { date: string; value: number | null }
                      }
                      if (p.payload.value == null) return
                      onPointClick(p.payload.date, p.payload.value)
                    }
                  : undefined,
              }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/features/agent-quality/components/trend-sparkline.tsx
```
Expected: No errors. If Recharts type signature for `Line.dot.onClick` differs, adjust the callback signature accordingly — the underlying behavior is "fire `onPointClick` with the dot's day".

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/components/trend-sparkline.tsx && \
git commit -m "feat(agent-quality): add TrendSparkline (Recharts wrapper, null-as-gap)"
```

---

### Task 9: AgentQualityFilters Component

**Files:**
- Create: `src/features/agent-quality/components/agent-quality-filters.tsx`

- [ ] **Step 1: Filters component**

`src/features/agent-quality/components/agent-quality-filters.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/features/agent-quality/components/agent-quality-filters.tsx
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/components/agent-quality-filters.tsx && \
git commit -m "feat(agent-quality): add Filters (windowDays select + lowSignal toggle)"
```

---

### Task 10: AgentQualitySnapshotTable

**Files:**
- Create: `src/features/agent-quality/components/agent-quality-snapshot-table.tsx`

- [ ] **Step 1: Snapshot table component**

`src/features/agent-quality/components/agent-quality-snapshot-table.tsx`:

```tsx
import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency } from '@/lib/utils'
import { RatePill } from './rate-pill'
import type { AgentQualitySnapshotRow } from '../types'

export interface AgentQualitySnapshotTableProps {
  rows: AgentQualitySnapshotRow[]
  selectedCompanyId: string | null
  onSelect: (companyId: string) => void
  showLowSignal: boolean
}

function pickPrimaryRole(costByRole: Record<string, number>): string {
  let best = ''
  let max = -1
  for (const [role, value] of Object.entries(costByRole)) {
    if (value > max) {
      max = value
      best = role
    }
  }
  return best || '—'
}

export function AgentQualitySnapshotTable({
  rows,
  selectedCompanyId,
  onSelect,
  showLowSignal,
}: AgentQualitySnapshotTableProps) {
  const visible = useMemo(() => {
    if (showLowSignal) return rows
    return rows.filter((r) => !r.lowSignal)
  }, [rows, showLowSignal])

  if (visible.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Henüz kalite verisi yok.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Şirket</TableHead>
            <TableHead className="text-right">Turns</TableHead>
            <TableHead className="text-right">Guardrail</TableHead>
            <TableHead className="text-right">Retry</TableHead>
            <TableHead className="text-right">Follow-Up</TableHead>
            <TableHead className="text-right">Retr Q</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead>Primary Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((row) => (
            <TableRow
              key={row.companyId}
              data-state={
                selectedCompanyId === row.companyId ? 'selected' : undefined
              }
              onClick={() => onSelect(row.companyId)}
              className={cn(
                'cursor-pointer',
                row.lowSignal && 'opacity-60'
              )}
            >
              <TableCell className="font-medium">
                {row.companyName ?? <i>(adı yok)</i>}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.assistantTurns}
              </TableCell>
              <TableCell className="text-right">
                <RatePill value={row.lowSignal ? null : row.guardrailFireRate} />
              </TableCell>
              <TableCell className="text-right">
                <RatePill value={row.lowSignal ? null : row.retryExhaustedRate} />
              </TableCell>
              <TableCell className="text-right">
                <RatePill value={row.lowSignal ? null : row.forceFollowUpRate} />
              </TableCell>
              <TableCell className="text-right">
                <RatePill
                  value={
                    row.lowSignal
                      ? null
                      : row.retrievalQualityBySource.aggregate
                  }
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(row.totalCostUsd)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {pickPrimaryRole(row.costByRole)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/features/agent-quality/components/agent-quality-snapshot-table.tsx
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/components/agent-quality-snapshot-table.tsx && \
git commit -m "feat(agent-quality): add SnapshotTable (sortable, low-signal toggle, row select)"
```

---

### Task 11: AgentQualityTrendPanel (4 sparklines + cost stacked bar)

**Files:**
- Create: `src/features/agent-quality/components/agent-quality-cost-stacked-bar.tsx`
- Create: `src/features/agent-quality/components/agent-quality-trend-panel.tsx`

- [ ] **Step 1: Cost stacked bar component**

X ekseni trend'in `series.date` listesi (length === windowDays). `costByRoleSeries` sparse — eksik günler stack'te boş kalır.

`src/features/agent-quality/components/agent-quality-cost-stacked-bar.tsx`:

```tsx
import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type {
  AgentQualityCostSeriesDay,
  AgentQualityTrendDay,
} from '../types'

const ROLE_ORDER = ['chat', 'toolStep', 'embedding', 'qualityEval', 'other']

const ROLE_FILL: Record<string, string> = {
  chat: '#3b82f6',
  toolStep: '#8b5cf6',
  embedding: '#10b981',
  qualityEval: '#f59e0b',
  other: '#9ca3af',
}

const ROLE_LABEL: Record<string, string> = {
  chat: 'Chat',
  toolStep: 'Tool Step',
  embedding: 'Embedding',
  qualityEval: 'Quality Eval',
  other: 'Diğer',
}

export interface AgentQualityCostStackedBarProps {
  series: AgentQualityTrendDay[]
  costSeries: AgentQualityCostSeriesDay[]
}

export function AgentQualityCostStackedBar({
  series,
  costSeries,
}: AgentQualityCostStackedBarProps) {
  const data = useMemo(() => {
    const costByDate = new Map<string, Record<string, number>>()
    for (const c of costSeries) costByDate.set(c.date, c.byRole)
    return series.map((day) => {
      const byRole = costByDate.get(day.date) ?? {}
      return {
        date: day.date,
        chat: byRole.chat,
        toolStep: byRole.toolStep,
        embedding: byRole.embedding,
        qualityEval: byRole.qualityEval,
        other: byRole.other,
        // Marker for tooltip — true if ANY role logged on this date.
        hasCost: Object.keys(byRole).length > 0,
      }
    })
  }, [series, costSeries])

  const allEmpty = data.every((d) => !d.hasCost)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Maliyet — Role'a Göre</CardTitle>
      </CardHeader>
      <CardContent>
        {allEmpty ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Bu pencerede AI usage yok.
          </div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    formatCurrency(v),
                    ROLE_LABEL[name] ?? name,
                  ]}
                  labelFormatter={(l: string) => l}
                />
                <Legend
                  formatter={(value: string) => ROLE_LABEL[value] ?? value}
                />
                {ROLE_ORDER.map((role) => (
                  <Bar
                    key={role}
                    dataKey={role}
                    stackId="cost"
                    fill={ROLE_FILL[role]}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Trend panel component**

`src/features/agent-quality/components/agent-quality-trend-panel.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { TrendSparkline, type TrendSparklinePoint } from './trend-sparkline'
import { AgentQualityCostStackedBar } from './agent-quality-cost-stacked-bar'
import type {
  AgentQualityMetric,
  AgentQualityTrendResponse,
} from '../types'

export interface AgentQualityTrendPanelProps {
  companyId: string
  companyName: string | null
  windowDays: number
  data: AgentQualityTrendResponse | undefined
  isLoading: boolean
  isError: boolean
  onBarClick: (date: string, metric: AgentQualityMetric) => void
  onClose: () => void
}

function pickPoints(
  series: AgentQualityTrendResponse['series'],
  field: keyof AgentQualityTrendResponse['series'][number]
): TrendSparklinePoint[] {
  return series.map((d) => ({
    date: d.date,
    value: (d[field] as number | null) ?? null,
  }))
}

export function AgentQualityTrendPanel({
  companyName,
  windowDays,
  data,
  isLoading,
  isError,
  onBarClick,
  onClose,
}: AgentQualityTrendPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          {companyName ?? '(adı yok)'} — {windowDays} günlük trend
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Kapat">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Trend yükleniyor…
          </div>
        )}
        {isError && (
          <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
            Trend yüklenemedi. Şirket erişilebilir değil olabilir.
          </div>
        )}
        {data && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <TrendSparkline
                label="Guardrail Fire Rate"
                data={pickPoints(data.series, 'guardrailFireRate')}
                onPointClick={(date) => onBarClick(date, 'guardrail')}
              />
              <TrendSparkline
                label="Retry Exhausted Rate"
                data={pickPoints(data.series, 'retryExhaustedRate')}
                onPointClick={(date) => onBarClick(date, 'retry')}
              />
              <TrendSparkline
                label="Force Follow-Up Rate (?)"
                data={pickPoints(data.series, 'forceFollowUpRate')}
                onPointClick={(date) => onBarClick(date, 'force_followup')}
              />
              <TrendSparkline
                label="Retrieval Quality"
                data={pickPoints(data.series, 'retrievalQualityScore')}
              />
            </div>
            <AgentQualityCostStackedBar
              series={data.series}
              costSeries={data.costByRoleSeries}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/features/agent-quality/components/agent-quality-cost-stacked-bar.tsx src/features/agent-quality/components/agent-quality-trend-panel.tsx
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/components/agent-quality-cost-stacked-bar.tsx \
        src/features/agent-quality/components/agent-quality-trend-panel.tsx && \
git commit -m "feat(agent-quality): add TrendPanel (4 sparklines + cost stacked bar)"
```

---

### Task 12: AgentQualityTurnsDrawer

**Files:**
- Create: `src/features/agent-quality/components/agent-quality-turns-drawer.tsx`

- [ ] **Step 1: Drawer component**

`src/features/agent-quality/components/agent-quality-turns-drawer.tsx`:

```tsx
import { Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { MetricLabel } from './metric-label'
import { useAgentQualityTurns } from '../hooks/use-agent-quality-turns'
import {
  TURNS_PAGE_SIZE,
  type AgentQualityMetric,
  type MetricReason,
} from '../types'

export interface AgentQualityTurnsDrawerParams {
  companyId: string
  metric: AgentQualityMetric
  date: string
  page: number
}

export interface AgentQualityTurnsDrawerProps {
  params: AgentQualityTurnsDrawerParams | null
  onClose: () => void
  onPageChange: (page: number) => void
}

function ReasonCodes({ reason }: { reason: MetricReason }) {
  if (reason.metric === 'guardrail') {
    const codes = Array.isArray(reason.blockingReasonCodes)
      ? reason.blockingReasonCodes
      : []
    if (codes.length === 0) {
      return (
        <span className="text-xs text-muted-foreground">(no codes)</span>
      )
    }
    return (
      <div className="flex flex-wrap gap-1">
        {codes.map((code) => (
          <Badge key={code} variant="secondary" className="text-xs">
            {code}
          </Badge>
        ))}
      </div>
    )
  }
  if (reason.metric === 'retry') {
    return (
      <Badge variant="secondary" className="text-xs">
        retry_exhausted
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-xs">
      force_follow_up
    </Badge>
  )
}

export function AgentQualityTurnsDrawer({
  params,
  onClose,
  onPageChange,
}: AgentQualityTurnsDrawerProps) {
  const open = params != null
  const query = useAgentQualityTurns(open ? params : null)
  const data = query.data
  const totalPages = data ? Math.max(1, Math.ceil(data.total / TURNS_PAGE_SIZE)) : 1
  const currentPage = params?.page ?? 1

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {params ? (
              <>
                {params.date} · <MetricLabel metric={params.metric} />
              </>
            ) : (
              'Turn detayları'
            )}
          </SheetTitle>
          <SheetDescription>
            {data
              ? `Toplam ${data.total} fire eden turn`
              : 'Turn listesi yükleniyor…'}
          </SheetDescription>
        </SheetHeader>

        {query.isLoading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yükleniyor…
          </div>
        )}

        {query.isError && (
          <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
            Turn listesi yüklenemedi. Tarih veya filtre geçersiz olabilir.
          </div>
        )}

        {data && data.total === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Bu günde fire eden turn yok.
          </div>
        )}

        {data && data.total > 0 && (
          <>
            <ul className="divide-y">
              {data.turns.map((turn) => (
                <li key={turn.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(turn.createdAt).toUTCString().slice(17, 25)}{' '}
                      UTC
                    </span>
                    <span className="tabular-nums">
                      {formatCurrency(turn.costUsd)} · {turn.inputTokens}↑/
                      {turn.outputTokens}↓ · {turn.modelName}
                    </span>
                  </div>
                  {turn.contentPreview && (
                    <p className="mt-1 italic text-foreground/80 line-clamp-3">
                      "{turn.contentPreview}"
                    </p>
                  )}
                  <div className="mt-1">
                    <ReasonCodes reason={turn.metricReason} />
                  </div>
                  <div className="mt-1 text-xs">
                    Conversation:{' '}
                    <code className="rounded bg-muted px-1 py-0.5">
                      {turn.conversationId}
                    </code>
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                >
                  ‹ Önceki
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                >
                  Sonraki ›
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/features/agent-quality/components/agent-quality-turns-drawer.tsx
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/components/agent-quality-turns-drawer.tsx && \
git commit -m "feat(agent-quality): add TurnsDrawer (Sheet, paginated, defensive metricReason)"
```

---

### Task 13: AgentQualityPage (compose + URL state)

**Files:**
- Create: `src/features/agent-quality/pages/agent-quality-page.tsx`

URL invariants (spec §4.1):
- `trendDate` ↔ `metric` ↔ `page` üçü birlikte; bir tanesi eksikse hepsi temizlenir
- Drawer windowDays change'inde: yeni window'un `series.date[]`'inde drawer'ın `trendDate`'i yoksa drawer kapanır

- [ ] **Step 1: Page component**

`src/features/agent-quality/pages/agent-quality-page.tsx`:

```tsx
import { useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { AgentQualityFilters } from '../components/agent-quality-filters'
import { AgentQualitySnapshotTable } from '../components/agent-quality-snapshot-table'
import { AgentQualityTrendPanel } from '../components/agent-quality-trend-panel'
import { AgentQualityTurnsDrawer } from '../components/agent-quality-turns-drawer'
import { useAgentQualitySnapshot } from '../hooks/use-agent-quality-snapshot'
import { useAgentQualityTrend } from '../hooks/use-agent-quality-trend'
import {
  TURNS_PAGE_MAX,
  clampPage,
  clampWindowDays,
  isAgentQualityMetric,
  isYmd,
  type AgentQualityMetric,
  type WindowDaysOption,
} from '../types'

interface AgentQualityUrlState {
  windowDays: WindowDaysOption
  company: string | null
  trendDate: string | null
  metric: AgentQualityMetric | null
  page: number
  showLowSignal: boolean
}

const DEFAULTS: AgentQualityUrlState = {
  windowDays: 7,
  company: null,
  trendDate: null,
  metric: null,
  page: 1,
  showLowSignal: false,
}

function parse(params: URLSearchParams): AgentQualityUrlState {
  const windowDays = clampWindowDays(Number(params.get('windowDays')))
  const company = params.get('company') || null

  const rawDate = params.get('trendDate')
  const rawMetric = params.get('metric')
  const rawPage = Number(params.get('page'))

  // Drawer URL invariant — date+metric+page üçü birlikte; eksikse hepsi null.
  const dateValid = rawDate ? isYmd(rawDate) : false
  const metricValid = rawMetric ? isAgentQualityMetric(rawMetric) : false
  const allThree = dateValid && metricValid

  return {
    windowDays,
    company,
    trendDate: allThree ? rawDate : null,
    metric: allThree ? (rawMetric as AgentQualityMetric) : null,
    page: allThree ? clampPage(rawPage, TURNS_PAGE_MAX) : 1,
    showLowSignal: params.get('lowSignal') === '1',
  }
}

function serialize(value: AgentQualityUrlState): Record<string, string | undefined> {
  const drawerOpen =
    value.trendDate != null && value.metric != null
  return {
    windowDays: value.windowDays === 7 ? undefined : String(value.windowDays),
    company: value.company ?? undefined,
    trendDate: drawerOpen ? value.trendDate ?? undefined : undefined,
    metric: drawerOpen ? value.metric ?? undefined : undefined,
    page: drawerOpen && value.page > 1 ? String(value.page) : undefined,
    lowSignal: value.showLowSignal ? '1' : undefined,
  }
}

const URL_STATE_OPTS = { defaults: DEFAULTS, parse, serialize }

export function AgentQualityPage() {
  const [state, setState] = useUrlFilterState<AgentQualityUrlState>(
    URL_STATE_OPTS
  )

  const snapshot = useAgentQualitySnapshot(state.windowDays)
  const trend = useAgentQualityTrend(state.company, state.windowDays)

  const selectedRow = useMemo(
    () =>
      snapshot.data?.tenants.find((t) => t.companyId === state.company) ??
      null,
    [snapshot.data, state.company]
  )

  // Spec §6: drawer açıkken windowDays değişirse, yeni window'da date varsa
  // drawer açık kalır; yoksa kapanır.
  useEffect(() => {
    if (state.trendDate && trend.data) {
      const exists = trend.data.series.some((s) => s.date === state.trendDate)
      if (!exists) {
        setState({ trendDate: null, metric: null, page: 1 })
      }
    }
  }, [state.trendDate, trend.data, setState])

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Agent Kalite</h1>
        {snapshot.data && (
          <p className="text-sm text-muted-foreground">
            Generated at{' '}
            {new Date(snapshot.data.generatedAt).toUTCString()}
          </p>
        )}
      </header>

      <AgentQualityFilters
        windowDays={state.windowDays}
        onWindowDaysChange={(v) =>
          setState({ windowDays: v, trendDate: null, metric: null, page: 1 })
        }
        showLowSignal={state.showLowSignal}
        onShowLowSignalChange={(v) => setState({ showLowSignal: v })}
        tenantsBelowSignalThreshold={
          snapshot.data?.tenantsBelowSignalThreshold ?? 0
        }
      />

      {snapshot.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Snapshot yükleniyor…
        </div>
      )}
      {snapshot.isError && (
        <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
          Snapshot yüklenemedi.
        </div>
      )}
      {snapshot.data && (
        <AgentQualitySnapshotTable
          rows={snapshot.data.tenants}
          selectedCompanyId={state.company}
          onSelect={(companyId) =>
            setState({
              company: companyId === state.company ? null : companyId,
              trendDate: null,
              metric: null,
              page: 1,
            })
          }
          showLowSignal={state.showLowSignal}
        />
      )}

      {state.company && (
        <AgentQualityTrendPanel
          companyId={state.company}
          companyName={selectedRow?.companyName ?? null}
          windowDays={state.windowDays}
          data={trend.data}
          isLoading={trend.isLoading}
          isError={trend.isError}
          onBarClick={(date, metric) =>
            setState({ trendDate: date, metric, page: 1 })
          }
          onClose={() =>
            setState({
              company: null,
              trendDate: null,
              metric: null,
              page: 1,
            })
          }
        />
      )}

      <AgentQualityTurnsDrawer
        params={
          state.company && state.trendDate && state.metric
            ? {
                companyId: state.company,
                metric: state.metric,
                date: state.trendDate,
                page: state.page,
              }
            : null
        }
        onClose={() =>
          setState({ trendDate: null, metric: null, page: 1 })
        }
        onPageChange={(page) => setState({ page })}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/features/agent-quality/pages/agent-quality-page.tsx
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/pages/agent-quality-page.tsx && \
git commit -m "feat(agent-quality): wire AgentQualityPage — URL state, drawer invariant, windowDays effect"
```

---

### Task 14: AgentQualityAlertsFilters + AgentQualityAlertsTable

**Files:**
- Create: `src/features/agent-quality/components/agent-quality-alerts-filters.tsx`
- Create: `src/features/agent-quality/components/agent-quality-alerts-table.tsx`

- [ ] **Step 1: Alerts filters**

`src/features/agent-quality/components/agent-quality-alerts-filters.tsx`:

```tsx
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
```

- [ ] **Step 2: Alerts table**

`src/features/agent-quality/components/agent-quality-alerts-table.tsx`:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MetricLabel } from './metric-label'
import type { AgentQualityAlertRow } from '../types'

function formatUtc(iso: string, baseIso?: string): string {
  const d = new Date(iso)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const ymd = d.toISOString().slice(0, 10)
  const baseYmd = baseIso ? new Date(baseIso).toISOString().slice(0, 10) : ymd
  return ymd === baseYmd
    ? `${hh}:${mm} UTC`
    : `${ymd.slice(5)} ${hh}:${mm} UTC`
}

export interface AgentQualityAlertsTableProps {
  rows: AgentQualityAlertRow[]
  onRowClick: (row: AgentQualityAlertRow) => void
}

export function AgentQualityAlertsTable({
  rows,
  onRowClick,
}: AgentQualityAlertsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Aktif alarm yok.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Şirket</TableHead>
            <TableHead>Metric</TableHead>
            <TableHead className="text-right">Value / Threshold</TableHead>
            <TableHead className="text-right">Turns</TableHead>
            <TableHead>Fired</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => onRowClick(row)}
            >
              <TableCell className="font-medium">
                {row.companyName ?? <i>(adı yok)</i>}
              </TableCell>
              <TableCell>
                <MetricLabel metric={row.metric} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(row.value * 100).toFixed(1)}% /{' '}
                {(row.threshold * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.assistantTurns}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatUtc(row.firedAt)}
              </TableCell>
              <TableCell>
                {row.resolvedAt ? (
                  <Badge variant="secondary">
                    Resolved {formatUtc(row.resolvedAt, row.firedAt)}
                  </Badge>
                ) : (
                  <Badge variant="destructive">Open</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/features/agent-quality/components/agent-quality-alerts-filters.tsx src/features/agent-quality/components/agent-quality-alerts-table.tsx
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/components/agent-quality-alerts-filters.tsx \
        src/features/agent-quality/components/agent-quality-alerts-table.tsx && \
git commit -m "feat(agent-quality): add AlertsFilters + AlertsTable (XSS-safe, UTC formatting)"
```

---

### Task 15: AgentQualityAlertsPage (compose + URL state + smart trend nav)

**Files:**
- Create: `src/features/agent-quality/pages/agent-quality-alerts-page.tsx`

Spec §5.2: row click → trend'e `firedAt`'in UTC günü + metric ile navigate; window auto-expand fallback.

- [ ] **Step 1: Page component**

`src/features/agent-quality/pages/agent-quality-alerts-page.tsx`:

```tsx
import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { Button } from '@/components/ui/button'
import { AgentQualityAlertsFilters } from '../components/agent-quality-alerts-filters'
import { AgentQualityAlertsTable } from '../components/agent-quality-alerts-table'
import { useAgentQualityAlerts } from '../hooks/use-agent-quality-alerts'
import {
  ALERTS_PAGE_MAX,
  ALERTS_PAGE_SIZE,
  clampPage,
  isAgentQualityMetric,
  type AgentQualityMetric,
  type AgentQualityAlertRow,
} from '../types'

interface AlertsUrlState {
  status: 'open' | 'all'
  company: string | null
  metric: AgentQualityMetric | null
  page: number
}

const DEFAULTS: AlertsUrlState = {
  status: 'open',
  company: null,
  metric: null,
  page: 1,
}

function parse(params: URLSearchParams): AlertsUrlState {
  const rawStatus = params.get('status')
  const rawMetric = params.get('metric')
  return {
    status: rawStatus === 'all' ? 'all' : 'open',
    company: params.get('company') || null,
    metric: rawMetric && isAgentQualityMetric(rawMetric) ? rawMetric : null,
    page: clampPage(Number(params.get('page')), ALERTS_PAGE_MAX),
  }
}

function serialize(value: AlertsUrlState): Record<string, string | undefined> {
  return {
    status: value.status === 'open' ? undefined : value.status,
    company: value.company ?? undefined,
    metric: value.metric ?? undefined,
    page: value.page > 1 ? String(value.page) : undefined,
  }
}

const URL_STATE_OPTS = { defaults: DEFAULTS, parse, serialize }

function pickWindowForFire(firedAt: string): 7 | 30 | 90 {
  const fired = new Date(firedAt)
  const now = new Date()
  const days = Math.ceil((now.getTime() - fired.getTime()) / 86_400_000)
  if (days <= 7) return 7
  if (days <= 30) return 30
  return 90
}

export function AgentQualityAlertsPage() {
  const navigate = useNavigate()
  const [state, setState] = useUrlFilterState<AlertsUrlState>(URL_STATE_OPTS)

  const filters = useMemo(
    () => ({
      status: state.status,
      companyId: state.company ?? undefined,
      metric: state.metric ?? undefined,
      page: state.page,
      pageSize: ALERTS_PAGE_SIZE,
    }),
    [state]
  )

  const query = useAgentQualityAlerts(filters)
  const data = query.data
  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / ALERTS_PAGE_SIZE))
    : 1

  function handleRowClick(row: AgentQualityAlertRow) {
    const firedDay = row.firedAt.slice(0, 10)
    const window = pickWindowForFire(row.firedAt)
    const fireWithinWindow = (() => {
      const fired = new Date(`${firedDay}T00:00:00Z`)
      const now = new Date()
      const start = new Date(now)
      start.setUTCDate(start.getUTCDate() - (window - 1))
      start.setUTCHours(0, 0, 0, 0)
      return fired.getTime() >= start.getTime()
    })()
    const params = new URLSearchParams()
    if (window !== 7) params.set('windowDays', String(window))
    params.set('company', row.companyId)
    if (fireWithinWindow) {
      params.set('trendDate', firedDay)
      params.set('metric', row.metric)
    }
    navigate(`/admin/agent-quality?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Alerts</h1>
          <p className="text-xs text-muted-foreground">
            Alarmlar 15 dk cron ile yenilenir.
          </p>
        </div>
      </header>

      <AgentQualityAlertsFilters
        value={{
          status: state.status,
          companyId: state.company,
          metric: state.metric,
        }}
        onChange={(next) =>
          setState({
            ...state,
            status: next.status ?? state.status,
            company:
              next.companyId === undefined ? state.company : next.companyId,
            metric: next.metric === undefined ? state.metric : next.metric,
            page: 1,
          })
        }
      />

      {query.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
        </div>
      )}
      {query.isError && (
        <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
          Alarm listesi yüklenemedi.
        </div>
      )}
      {data && (
        <>
          <AgentQualityAlertsTable
            rows={data.alerts}
            onRowClick={handleRowClick}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={state.page <= 1}
                onClick={() => setState({ page: state.page - 1 })}
              >
                ‹ Önceki
              </Button>
              <span className="text-xs text-muted-foreground">
                {state.page} / {totalPages} ({data.total} alarm)
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={state.page >= totalPages}
                onClick={() => setState({ page: state.page + 1 })}
              >
                Sonraki ›
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/features/agent-quality/pages/agent-quality-alerts-page.tsx
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/features/agent-quality/pages/agent-quality-alerts-page.tsx && \
git commit -m "feat(agent-quality): wire AlertsPage — filters + smart trend nav (firedAt+window)"
```

---

### Task 16: AlertCountBadge Component

**Files:**
- Create: `src/components/layout/alert-count-badge.tsx`

- [ ] **Step 1: Badge component**

`src/components/layout/alert-count-badge.tsx`:

```tsx
import { useAgentQualityAlertCount } from '@/features/agent-quality/hooks/use-agent-quality-alert-count'
import { cn } from '@/lib/utils'

export interface AlertCountBadgeProps {
  className?: string
}

export function AlertCountBadge({ className }: AlertCountBadgeProps) {
  const { data } = useAgentQualityAlertCount()
  const count = data?.open ?? 0

  if (count === 0) return null

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`${count} açık alarm`}
      className={cn(
        'absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground tabular-nums',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
```

- [ ] **Step 2: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/components/layout/alert-count-badge.tsx
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/components/layout/alert-count-badge.tsx && \
git commit -m "feat(layout): add AlertCountBadge (aria-live, hides at 0, 99+ cap)"
```

---

### Task 17: Sidebar Update + Lazy Routes Wiring

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Sidebar — add Agent Kalite + Alerts items with badge**

Edit `src/components/layout/sidebar.tsx`:

Replace the imports line (line 2):

```tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Settings, LogOut, Mail, KeyRound, BookOpen, Activity, Gauge, Bell } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { AlertCountBadge } from './alert-count-badge'
```

Replace the `platformItems` array:

```tsx
const platformItems: Array<{
  to: string
  icon: typeof Activity
  label: string
  badge?: 'agent-quality-alerts'
}> = [
  { to: '/admin/cost-health', icon: Activity, label: 'Cost Health' },
  { to: '/admin/agent-quality', icon: Gauge, label: 'Agent Kalite' },
  {
    to: '/admin/agent-quality/alerts',
    icon: Bell,
    label: 'Alerts',
    badge: 'agent-quality-alerts',
  },
]
```

Replace the `renderNavItem` function:

```tsx
function renderNavItem(item: {
  to: string
  icon: typeof Activity
  label: string
  badge?: 'agent-quality-alerts'
}) {
  return (
    <Tooltip key={item.to}>
      <TooltipTrigger
        render={
          <NavLink
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.badge === 'agent-quality-alerts' && <AlertCountBadge />}
          </NavLink>
        }
      />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}
```

(Note: the `relative` class on the NavLink is required for the badge's `absolute` positioning.)

- [ ] **Step 2: App.tsx — add lazy routes**

Edit `src/App.tsx`. After the existing `CostHealthPage` lazy import:

```tsx
const AgentQualityPage = lazy(() =>
  import('@/features/agent-quality/pages/agent-quality-page').then((m) => ({
    default: m.AgentQualityPage,
  }))
)
const AgentQualityAlertsPage = lazy(() =>
  import('@/features/agent-quality/pages/agent-quality-alerts-page').then(
    (m) => ({ default: m.AgentQualityAlertsPage })
  )
)
```

After the existing `<Route path="/admin/cost-health" ...>` block, add:

```tsx
              <Route
                path="/admin/agent-quality"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <AgentQualityPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin/agent-quality/alerts"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <AgentQualityAlertsPage />
                  </Suspense>
                }
              />
```

- [ ] **Step 3: Verify TypeScript + Lint**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
npx tsc --noEmit && \
npx eslint src/App.tsx src/components/layout/sidebar.tsx
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git add src/App.tsx src/components/layout/sidebar.tsx && \
git commit -m "feat(routes): add lazy /admin/agent-quality + /alerts routes + sidebar items"
```

---

### Task 18: Manual Smoke + Build Verification

**Files:**
- (None — verification only)

- [ ] **Step 1: Production build**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npm run build
```
Expected: Build success. Note any warnings about chunk sizes; agent-quality routes should appear as separate chunks.

- [ ] **Step 2: Dev server smoke test**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npm run dev
```

Open the dev server URL (default `http://localhost:5173`) and login as platform admin. Walk through these scenarios in order:

1. **Snapshot landing** — Navigate to `/admin/agent-quality`. Tablo gelmeli, header'da `Generated at ...UTC` görünmeli, default windowDays=7.
2. **Window change** — Pencere select'ini 30 güne çevir. URL `?windowDays=30` olmalı, tablo refetch olmalı.
3. **Low-signal toggle** — Switch'i aç → low-signal row'ları görünmeli, kapan → kaybolmalı. URL `?lowSignal=1`.
4. **Row select** — Bir row'a tıkla. URL `&company=<uuid>` olmalı, trend panel açılmalı, 4 sparkline + cost stacked bar render olmalı.
5. **Sparkline gap** — Tablo'da boş gün varsa sparkline o günde gap göstermeli (line connect etmemeli).
6. **Cost gap** — Cost stacked bar'da `costByRoleSeries` sparse ise eksik günler boş kalmalı (zero-stack değil).
7. **Trend bar click** — Sparkline'da bir noktaya tıkla. URL `&trendDate=YYYY-MM-DD&metric=guardrail` eklenmeli, drawer açılmalı, turn listesi gelmeli.
8. **Null bar click** — Boş günde tıkla; drawer açılmamalı.
9. **Drawer pagination** — Total > 20 ise pagination çalışmalı, URL `&page=2` olmalı.
10. **Drawer close** — Drawer'ı kapat (Esc veya X). Trend panel açık kalmalı, URL'den drawer paramları temizlenmeli.
11. **Drawer + windowDays change** — Drawer açıkken window'u küçült (30→7). Eğer drawer'ın günü yeni window dışındaysa drawer otomatik kapanmalı.
12. **Trend close** — Trend panel'ın X'ine tıkla. URL'den `company` ve drawer paramları temizlenmeli.
13. **Alerts page** — `/admin/agent-quality/alerts` → liste gelmeli. Default `status=open`.
14. **Alerts filter** — Status all yap, company ve metric filtreleri çalışmalı.
15. **Alerts → trend nav** — Bir alarm row'una tıkla. `/admin/agent-quality?...` URL'i `company=X&trendDate=Y&metric=Z` ile gelmeli (alarmın fire ettiği gün ≤90 gün önceyse), drawer açık gelmeli.
16. **Alerts old fire** — `firedAt > 90 gün` olan alarm varsa: row click → trend açık, drawer kapalı (fallback).
17. **Sidebar badge** — `/admin/agent-quality/alerts/count` response'undaki sayı sidebar Alerts ikonunda kırmızı pill olarak görünmeli. Sayı 0 ise badge yok.
18. **Deep-link** — `/admin/agent-quality?windowDays=30&company=<uuid>&trendDate=YYYY-MM-DD&metric=guardrail&page=2` URL'ini doğrudan aç. Direkt drawer açık gelmeli.
19. **URL invariants** — `/admin/agent-quality?trendDate=YYYY-MM-DD` (metric eksik) URL'ini aç. Drawer açılmamalı; URL `trendDate` param'ı normalize sırasında silinmeli.
20. **Window selector clamp** — `/admin/agent-quality?windowDays=999` URL'ini aç. Select 7'ye düşmeli.
21. **XSS** — Eğer test datasında özel karakterli company name varsa (`<script>` veya benzeri) tablo'da düz text olarak görünmeli, execute olmamalı.

- [ ] **Step 3: Bundle delta inspection**

Run:
```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npm run build 2>&1 | grep -E "agent-quality|cost-health|index"
```
Expected: `agent-quality-page-*.js` ve `agent-quality-alerts-page-*.js` ayrı chunk'lar olarak görünmeli, recharts paylaşılan chunk'tan beslenmeli.

- [ ] **Step 4: Commit (smoke notes)**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && \
git commit --allow-empty -m "$(cat <<'EOF'
chore(agent-quality): manual smoke complete (Phase F + F.1 + G)

Verified: snapshot table, trend panel sparklines + cost stacked bar,
turns drawer with pagination, alerts list with smart trend nav,
sidebar badge polling, URL state deep-linkability + invariants,
windowDays clamp, drawer auto-close on window narrow.

Bundle: 2 new lazy chunks (agent-quality + alerts), recharts shared
with cost-health.
EOF
)"
```

---

## Spec Coverage Self-Review

Before marking the plan as complete, walked through each spec section to confirm task coverage:

- §2 Kapsam (içinde) — Tasks 1-17 cover all enumerated items: 2 routes (T17), 5 hooks (T3-5), types (T1), 3 primitives (T7-8), 4+3 components (T9-15), sidebar (T17), query keys (T2), URL state (T13, T15), all loading/error/empty states.
- §3.1 Routes & Lazy — T17.
- §3.2 Klasör — T1, T3-15 establish files exactly per spec layout.
- §3.3 Query Keys — T2.
- §3.4 Types — T1 (incl. METRIC_META, caps, helpers).
- §3.5 Cache stratejisi — T3-5 (each hook sets staleTime + polling per table).
- §3.6 Input clamping — T1 (helpers) + T13/T15 (parse calls them).
- §4.1/4.2 UI layouts — T9-15.
- §4.3 Sidebar — T17.
- §5 Veri akışı — T13, T15 (orchestration).
- §6 Edge cases — distributed: loading/error/empty in T11/T12/T13/T15; null gap in T8/T11; XSS in T7/T10/T12/T14; drawer windowDays effect in T13; URL invariant in T13/T15; null sort in T10; cost legend order in T11.
- §7 Component contracts — T7-15 implement all listed props.
- §8 Test approach — T18 (smoke + build).
- §9 Bundle — T18.

No gaps detected.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-26-agent-quality.md`.** Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task, two-stage review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

**Which approach?**
