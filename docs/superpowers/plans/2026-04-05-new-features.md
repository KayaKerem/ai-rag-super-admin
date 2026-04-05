# New Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 new modules: config field updates, activity log tab, search analytics tab, and treasury page — all matching backend API docs.

**Architecture:** Each module follows the established feature pattern: types → query keys → hooks → mock data+handlers → components → page/tab integration. All new endpoints use the existing apiClient with JWT auth. MSW mock handlers provide dev data.

**Tech Stack:** React 19, TypeScript, React Query, Axios, MSW, Tailwind CSS, Shadcn/ui (base-ui), Recharts, React Router v6

---

## Task 1: Config Field Updates

Add new fields to existing aiConfig and limitsConfig sections in both company config and platform defaults forms.

**Files:**
- Modify: `src/features/companies/components/ai-config-accordion.tsx`
- Modify: `src/features/settings/components/ai-config-section.tsx`
- Modify: `src/features/companies/components/config-tab.tsx` (limitsConfig fields)
- Modify: `src/features/settings/components/settings-page.tsx` (limitsConfig fields if applicable)
- Modify: `src/mocks/data.ts` (add new fields to mock defaults)

**New aiConfig fields to add:**
- `language`: select `tr` | `en` — label: "Dil", hint: "AI yanıtları ve otomatik özetler bu dilde üretilir"
- `summaryModel`: model text input — label: "Özet Modeli", hint: "Doküman özetleme modeli (default: openai/gpt-4o-mini)"
- `hybridRrfK`: number input — label: "Hybrid RRF K", hint: "Reciprocal Rank Fusion K parametresi (default: 60)"
- `maxOutputTokensRetryCap`: number input — label: "Max Output Token Retry", hint: "Yeniden deneme token limiti (default: 4096)"
- `budgetDowngradeThresholdPct`: number input — label: "Bütçe Uyarı Eşiği %", hint: "AI bütçesi bu yüzdeye ulaşınca uyarı (0-100, default: 80)"

**New limitsConfig fields to add:**
- `crawlMaxPages`: number — label: "Crawler Maks Sayfa"
- `crawlMaxSources`: number — label: "Crawler Maks Kaynak"
- `crawlMinIntervalHours`: number — label: "Crawler Min Aralık (saat)"
- `crawlConcurrency`: number — label: "Crawler Eşzamanlılık"
- `allowedConnectors`: text/tags — label: "İzin Verilen Connector'lar"
- `autoSummarizeEnabled`: boolean switch — label: "Otomatik Özetleme"

**Steps:**
- [ ] Add new fields to aiConfig form in `ai-config-accordion.tsx` and `ai-config-section.tsx` using existing FieldLabel + Input/Select/Switch pattern
- [ ] Add new limitsConfig fields to config-tab.tsx limits accordion using same pattern
- [ ] Update mock data in `data.ts` to include new fields in `mockPlatformDefaults` and `mockCompanyConfigs`
- [ ] Run `npm run build` to verify no errors
- [ ] Commit: `feat: add new aiConfig and limitsConfig fields`

---

## Task 2: Activity Log Tab

New "Aktivite" tab in company detail page showing filterable paginated activity log.

**Files:**
- Modify: `src/features/companies/types.ts` (add ActivityLogItem, ActivityLogResponse)
- Modify: `src/lib/query-keys.ts` (add activityLog key)
- Create: `src/features/companies/hooks/use-activity-log.ts`
- Create: `src/features/companies/components/activity-log-tab.tsx`
- Modify: `src/features/companies/pages/company-detail-page.tsx` (add tab)
- Modify: `src/mocks/data.ts` (add mock activity data)
- Modify: `src/mocks/handlers.ts` (add handler)

### Types (add to types.ts)

```typescript
// ─── Activity Log ────────────────────────────────

export type ActivityCategory = 'auth' | 'user' | 'document' | 'folder' | 'knowledge' | 'conversation' | 'company' | 'connector' | 'note'

export interface ActivityLogItem {
  id: string
  companyId: string
  userId: string | null
  action: string
  category: ActivityCategory
  resourceId: string | null
  resourceType: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface ActivityLogResponse {
  items: ActivityLogItem[]
  total: number
}
```

