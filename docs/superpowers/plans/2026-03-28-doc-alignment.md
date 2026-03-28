# Doc Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align super admin frontend with updated backend documentation — fix type mismatches, add agent metrics to analytics tab, build data sources UI.

**Architecture:** Three independent change areas: (1) type/schema quick fixes across existing files, (2) new agent metrics hook + analytics tab section, (3) new data sources tab component + dashboard KPI cards. All changes are UI-only with MSW mock data.

**Tech Stack:** React 19, TypeScript, TanStack Query, Tailwind CSS, shadcn/ui, Recharts, MSW (mocks), Vite

**Verification:** No test framework — use `npm run build` (tsc + vite build) to verify type correctness after each task.

---

### Task 1: Type & Schema Quick Fixes

**Files:**
- Modify: `src/features/companies/types.ts:119-126`
- Modify: `src/lib/validations.ts:90-93`
- Modify: `src/features/companies/components/analytics-tab.tsx:19-24`
- Modify: `src/features/companies/components/config-tab.tsx:130-133`
- Modify: `src/features/settings/pages/settings-page.tsx:128-131`
- Modify: `src/mocks/data.ts:243,369-372`

- [ ] **Step 1: Fix DataSourceType — remove extra fields**

In `src/features/companies/types.ts`, replace:

```typescript
export interface DataSourceType {
  type: string
  label: string
  description: string
  enabled: boolean
  addedCount: number
  maxSources: number
}
```

With:

```typescript
export interface DataSourceType {
  type: string
  label: string
  description: string
}
```

- [ ] **Step 2: Fix mock DataSourceTypes — remove extra fields**

In `src/mocks/data.ts`, replace:

```typescript
export const mockDataSourceTypes = [
  { type: 'website_crawler', label: 'Website Crawler', description: 'Web sitenizi tarayarak bilgi tabanına ekler', enabled: true, addedCount: 4, maxSources: 5 },
]
```

With:

```typescript
export const mockDataSourceTypes = [
  { type: 'website_crawler', label: 'Website Crawler', description: 'Web sitenizi tarayarak bilgi tabanına ekler' },
]
```

- [ ] **Step 3: Remove crawl fields from limitsConfigSchema**

In `src/lib/validations.ts`, remove these 4 lines (90-93):

```typescript
  crawlMaxPages: z.coerce.number().optional(),
  crawlMaxSources: z.coerce.number().optional(),
  crawlMinIntervalHours: z.coerce.number().optional(),
  crawlConcurrency: z.coerce.number().optional(),
```

The schema should end with `queueConcurrencyAutoTag` followed by `})`.

- [ ] **Step 4: Remove crawl fields from mock platform defaults**

In `src/mocks/data.ts`, remove these 4 lines from `mockPlatformDefaults.limitsConfig` (369-372):

```typescript
    crawlMaxPages: 500,
    crawlMaxSources: 5,
    crawlMinIntervalHours: 24,
    crawlConcurrency: 3,
```

- [ ] **Step 5: Remove crawl form fields from config-tab.tsx**

In `src/features/companies/components/config-tab.tsx`, remove these 4 objects from the limitsConfig fields array (lines 130-133):

```typescript
      { key: 'crawlMaxPages', label: 'Crawl Max Pages', type: 'number', hint: 'Firma basina toplam max taranan sayfa sayisi' },
      { key: 'crawlMaxSources', label: 'Crawl Max Sources', type: 'number', hint: 'Maksimum data source sayisi' },
      { key: 'crawlMinIntervalHours', label: 'Crawl Min Interval (saat)', type: 'number', hint: 'Minimum re-sync araliği (saat)' },
      { key: 'crawlConcurrency', label: 'Crawl Concurrency', type: 'number', hint: 'Paralel sync sayisi' },
```

- [ ] **Step 6: Remove crawl form fields from settings-page.tsx**

In `src/features/settings/pages/settings-page.tsx`, remove these 4 objects from the limitsConfig fields array (lines 128-131):

```typescript
      { key: 'crawlMaxPages', label: 'Crawl Max Pages', type: 'number', hint: 'Firma basina toplam max taranan sayfa sayisi' },
      { key: 'crawlMaxSources', label: 'Crawl Max Sources', type: 'number', hint: 'Maksimum data source sayisi' },
      { key: 'crawlMinIntervalHours', label: 'Crawl Min Interval (saat)', type: 'number', hint: 'Minimum re-sync araliği (saat)' },
      { key: 'crawlConcurrency', label: 'Crawl Concurrency', type: 'number', hint: 'Paralel sync sayisi' },
```

- [ ] **Step 7: Add missing feedback reason labels**

In `src/features/companies/components/analytics-tab.tsx`, replace:

```typescript
const reasonLabels: Record<string, string> = {
  incomplete: 'Eksik Cevap',
  hallucination: 'Halusinasyon',
  wrong_source: 'Yanlis Kaynak',
  irrelevant: 'Alakasiz',
}
```

With:

```typescript
const reasonLabels: Record<string, string> = {
  incomplete: 'Eksik Cevap',
  hallucination: 'Halusinasyon',
  wrong_source: 'Yanlis Kaynak',
  wrong_template: 'Yanlis Sablon',
  irrelevant: 'Alakasiz',
  other: 'Diger',
}
```

- [ ] **Step 8: Build verification**

Run: `npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/features/companies/types.ts src/lib/validations.ts src/features/companies/components/analytics-tab.tsx src/features/companies/components/config-tab.tsx src/features/settings/pages/settings-page.tsx src/mocks/data.ts
git commit -m "fix: align types and schemas with updated backend docs

- Remove enabled/addedCount/maxSources from DataSourceType
- Remove crawl fields from limitsConfig schema and UI
- Add wrong_template and other feedback reason labels"
```

---

### Task 2: Agent Metrics — Types, Hook, Query Key, Mock

**Files:**
- Modify: `src/features/companies/types.ts`
- Create: `src/features/companies/hooks/use-agent-metrics.ts`
- Modify: `src/lib/query-keys.ts`
- Modify: `src/mocks/data.ts`
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: Add AgentMetrics and AgentAlert types**

In `src/features/companies/types.ts`, append after the `DataSourceList` interface at the end of the file:

```typescript
// ─── Agent Metrics ────────────────────────────────

export interface AgentMetrics {
  windowDays: number
  conversations: { total: number; assistantTurnsTotal: number }
  citationCoverage: {
    outputsAnalyzed: number
    outputsWithAnyCitation: number
    outputsWithDocumentCitation: number
    outputsWithKnowledgeCitation: number
    rate: number
    warningReasonCounts: Record<string, number>
    blockingReasonCounts: Record<string, number>
  }
  humanWorkflow: {
    pendingActions: number
    approvedActions: number
    rejectedActions: number
    approvalRate: number
  }
  feedback: {
    total: number
    positive: number
    negative: number
    qualityScore: number
  }
  alerts: AgentAlert[]
}

export interface AgentAlert {
  code: string
  severity: 'warning' | 'critical'
  message: string
  value: number
}
```

- [ ] **Step 2: Add agentMetrics query key**

In `src/lib/query-keys.ts`, add to the `companies` object after the `dataSources` key:

```typescript
    agentMetrics: (id: string, windowDays: number) => ['companies', id, 'agent-metrics', windowDays] as const,
```

- [ ] **Step 3: Create useAgentMetrics hook**

Create `src/features/companies/hooks/use-agent-metrics.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AgentMetrics } from '../types'

export function useAgentMetrics(companyId: string, windowDays: number = 30) {
  return useQuery({
    queryKey: queryKeys.companies.agentMetrics(companyId, windowDays),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentMetrics>(
        `/platform/companies/${companyId}/agent-metrics?windowDays=${windowDays}`
      )
      return data
    },
    enabled: !!companyId,
  })
}
```

- [ ] **Step 4: Add mock agent metrics data**

In `src/mocks/data.ts`, add after the `mockCompanyAnalytics` block (after line 239):