### Query Key (add to query-keys.ts)

```typescript
activityLog: (id: string) => ['companies', id, 'activity-log'] as const,
```

### Hook (use-activity-log.ts)

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { ActivityLogResponse } from '../types'

interface ActivityLogParams {
  category?: string
  action?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export function useActivityLog(companyId: string, params: ActivityLogParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.companies.activityLog(companyId), params],
    queryFn: async (): Promise<ActivityLogResponse> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/activity-log`, { params })
      return data
    },
  })
}
```

### Component (activity-log-tab.tsx)

Features:
- Category filter (multi-select or single dropdown with all 9 categories)
- Paginated table: Tarih, Kullanıcı, Aksiyon, Kategori, Detay
- Category badge with color coding
- Pagination controls (prev/next with offset)
- Action labels in Turkish where possible

### Mock Data

Generate 50-100 activity items across all 9 categories with realistic timestamps, spread across mock company IDs.

### MSW Handler

```typescript
http.get(`${BASE}/platform/companies/:id/activity-log`, async ({ params, request }) => {
  // Parse query params: category, action, limit (default 20), offset (default 0)
  // Filter mockActivityLog by companyId + query filters
  // Return { items: [...], total: N }
})
```

### Integration

Add to company-detail-page.tsx:
```tsx
<TabsTrigger value="activity">Aktivite</TabsTrigger>
// ...
<TabsContent value="activity"><ActivityLogTab companyId={id} /></TabsContent>
```

**Steps:**
- [ ] Add types to `types.ts`
- [ ] Add query key to `query-keys.ts`
- [ ] Create `use-activity-log.ts` hook
- [ ] Add mock data generator and MSW handler
- [ ] Create `activity-log-tab.tsx` component with filters and table
- [ ] Add tab to `company-detail-page.tsx`
- [ ] Run `npm run build` to verify
- [ ] Commit: `feat: add activity log tab to company detail`

---

## Task 3: Search Analytics Tab

New "Arama Analitiği" tab in company detail with search quality metrics.

**Files:**
- Modify: `src/features/companies/types.ts` (add SearchAnalytics types)
- Modify: `src/lib/query-keys.ts` (add searchAnalytics key)
- Create: `src/features/companies/hooks/use-search-analytics.ts`
- Create: `src/features/companies/components/search-analytics-tab.tsx`
- Modify: `src/features/companies/pages/company-detail-page.tsx` (add tab)
- Modify: `src/mocks/data.ts` (add mock data)
- Modify: `src/mocks/handlers.ts` (add handler)

### Types (add to types.ts)

```typescript
// ─── Search Analytics ────────────────────────────

export interface SearchAnalytics {
  windowDays: number
  totalQueries: number
  emptyQueries: number
  emptyRate: number
  avgResultCount: number
  avgResponseTimeMs: number
  topQueries: Array<{ queryText: string; count: number; emptyRate: number }>
  unansweredQueries: Array<{ queryText: string; count: number; lastAsked: string }>
  byTool: Record<string, { total: number; empty: number; avgResponseTimeMs: number }>
  feedbackCorrelation: {
    queriesWithNegativeFeedback: number
    topNegativeQueries: Array<{ queryText: string; negativeCount: number; totalCount: number }>
  }
  dailyTrend: Array<{ date: string; total: number; empty: number }>
}
```

### Query Key

```typescript
searchAnalytics: (id: string, windowDays: number) => ['companies', id, 'search-analytics', windowDays] as const,
```

### Hook (use-search-analytics.ts)

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { SearchAnalytics } from '../types'

export function useSearchAnalytics(companyId: string, windowDays = 30) {
  return useQuery({
    queryKey: queryKeys.companies.searchAnalytics(companyId, windowDays),
    queryFn: async (): Promise<SearchAnalytics> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/search-analytics`, {
        params: { windowDays },
      })
      return data
    },
  })
}
```

### Component (search-analytics-tab.tsx)

Layout:
1. **Window selector** — 7d / 30d / 90d dropdown (top right)
2. **KPI cards row** — Toplam Sorgu, Boş Sonuç Oranı (%), Ort. Yanıt Süresi (ms)
3. **Daily trend chart** — Recharts line chart (total + empty series)
4. **Top Queries table** — queryText, count, emptyRate columns
5. **Unanswered Queries table** — queryText, count, lastAsked columns (highlight content gaps)
6. **Per-Tool breakdown** — simple bar/table showing tool name, total, empty, avg response time
7. **Feedback Correlation table** — queries with negative feedback

### Mock Data

Generate realistic search analytics with ~600 total queries, 2-3% empty rate, 10 top queries, 5 unanswered, 30 days of daily trend data.

### MSW Handler

```typescript
http.get(`${BASE}/platform/companies/:id/search-analytics`, async ({ request }) => {
  // Parse windowDays from query
  // Return mock SearchAnalytics
})
```

### Integration

Add tab after "analytics":
```tsx
<TabsTrigger value="search-analytics">Arama Analitiği</TabsTrigger>
<TabsContent value="search-analytics"><SearchAnalyticsTab companyId={id} /></TabsContent>
```

**Steps:**
- [ ] Add types to `types.ts`
- [ ] Add query key to `query-keys.ts`
- [ ] Create `use-search-analytics.ts` hook
- [ ] Add mock data and MSW handler
- [ ] Create `search-analytics-tab.tsx` component with charts and tables
- [ ] Add tab to `company-detail-page.tsx`
- [ ] Run `npm run build` to verify
- [ ] Commit: `feat: add search analytics tab to company detail`

---

## Task 4: Treasury Module

Full treasury management page: dashboard, snapshots chart, customer usage, transactions, alerts, actions (approve/reject), config, OpenRouter details.

### Sub-task 4A: Treasury Types & Query Keys

**Files:**
- Create: `src/features/treasury/types.ts`
- Modify: `src/lib/query-keys.ts`

**Types:**

```typescript
// ─── Treasury Dashboard ──────────────────────────

export interface TreasuryDashboard {
  last_snapshot_at: string
  openrouter: {
    balance: number
    total_credits: number
    total_usage: number
    runway_days: number
  }
  avalanche: {
    liquid_usdc: number
    staked_aave: number
    staked_benqi: number
    avax_balance: number
  }
  totals: {
    total_treasury: number
    effective_liquid: number
    total_staked: number
  }
  metrics: {
    daily_burn_rate: number
    projected_runway_days: number
    active_customers: number
    total_monthly_budget: number
  }
  openrouter_topup: {
    recommended_amount: number
    estimated_topup_date: string
  }
  pending_actions_count: number
  unacknowledged_alerts_count: number
}

// ─── Treasury Snapshots ──────────────────────────

export interface TreasurySnapshot {
  id: string
  createdAt: string
  openrouterBalance: number
  avalancheLiquidUsdc: number
  avalancheStakedAave: number
  avalancheStakedBenqi: number
  avalancheAvaxBalance: number
  totalTreasuryValue: number
  dailyBurnRate: number
  projectedRunwayDays: number
  activeCustomerCount: number
  totalMonthlyBudget: number
}

// ─── Treasury Customers ──────────────────────────

export interface TreasuryCustomerUsage {
  companyId: string
  planName: string
  monthlyBudget: number
  currentSpend: number
  usagePct: number
  updatedAt: string
}

// ─── Treasury Transactions ───────────────────────

export type TransactionType = 'deposit_aave' | 'withdraw_aave' | 'deposit_benqi' | 'withdraw_benqi' | 'wallet_inflow' | 'wallet_outflow' | 'openrouter_topup_detected'

export interface TreasuryTransaction {
  id: string
  createdAt: string
  type: TransactionType
  amountUsdc: number
  protocol: string | null
  txHash: string | null
  triggeredBy: string
  actionId: string | null
}

export interface PaginatedTransactions {
  items: TreasuryTransaction[]
  total: number
  page: number
  limit: number
}

// ─── Treasury Alerts ─────────────────────────────

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type AlertCategory = 'balance' | 'openrouter' | 'rebalance' | 'gas' | 'action_failed' | 'daily_summary' | 'config_change'

export interface TreasuryAlert {
  id: string
  createdAt: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  message: string
  data: Record<string, unknown> | null
  acknowledgedAt: string | null
  acknowledgedBy: string | null
}

// ─── Treasury Actions ────────────────────────────

export type ActionType = 'stake_aave' | 'unstake_aave' | 'stake_benqi' | 'unstake_benqi'
export type ActionStatus = 'pending' | 'approved' | 'executed' | 'rejected' | 'failed' | 'expired'

export interface TreasuryAction {
  id: string
  createdAt: string
  type: ActionType
  amountUsdc: number
  reason: string
  metadata: Record<string, unknown> | null
  status: ActionStatus
  expiresAt: string | null
  approvedAt: string | null
  approvedBy: string | null
  executedAt: string | null
  txHash: string | null
  errorMessage: string | null
}

// ─── Treasury Config ─────────────────────────────

export interface TreasuryConfig {
  id: string
  bufferDays: number
  stakeThreshold: number
  unstakeThreshold: number
  aaveRatio: number
  benqiRatio: number
  orWarningDays: number
  orCriticalDays: number
  minStakeUsdc: number
  minUnstakeUsdc: number
  maxActionPct: number
  deficitConsecutiveChecks: number
  updatedAt: string
  updatedBy: string
}

// ─── OpenRouter Details ──────────────────────────

export interface OpenRouterDetails {
  balance: number
  runwayDays: number
  recommendedTopup: number
  dailyBurnRate: number
  trend: Array<{ date: string; balance: number }>
}
```

**Query Keys (add to platform section):**

```typescript
treasury: {
  dashboard: ['platform', 'treasury', 'dashboard'] as const,
  snapshots: (days: number) => ['platform', 'treasury', 'snapshots', days] as const,
  customers: ['platform', 'treasury', 'customers'] as const,
  transactions: (page: number, limit: number, type?: string) => ['platform', 'treasury', 'transactions', page, limit, type ?? ''] as const,
  alerts: (severity?: string, acknowledged?: string) => ['platform', 'treasury', 'alerts', severity ?? '', acknowledged ?? ''] as const,
  actions: (status: string) => ['platform', 'treasury', 'actions', status] as const,
  config: ['platform', 'treasury', 'config'] as const,
  openrouter: ['platform', 'treasury', 'openrouter'] as const,
},
```

**Steps:**
- [ ] Create `src/features/treasury/types.ts` with all types above
- [ ] Add treasury query keys to `src/lib/query-keys.ts`
- [ ] Run `npm run build` to verify
- [ ] Commit: `feat: add treasury types and query keys`

---

### Sub-task 4B: Treasury Hooks

**Files:**
- Create: `src/features/treasury/hooks/use-treasury.ts`

All hooks in one file since they share the treasury domain:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { TreasuryDashboard, TreasurySnapshot, TreasuryCustomerUsage, PaginatedTransactions, TreasuryAlert, TreasuryAction, TreasuryConfig, OpenRouterDetails } from '../types'

export function useTreasuryDashboard() {
  return useQuery({
    queryKey: queryKeys.platform.treasury.dashboard,
    queryFn: async (): Promise<TreasuryDashboard> => {
      const { data } = await apiClient.get('/platform/treasury/dashboard')
      return data
    },
  })
}

export function useTreasurySnapshots(days = 30) {
  return useQuery({
    queryKey: queryKeys.platform.treasury.snapshots(days),
    queryFn: async (): Promise<TreasurySnapshot[]> => {
      const { data } = await apiClient.get('/platform/treasury/snapshots', { params: { days } })
      return data
    },
  })
}

export function useTreasuryCustomers() {
  return useQuery({
    queryKey: queryKeys.platform.treasury.customers,
    queryFn: async (): Promise<TreasuryCustomerUsage[]> => {
      const { data } = await apiClient.get('/platform/treasury/customers')
      return data
    },
  })
}

export function useTreasuryTransactions(page = 1, limit = 20, type?: string) {
  return useQuery({
    queryKey: queryKeys.platform.treasury.transactions(page, limit, type),
    queryFn: async (): Promise<PaginatedTransactions> => {
      const { data } = await apiClient.get('/platform/treasury/transactions', { params: { page, limit, ...(type && { type }) } })
      return data
    },
  })
}

export function useTreasuryAlerts(severity?: string, acknowledged?: string) {
  return useQuery({
    queryKey: queryKeys.platform.treasury.alerts(severity, acknowledged),
    queryFn: async (): Promise<TreasuryAlert[]> => {
      const { data } = await apiClient.get('/platform/treasury/alerts', { params: { ...(severity && { severity }), ...(acknowledged && { acknowledged }) } })
      return data
    },
  })
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data } = await apiClient.patch(`/platform/treasury/alerts/${alertId}/acknowledge`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'treasury', 'alerts'] })
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.dashboard })
    },
  })
}