```typescript
// Agent metrics per company
function generateAgentMetrics(companyId: string, scale: number) {
  const total = Math.floor((80 + Math.random() * 120) * scale)
  const assistantTurnsTotal = Math.floor(total * (4 + Math.random() * 3))
  const outputsAnalyzed = assistantTurnsTotal
  const outputsWithAnyCitation = Math.floor(outputsAnalyzed * (0.75 + Math.random() * 0.15))
  const outputsWithDocumentCitation = Math.floor(outputsWithAnyCitation * 0.45)
  const outputsWithKnowledgeCitation = Math.floor(outputsWithAnyCitation * 0.8)
  const rate = +(outputsWithAnyCitation / outputsAnalyzed).toFixed(4)
  const approved = Math.floor((20 + Math.random() * 40) * scale)
  const rejected = Math.floor((1 + Math.random() * 5) * scale)
  const pending = Math.floor(Math.random() * 4 * scale)
  const approvalRate = approved + rejected > 0 ? +((approved / (approved + rejected)).toFixed(4)) : 1
  const fbTotal = Math.floor((60 + Math.random() * 100) * scale)
  const fbPositive = Math.floor(fbTotal * (0.75 + Math.random() * 0.15))
  const qualityScore = +(fbTotal > 0 ? (fbPositive / fbTotal) * 100 : 0).toFixed(2)

  const alerts: Array<{ code: string; severity: 'warning' | 'critical'; message: string; value: number }> = []
  if (rate < 0.6) {
    alerts.push({ code: 'low_citation_coverage', severity: 'warning', message: 'Citation coverage is below 60%', value: rate })
  }
  if (qualityScore < 70) {
    alerts.push({ code: 'low_feedback_quality_score', severity: 'warning', message: 'Quality score is below 70/100', value: qualityScore })
  }
  if (pending >= 10) {
    alerts.push({ code: 'pending_approval_backlog', severity: 'critical', message: '10+ pending approvals', value: pending })
  }

  return {
    windowDays: 30,
    conversations: { total, assistantTurnsTotal },
    citationCoverage: {
      outputsAnalyzed,
      outputsWithAnyCitation,
      outputsWithDocumentCitation,
      outputsWithKnowledgeCitation,
      rate,
      warningReasonCounts: {},
      blockingReasonCounts: {},
    },
    humanWorkflow: { pendingActions: pending, approvedActions: approved, rejectedActions: rejected, approvalRate },
    feedback: { total: fbTotal, positive: fbPositive, negative: fbTotal - fbPositive, qualityScore },
    alerts,
  }
}

export const mockAgentMetrics: Record<string, ReturnType<typeof generateAgentMetrics>> = {}
mockCompanies.forEach((c, i) => {
  mockAgentMetrics[c.id] = generateAgentMetrics(c.id, scales[i] ?? 0.5)
})
// Force one company to have alerts for testing
mockAgentMetrics[mockCompanies[4].id] = {
  ...mockAgentMetrics[mockCompanies[4].id],
  citationCoverage: { ...mockAgentMetrics[mockCompanies[4].id].citationCoverage, rate: 0.45 },
  humanWorkflow: { ...mockAgentMetrics[mockCompanies[4].id].humanWorkflow, pendingActions: 12 },
  alerts: [
    { code: 'low_citation_coverage', severity: 'warning', message: 'Citation coverage is below 60%', value: 0.45 },
    { code: 'pending_approval_backlog', severity: 'critical', message: '10+ pending approvals', value: 12 },
  ],
}
```

- [ ] **Step 5: Add mock agent metrics handler**

In `src/mocks/handlers.ts`, add the import of `mockAgentMetrics` to the import line from `./data`, then add this handler after the analytics handler (after line 295):

```typescript
  // ─── Agent Metrics ────────────────────────────────
  http.get(`${BASE}/platform/companies/:id/agent-metrics`, async ({ params, request }) => {
    await delay(200)
    const id = params.id as string
    const url = new URL(request.url)
    const windowDays = parseInt(url.searchParams.get('windowDays') ?? '30')
    const metrics = mockAgentMetrics[id]
    if (!metrics) return HttpResponse.json({ code: 'company_not_found' }, { status: 404 })
    return HttpResponse.json({ ...metrics, windowDays })
  }),
```

- [ ] **Step 6: Build verification**

Run: `npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/companies/types.ts src/features/companies/hooks/use-agent-metrics.ts src/lib/query-keys.ts src/mocks/data.ts src/mocks/handlers.ts
git commit -m "feat: add agent metrics types, hook, and mock data

- AgentMetrics/AgentAlert types
- useAgentMetrics hook (GET /platform/companies/:id/agent-metrics)
- Mock data with alerts for testing"
```

---

### Task 3: Agent Metrics UI in Analytics Tab

**Files:**
- Modify: `src/features/companies/components/analytics-tab.tsx`

- [ ] **Step 1: Add agent metrics section to analytics tab**

In `src/features/companies/components/analytics-tab.tsx`:

1. Add imports at the top:

```typescript
import { useState } from 'react'
import { AlertTriangle, AlertCircle } from 'lucide-react'
import { useAgentMetrics } from '../hooks/use-agent-metrics'
```

Note: `useState` is already imported — just add the `lucide-react` and `useAgentMetrics` imports.

2. Add `windowDaysOptions` constant after `reasonLabels`:

```typescript
const windowDaysOptions = [
  { value: '7', label: 'Son 7 Gun' },
  { value: '30', label: 'Son 30 Gun' },
  { value: '90', label: 'Son 90 Gun' },
  { value: '365', label: 'Son 1 Yil' },
]
```