export function useTreasuryActions(status = 'pending') {
  return useQuery({
    queryKey: queryKeys.platform.treasury.actions(status),
    queryFn: async (): Promise<TreasuryAction[]> => {
      const { data } = await apiClient.get('/platform/treasury/actions', { params: { status } })
      return data
    },
  })
}

export function useApproveAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (actionId: string) => {
      const { data } = await apiClient.post(`/platform/treasury/actions/${actionId}/approve`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'treasury', 'actions'] })
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.dashboard })
    },
  })
}

export function useRejectAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (actionId: string) => {
      const { data } = await apiClient.post(`/platform/treasury/actions/${actionId}/reject`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'treasury', 'actions'] })
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.dashboard })
    },
  })
}

export function useCreateManualAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { type: string; amountUsdc: number }) => {
      const { data } = await apiClient.post('/platform/treasury/actions/manual', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'treasury', 'actions'] })
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.dashboard })
    },
  })
}

export function useTreasuryConfig() {
  return useQuery({
    queryKey: queryKeys.platform.treasury.config,
    queryFn: async (): Promise<TreasuryConfig> => {
      const { data } = await apiClient.get('/platform/treasury/config')
      return data
    },
  })
}

export function useUpdateTreasuryConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<TreasuryConfig>) => {
      const { data } = await apiClient.patch('/platform/treasury/config', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.config })
    },
  })
}

export function useOpenRouterDetails() {
  return useQuery({
    queryKey: queryKeys.platform.treasury.openrouter,
    queryFn: async (): Promise<OpenRouterDetails> => {
      const { data } = await apiClient.get('/platform/treasury/openrouter')
      return data
    },
  })
}
```

**Steps:**
- [ ] Create `src/features/treasury/hooks/use-treasury.ts` with all hooks
- [ ] Run `npm run build` to verify
- [ ] Commit: `feat: add treasury hooks for all 12 endpoints`

---

### Sub-task 4C: Treasury Mock Data & Handlers

**Files:**
- Create: `src/mocks/treasury-data.ts` (separate file to avoid bloating data.ts)
- Modify: `src/mocks/handlers.ts` (add treasury handlers)

Generate realistic mock data for:
- Dashboard: OpenRouter balance $74.75, Avalanche liquid $1000, staked Aave $500, Benqi $300, AVAX 2.5
- Snapshots: 30 days of data with gradual balance changes
- Customers: Use mockCompanies to generate per-company budget usage
- Transactions: 40+ transactions across all 7 types
- Alerts: 5 alerts (2 critical, 1 warning, 2 info) — some acknowledged, some not
- Actions: 3 pending, 2 executed, 1 rejected
- Config: bufferDays 90, stakeThreshold 1.5, aaveRatio 0.625, etc.
- OpenRouter: balance with 30-day trend

MSW handlers for all 12 treasury endpoints with proper query param handling, pagination for transactions, filtering for alerts/actions.

**Steps:**
- [ ] Create `src/mocks/treasury-data.ts` with all mock data
- [ ] Add all treasury MSW handlers to `src/mocks/handlers.ts`
- [ ] Run `npm run build` to verify
- [ ] Commit: `feat: add treasury mock data and MSW handlers`

---

### Sub-task 4D: Treasury Page & Components

**Files:**
- Create: `src/features/treasury/pages/treasury-page.tsx`
- Create: `src/features/treasury/components/treasury-dashboard.tsx`
- Create: `src/features/treasury/components/treasury-snapshots-chart.tsx`
- Create: `src/features/treasury/components/treasury-customers.tsx`
- Create: `src/features/treasury/components/treasury-transactions.tsx`
- Create: `src/features/treasury/components/treasury-alerts.tsx`
- Create: `src/features/treasury/components/treasury-actions.tsx`
- Create: `src/features/treasury/components/treasury-config.tsx`
- Create: `src/features/treasury/components/openrouter-details.tsx`
- Modify: `src/App.tsx` (add /treasury route)
- Modify: `src/components/layout/sidebar.tsx` (add Treasury nav item with Wallet icon)

**Page structure:**
Treasury page uses tabs:
1. **Dashboard** — KPI cards (total treasury, liquid, staked, burn rate, runway) + snapshots area chart + OpenRouter mini card
2. **Müşteriler** — Customer usage table (company, plan, budget, spend, usage %)
3. **İşlemler** — Paginated transaction table with type filter
4. **Uyarılar** — Alert cards with severity badges, acknowledge button
5. **Aksiyonlar** — Pending actions with approve/reject buttons, manual action form
6. **Ayarlar** — Treasury config form (bufferDays, thresholds, ratios, etc.)

**Component details:**

**treasury-dashboard.tsx:**
- 6 KPI cards: Total Treasury (USD), Liquid USDC, Staked Total, Daily Burn Rate, Runway (gün), Pending Actions
- Snapshots area chart (Recharts AreaChart with totalTreasuryValue line)
- OpenRouter mini section: balance, runway days, recommended topup
- Alert/action counts as warning badges

**treasury-customers.tsx:**
- Table: Şirket, Plan, Aylık Bütçe, Harcama, Kullanım %
- Usage percentage bar (green <70%, yellow 70-90%, red >90%)
- Sorted by usagePct DESC

**treasury-transactions.tsx:**
- Type filter select (all 7 types + "Tümü")
- Paginated table: Tarih, Tip, Tutar (USDC), Protokol, TX Hash (truncated), Tetikleyen
- Pagination controls

**treasury-alerts.tsx:**
- Alert cards with severity color (CRITICAL=red, WARNING=yellow, INFO=blue)
- Category badge
- "Gördüm" button for unacknowledged
- Filter: severity dropdown, acknowledged toggle

**treasury-actions.tsx:**
- Status filter tabs: Bekleyen, Onaylanmış, Reddedilmiş, Tümü
- Action cards: type, amount, reason, metadata summary, status badge, expiry
- Approve/Reject buttons for pending actions
- Manual action form: type select (4 types) + amount input + create button

**treasury-config.tsx:**
- Form with FieldLabel inputs for all config fields
- Grouped: Buffer & Thresholds, DeFi Ratios, OpenRouter Warnings, Action Limits
- Save button with toast feedback

**Sidebar:**
Add between "Ayarlar" and "Email Şablonları":
```typescript
{ to: '/treasury', icon: Wallet, label: 'Treasury' }
```

**Route:**
```tsx
<Route path="/treasury" element={<TreasuryPage />} />
```

**Steps:**
- [ ] Create treasury-page.tsx with tab layout
- [ ] Create treasury-dashboard.tsx with KPI cards and chart
- [ ] Create treasury-snapshots-chart.tsx (Recharts area chart)
- [ ] Create openrouter-details.tsx section
- [ ] Create treasury-customers.tsx table
- [ ] Create treasury-transactions.tsx with pagination
- [ ] Create treasury-alerts.tsx with acknowledge
- [ ] Create treasury-actions.tsx with approve/reject/manual
- [ ] Create treasury-config.tsx settings form
- [ ] Add route to App.tsx and sidebar nav item
- [ ] Run `npm run build` to verify
- [ ] Commit: `feat: add treasury management page with full dashboard`

---

## Execution Order

Tasks 1-3 are independent and can run in parallel.
Task 4 sub-tasks must run sequentially (4A → 4B → 4C → 4D).

Recommended parallel dispatch:
- **Wave 1:** Task 1 + Task 2 + Task 3 + Task 4A (parallel)
- **Wave 2:** Task 4B (after 4A)
- **Wave 3:** Task 4C (after 4B)
- **Wave 4:** Task 4D (after 4C)
- **Final:** Build verification + commit