3. Inside the `AnalyticsTab` component, add after the existing `const [months, setMonths]` line:

```typescript
  const [windowDays, setWindowDays] = useState(30)
  const { data: agentData } = useAgentMetrics(companyId, windowDays)
```

4. After the closing `</div>` of the "Tool Kullanimi" card (the last element before the component's return closing `</div>`), add the agent metrics section:

```tsx
      {/* ─── Agent Performansi ─────────────────────────── */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Agent Performansi</h3>
          <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {windowDaysOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {agentData ? (
          <>
            {/* Alerts */}
            {agentData.alerts.length > 0 && (
              <div className="mb-4 space-y-2">
                {agentData.alerts.map((alert) => (
                  <div
                    key={alert.code}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      alert.severity === 'critical'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}
                  >
                    {alert.severity === 'critical' ? (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* KPI Cards */}
            <div className="mb-4 grid grid-cols-4 gap-3">
              <KpiCard
                label="Citation Coverage"
                value={`%${Math.round(agentData.citationCoverage.rate * 100)}`}
                subtitle={`${agentData.citationCoverage.outputsAnalyzed} cikti analiz edildi`}
                subtitleColor="text-blue-400"
              />
              <KpiCard
                label="Onay Orani"
                value={`%${Math.round(agentData.humanWorkflow.approvalRate * 100)}`}
                subtitle={`${agentData.humanWorkflow.pendingActions} bekleyen onay`}
                subtitleColor={agentData.humanWorkflow.pendingActions > 0 ? 'text-yellow-400' : 'text-emerald-400'}
              />
              <KpiCard
                label="Kalite Skoru"
                value={`${agentData.feedback.qualityScore}/100`}
                subtitle={`${agentData.feedback.total} degerlendirme`}
                subtitleColor="text-violet-400"
              />
              <KpiCard
                label="Asistan Turn"
                value={String(agentData.conversations.assistantTurnsTotal)}
                subtitle={`${agentData.conversations.total} sohbet`}
                subtitleColor="text-muted-foreground"
              />
            </div>

            {/* Citation Breakdown + Human Workflow */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Citation Dagilimi</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {[
                      { label: 'Herhangi Citation', value: agentData.citationCoverage.outputsWithAnyCitation },
                      { label: 'Dokuman Citation', value: agentData.citationCoverage.outputsWithDocumentCitation },
                      { label: 'Bilgi Bankasi Citation', value: agentData.citationCoverage.outputsWithKnowledgeCitation },
                    ].map((item) => {
                      const total = agentData.citationCoverage.outputsAnalyzed
                      const pct = total > 0 ? (item.value / total) * 100 : 0
                      return (
                        <li key={item.label}>
                          <div className="mb-0.5 flex items-center justify-between text-sm">
                            <span>{item.label}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {item.value} / {total} (%{Math.round(pct)})
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Human Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-400">{agentData.humanWorkflow.approvedActions}</p>
                      <p className="text-xs text-muted-foreground">Onaylanan</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{agentData.humanWorkflow.rejectedActions}</p>
                      <p className="text-xs text-muted-foreground">Reddedilen</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${agentData.humanWorkflow.pendingActions > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                        {agentData.humanWorkflow.pendingActions}
                      </p>
                      <p className="text-xs text-muted-foreground">Bekleyen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Agent metrikleri yukleniyor...</div>
        )}
      </div>
```

- [ ] **Step 2: Build verification**

Run: `npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/components/analytics-tab.tsx
git commit -m "feat: add agent metrics section to analytics tab

- Alert banners (critical/warning)
- Citation coverage, approval rate, quality score KPIs
- Citation breakdown with progress bars
- Human workflow stats (approved/rejected/pending)"
```

---

### Task 4: Data Sources Tab Component

**Files:**
- Create: `src/features/companies/components/data-sources-tab.tsx`

- [ ] **Step 1: Create data-sources-tab.tsx**

Create `src/features/companies/components/data-sources-tab.tsx`:

```tsx
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCompanyDataSources } from '../hooks/use-data-sources'
import { useDataSourceTypes } from '../hooks/use-data-sources'

interface DataSourcesTabProps {
  companyId: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Aktif', variant: 'default' },
  syncing: { label: 'Senkronize', variant: 'secondary' },
  paused: { label: 'Duraklatildi', variant: 'outline' },
  error: { label: 'Hata', variant: 'destructive' },
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '—'
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} dk once`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat once`
  const days = Math.floor(hours / 24)
  return `${days} gun once`
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DataSourcesTab({ companyId }: DataSourcesTabProps) {
  const { data, isLoading } = useCompanyDataSources(companyId)
  const { data: dsTypes } = useDataSourceTypes()

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>

  const items = data?.items ?? []
  const totalItems = items.reduce((s, d) => s + d.itemCount, 0)
  const errorCount = items.filter((d) => d.status === 'error').length

  const typeLabels: Record<string, string> = {}
  dsTypes?.forEach((t) => { typeLabels[t.type] = t.label })

  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">Bu sirkete ait veri kaynagi bulunmuyor.</div>
  }

  return (
    <div>
      {/* Summary cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Kaynak</p>
            <p className="mt-1 text-lg font-bold">{data?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Oge</p>
            <p className="mt-1 text-lg font-bold">{totalItems.toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Hatali</p>
            <p className={`mt-1 text-lg font-bold ${errorCount > 0 ? 'text-red-400' : ''}`}>{errorCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Isim</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Oge Sayisi</TableHead>
              <TableHead>Son Sync</TableHead>
              <TableHead>Sonraki Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((ds) => {
              const sc = statusConfig[ds.status] ?? statusConfig.active
              return (
                <TableRow key={ds.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{ds.name}</span>
                      {ds.status === 'error' && ds.errorMessage && (
                        <p className="mt-0.5 text-xs text-red-400">{ds.errorMessage}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{typeLabels[ds.type] ?? ds.type}</TableCell>
                  <TableCell>
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{ds.itemCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatRelativeTime(ds.lastSyncAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(ds.nextSyncAt)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Build verification**

Run: `npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/components/data-sources-tab.tsx
git commit -m "feat: add data sources tab component

- Summary cards (total sources, items, errors)
- Table with status badges, relative sync times
- Error messages shown inline in red"
```

---

### Task 5: Wire Data Sources Tab + Dashboard KPI Cards

**Files:**
- Modify: `src/features/companies/pages/company-detail-page.tsx`
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`

- [ ] **Step 1: Add Data Sources tab to company detail page**

In `src/features/companies/pages/company-detail-page.tsx`:

1. Add import after the `UsersTab` import:

```typescript
import { DataSourcesTab } from '../components/data-sources-tab'
```

2. Add after the users `TabsTrigger` (the last `TabsTrigger`):

```tsx
          <TabsTrigger value="data-sources">Veri Kaynaklari</TabsTrigger>
```

3. Add after the users `TabsContent` (the last `TabsContent`):

```tsx
        <TabsContent value="data-sources" className="mt-4">
          <DataSourcesTab companyId={id!} />
        </TabsContent>
```

- [ ] **Step 2: Add data source KPI cards to dashboard**

In `src/features/dashboard/pages/dashboard-page.tsx`:

1. Add import:

```typescript
import { usePlatformDataSources } from '@/features/companies/hooks/use-data-sources'
```

2. Inside the `DashboardPage` component, after the existing `usePlatformSummary` hook call, add:

```typescript
  const { data: activeDs } = usePlatformDataSources({ status: 'active' })
  const { data: errorDs } = usePlatformDataSources({ status: 'error' })
```

3. Change the KPI grid from `grid-cols-4` to `grid-cols-3`:

Replace:
```tsx
          <div className="mb-6 grid grid-cols-4 gap-3">
```
With:
```tsx
          <div className="mb-6 grid grid-cols-3 gap-3">
```

4. Add 2 KPI cards after the existing 4 cards (before the closing `</div>` of the KPI grid):

```tsx
            <KpiCard label="Aktif Crawler" value={String(activeDs?.total ?? 0)} />
            <KpiCard
              label="Hatali Kaynak"
              value={String(errorDs?.total ?? 0)}
              subtitleColor={(errorDs?.total ?? 0) > 0 ? 'text-red-400' : undefined}
              subtitle={(errorDs?.total ?? 0) > 0 ? 'Dikkat gerektiriyor' : 'Sorun yok'}
            />
```

- [ ] **Step 3: Build verification**

Run: `npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/pages/company-detail-page.tsx src/features/dashboard/pages/dashboard-page.tsx
git commit -m "feat: wire data sources tab and dashboard KPI cards

- Add 6th 'Veri Kaynaklari' tab to company detail page
- Add active crawler and error source KPIs to dashboard
- Change dashboard KPI grid to 3-column layout"
```

---

### Task 6: Final Build Verification + Push

**Files:** None (verification only)

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 2: Lint check**

Run: `npm run lint`
Expected: No new lint errors introduced.

- [ ] **Step 3: Push**

```bash
git push
```
