# At-Risk Companies Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard'a `<AtRiskCompaniesTable />` widget'ı eklemek — bütçe kullanımı ≥%95 olan firmaları (exhausted + economy bantları) tek bakışta gösterir, satır tıklama ile firmanın Usage tab'ına gider.

**Architecture:** Yeni `useAtRiskCompanies` hook iki paralel `useQueries` call'u (`band=exhausted&limit=100`, `band=economy&limit=100`) yapar; backend tek-SQL aggregate endpoint'i kullanır (N+1 yok). Yeni `AtRiskCompaniesTable` component'i mevcut shadcn `Card` + `Table` primitive'leri ile render eder; satır navigasyonu `useNavigate` + a11y keyboard handler ile (TableRow `asChild` desteklemiyor). Plan adı `usePricingPlans()` cache'inden lookup. Loading/error/empty/truncation state'leri açık.

**Tech Stack:** React 18, TypeScript strict, `@tanstack/react-query` (`useQueries`), `react-router-dom` (`useNavigate`), shadcn `Card`/`Table`/`Badge`, `lucide-react` (`AlertTriangle`/`AlertCircle`/`CheckCircle2`), Tailwind.

**Spec referansı:** `docs/superpowers/specs/2026-04-18-at-risk-companies-widget-design.md`

---

## File Structure

| Yol | Tip | Sorumluluk |
|-----|-----|-----------|
| `src/lib/query-keys.ts` | modify | `platform.atRisk(band)` factory ekle |
| `src/features/dashboard/hooks/use-at-risk-companies.ts` | create | İki paralel query, türetilmiş `data`/`totals`/`isLoading`/`isError` döner; tipler hook-private |
| `src/features/dashboard/components/at-risk-band-badge.tsx` | create | Solid renkli Badge ('exhausted' kırmızı, 'economy' turuncu) + ikon, küçük presentational |
| `src/features/dashboard/components/at-risk-companies-table.tsx` | create | Card+Table, loading/error/empty/truncation render'ı, satır navigasyonu |
| `src/features/dashboard/pages/dashboard-page.tsx` | modify | Charts grid ile RevenueSummary arasına `<AtRiskCompaniesTable />` ekle |

**Yeni test dosyası yok** — codebase konvansiyonu (KpiCard, RevenueSummary, CostTrendChart, useRevenue vb. hiçbiri unit test'li değil). Doğrulama `tsc -b`, `vite build` ve dev-server manuel kontrol.

---

## Task 1: Query Key Factory

**Files:**
- Modify: `src/lib/query-keys.ts:23-36` (platform grubuna `atRisk` factory ekle)

- [ ] **Step 1: Edit `query-keys.ts`**

Mevcut `platform` objesinin sonuna (satır 35'teki `serviceAccounts` sonrası, kapanan `}` öncesi) yeni factory ekle:

```typescript
  platform: {
    summary: (months: number) => ['platform', 'summary', months] as const,
    defaults: ['platform', 'defaults'] as const,
    models: ['platform', 'models'] as const,
    toolPlans: ['platform', 'tool-plans'] as const,
    dataSources: (params?: string) => ['platform', 'data-sources', params ?? ''] as const,
    dataSourceTypes: ['platform', 'data-source-types'] as const,
    plans: ['platform', 'plans'] as const,
    planDetail: (id: string) => ['platform', 'plans', id] as const,
    revenue: ['platform', 'revenue'] as const,
    emailTemplates: ['platform', 'email-templates'] as const,
    emailTemplate: (slug: string) => ['platform', 'email-templates', slug] as const,
    serviceAccounts: ['platform', 'service-accounts'] as const,
    atRisk: (band: 'exhausted' | 'economy') => ['platform', 'atRisk', band] as const,
  },
```

**Konvansiyon notu:** Factory adı = ikinci segment (`'atRisk'`), URL path değil. Backend endpoint `/platform/companies/aggregate` ama key segment `atRisk` (mevcut kodbase pattern'ı).

- [ ] **Step 2: Verify type check**

Run: `npx tsc -b`
Expected: 0 errors (yeni factory eklenmesi tip uyumsuzluğu yaratmaz, mevcut kullanımlar etkilenmez).

- [ ] **Step 3: Commit**

```bash
git add src/lib/query-keys.ts
git commit -m "feat(dashboard): add atRisk query key factory for aggregate endpoint"
```

---

## Task 2: useAtRiskCompanies Hook

**Files:**
- Create: `src/features/dashboard/hooks/use-at-risk-companies.ts`

- [ ] **Step 1: Create hook file**

Tam içerik:

```typescript
import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

// Wire shape — backend response'unu birebir yansıtır.
interface AggregateApiCompany {
  id: string
  name: string
  planId: string | null
  budgetUsd: number
  currentSpendUsd: number
  spendPct: number
  band: 'normal' | 'standard' | 'economy' | 'exhausted' | 'unconfigured'
  budgetDowngradeThresholdPct: number
}

interface AggregateApiResponse {
  companies: AggregateApiCompany[]
  total: number
}

// Post-filter, narrowed shape — widget yalnızca bu iki bandı render eder.
// `subscriptionStatus` widget tarafından kullanılmadığı için tipe alınmaz.
export interface AtRiskCompany extends Omit<AggregateApiCompany, 'band'> {
  band: 'economy' | 'exhausted'
}

const LIMIT = 100

async function fetchAggregate(band: 'exhausted' | 'economy'): Promise<AggregateApiResponse> {
  const { data } = await apiClient.get<AggregateApiResponse>(
    `/platform/companies/aggregate?band=${band}&limit=${LIMIT}`,
  )
  return data
}

export function useAtRiskCompanies() {
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.platform.atRisk('exhausted'),
        queryFn: () => fetchAggregate('exhausted'),
      },
      {
        queryKey: queryKeys.platform.atRisk('economy'),
        queryFn: () => fetchAggregate('economy'),
      },
    ],
  })

  const [exhaustedQuery, economyQuery] = queries
  const isLoading = queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)

  const data: AtRiskCompany[] | undefined =
    isLoading || isError
      ? undefined
      : [
          ...((exhaustedQuery.data?.companies ?? []) as AtRiskCompany[]),
          ...((economyQuery.data?.companies ?? []) as AtRiskCompany[]),
        ]

  const totals = {
    exhausted: exhaustedQuery.data?.total ?? 0,
    economy: economyQuery.data?.total ?? 0,
  }

  return { data, totals, isLoading, isError }
}
```

**Önemli detaylar:**
- `AtRiskCompany` `export`, `AggregateApiCompany`/`AggregateApiResponse` dosya-private (component'in tip referansı için yalnızca `AtRiskCompany` lazım).
- Backend yalnızca istenen bandın firmalarını döndürür; cast (`as AtRiskCompany[]`) güvenli — tipte daraltma sadece tüketim ergonomisi için.
- `LIMIT = 100` backend max'i; truncation footer §5.4'te.

- [ ] **Step 2: Verify type check**

Run: `npx tsc -b`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/hooks/use-at-risk-companies.ts
git commit -m "feat(dashboard): add useAtRiskCompanies hook with parallel band queries"
```

---

## Task 3: AtRiskBandBadge Component

**Files:**
- Create: `src/features/dashboard/components/at-risk-band-badge.tsx`

**Why ayrı dosya:** Badge render mantığı 2 satırdan fazla (custom class + ikon + label + a11y) ve ileride başka yerde (örn. firma detay header'ı) kullanılabilir. Şimdi izole, sonra reuse esnek.

- [ ] **Step 1: Create component**

```tsx
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AtRiskBandBadgeProps {
  band: 'exhausted' | 'economy'
}

export function AtRiskBandBadge({ band }: AtRiskBandBadgeProps) {
  if (band === 'exhausted') {
    return (
      <Badge
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        aria-label="Exhausted: bütçe %97 üzeri"
      >
        <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
        Exhausted
      </Badge>
    )
  }
  return (
    <Badge
      className="bg-orange-500 text-white hover:bg-orange-500/90"
      aria-label="Economy: bütçe %95-97 arası"
    >
      <AlertCircle className="mr-1 h-3 w-3" aria-hidden="true" />
      Economy
    </Badge>
  )
}
```

**Why solid custom classes:** shadcn `destructive` variant tinted (low-opacity background); spec'in görsel hiyerarşisi (exhausted > economy) için her ikisinin de solid olması gerekir. Bkz. spec §5.1.

- [ ] **Step 2: Verify type check**

Run: `npx tsc -b`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/at-risk-band-badge.tsx
git commit -m "feat(dashboard): add AtRiskBandBadge with solid color variants + a11y"
```

---

## Task 4: AtRiskCompaniesTable Component

**Files:**
- Create: `src/features/dashboard/components/at-risk-companies-table.tsx`

- [ ] **Step 1: Create component**

```tsx
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { usePricingPlans } from '@/features/companies/hooks/use-pricing-plans'
import { useAtRiskCompanies } from '../hooks/use-at-risk-companies'
import { AtRiskBandBadge } from './at-risk-band-badge'

export function AtRiskCompaniesTable() {
  const navigate = useNavigate()
  const { data, totals, isLoading, isError } = useAtRiskCompanies()
  const { data: plans } = usePricingPlans()

  const planNameById = new Map((plans ?? []).map((p) => [p.id, p.name]))

  const goToCompany = (id: string) => navigate(`/companies/${id}`)

  const exhaustedShown = data?.filter((c) => c.band === 'exhausted').length ?? 0
  const economyShown = data?.filter((c) => c.band === 'economy').length ?? 0
  const isTruncated =
    !!data &&
    (totals.exhausted > exhaustedShown || totals.economy > economyShown)

  return (
    <Card aria-label="Bütçesi tehlikedeki firmalar listesi">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bütçesi Tehlikedeki Firmalar</CardTitle>
        {data && data.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {data.length} firma ≥ %95 bütçe kullanımında
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isError && (
          <div className="text-sm text-destructive">Yüklenemedi</div>
        )}

        {!isError && isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        )}

        {!isError && !isLoading && data && data.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Tüm firmalar güvenli bantta</span>
          </div>
        )}

        {!isError && !isLoading && data && data.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Bütçe</TableHead>
                  <TableHead className="text-right">Harcama</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Band</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    role="link"
                    tabIndex={0}
                    onClick={() => goToCompany(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        goToCompany(c.id)
                      }
                    }}
                    aria-label={`${c.name} — Usage detayına git`}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {c.planId ? planNameById.get(c.planId) ?? '—' : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(c.budgetUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(c.currentSpendUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      %{c.spendPct.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <AtRiskBandBadge band={c.band} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {isTruncated && (
              <p className="mt-2 text-xs text-muted-foreground">
                İlk 100 firma gösteriliyor (toplam: {totals.exhausted} exhausted,{' '}
                {totals.economy} economy)
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

**Önemli detaylar:**
- `?tab=usage` URL parametresi YOK — `company-detail-page.tsx` `useSearchParams` okumadığı için ölü param olur; default tab zaten `usage` (Task 5'te kabul kriterine bağlanır).
- Satır navigasyonu `useNavigate` + `onClick` + Enter/Space klavye desteği. TableRow `asChild` desteklemiyor (table.tsx:55 plain `<tr>`).
- Plan adı `Map` ile O(1) lookup; `c.planId === null` ise `—`, plan silinmişse de `—` (`?? '—'`).
- `%${c.spendPct.toFixed(1)}` Türkçe konvansiyon (`%` önce — bkz. usage-tab.tsx:69 `%${Math.round(...)}`).
- Truncation footer sadece `data` dolu ve gerçek truncation varsa görünür.

- [ ] **Step 2: Verify type check**

Run: `npx tsc -b`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/at-risk-companies-table.tsx
git commit -m "feat(dashboard): add AtRiskCompaniesTable with state-driven render + a11y nav"
```

---

## Task 5: Wire to Dashboard Page

**Files:**
- Modify: `src/features/dashboard/pages/dashboard-page.tsx:69-83` (charts grid sonrası, RevenueSummary öncesi widget'ı yerleştir)

- [ ] **Step 1: Edit dashboard-page.tsx imports**

`dashboard-page.tsx` üst kısmına yeni import ekle (mevcut import'ların arasına, alfabetik kabul edilen yere):

```tsx
import { AtRiskCompaniesTable } from '../components/at-risk-companies-table'
```

Mevcut import bloğu (satır 1-9 civarı) sonrasına eklenir; toplam görünüm:

```tsx
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlatformSummary } from '../hooks/use-platform-summary'
import { useRevenue } from '../hooks/use-revenue'
import { KpiCard } from '../components/kpi-card'
import { CostTrendChart } from '../components/cost-trend-chart'
import { CategoryBreakdown } from '../components/category-breakdown'
import { RevenueSummary } from '../components/revenue-summary'
import { AtRiskCompaniesTable } from '../components/at-risk-companies-table'
import { formatCurrency, formatCurrencyTry } from '@/lib/utils'
```

- [ ] **Step 2: Insert widget between charts grid and RevenueSummary**

`dashboard-page.tsx:69-83` mevcut JSX:

```tsx
          <div className="mb-6 grid grid-cols-2 gap-4">
            <CostTrendChart data={data!.months} />
            <CategoryBreakdown
              ai={current.ai.costUsd}
              rerank={current.rerank?.costUsd ?? 0}
              webSearch={current.webSearch?.costUsd ?? 0}
              research={current.research.costUsd}
              quotePrepare={current.quotePrepare.costUsd}
              proactive={current.proactive?.costUsd ?? 0}
              storage={current.storage.costUsd}
              trigger={current.trigger.costUsd}
            />
          </div>

          {revenue && <RevenueSummary data={revenue} />}
```

`</div>` (charts grid kapanışı) ile `{revenue && <RevenueSummary ...` arasına yeni satır ekle:

```tsx
          <div className="mb-6 grid grid-cols-2 gap-4">
            <CostTrendChart data={data!.months} />
            <CategoryBreakdown
              ai={current.ai.costUsd}
              rerank={current.rerank?.costUsd ?? 0}
              webSearch={current.webSearch?.costUsd ?? 0}
              research={current.research.costUsd}
              quotePrepare={current.quotePrepare.costUsd}
              proactive={current.proactive?.costUsd ?? 0}
              storage={current.storage.costUsd}
              trigger={current.trigger.costUsd}
            />
          </div>

          <div className="mb-6">
            <AtRiskCompaniesTable />
          </div>

          {revenue && <RevenueSummary data={revenue} />}
```

**Yerleşim notu:** `mb-6` wrapper, mevcut KPI grid + charts grid'in spacing pattern'ı ile tutarlı. Widget kendi `Card`'ı içinde olduğundan ek wrapping yok.

- [ ] **Step 3: Verify default tab on company-detail-page is "usage"**

Drill-through default tab'a güvendiği için lock'lamak gerekir. Şu an:

Run: `grep -n "defaultValue" src/features/companies/pages/company-detail-page.tsx`
Expected: `<Tabs defaultValue="usage">` görünür.

Eğer default başka bir değer ise spec §11 kabul kriterine uymaz — değiştir veya widget yerine `useNavigate` çağrısını farklı route ile düzelt. Şu an `usage` doğrulandı, değişiklik yok.

- [ ] **Step 4: Build verify**

Run: `npx tsc -b && npx vite build`
Expected: 0 errors, build success.

- [ ] **Step 5: Manual smoke test (dev server)**

```bash
npm run dev
```

Dashboard sayfasını aç:
1. **Loading state**: ilk render'da 3 satırlık skeleton görünür (network throttling: Slow 3G ile gözle).
2. **Populated state**: backend gerçek veri dönüyorsa exhausted satırlar önce, economy sonra; her bant Badge'i doğru renk.
3. **Empty state**: hiç riskli firma yoksa yeşil `CheckCircle2` + "Tüm firmalar güvenli bantta".
4. **Error state**: backend kapatılırsa "Yüklenemedi".
5. **Drill-through**: bir satıra tıkla → `/companies/:id` route'una yönlen, Tabs default'u "Usage" olduğu için Usage tab açık görünür.
6. **Klavye navigasyon**: Tab tuşu ile satıra odaklan, Enter veya Space → aynı drill-through.
7. **Layout**: KPI grid + charts grid bozulmamış; widget charts altında, RevenueSummary üstünde.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/pages/dashboard-page.tsx
git commit -m "feat(dashboard): wire AtRiskCompaniesTable between charts and RevenueSummary"
```

- [ ] **Step 7: Push**

```bash
git push origin main
```

---

## Self-Review Checklist (after all tasks)

Plan tamamlandıktan sonra spec ile karşılaştırma:

- [ ] Spec §3.1 (Bant tanımları) → Task 2 (`useAtRiskCompanies` yalnızca exhausted+economy çağırır)
- [ ] Spec §3.2 (Yerleşim) → Task 5 (charts grid sonrası, RevenueSummary öncesi)
- [ ] Spec §3.3 (Veri akışı) → Task 2 (`useQueries` array → türetilmiş object), Task 4 (state-driven render)
- [ ] Spec §4.1 (Tip ayrımı: ApiCompany vs AtRiskCompany) → Task 2
- [ ] Spec §4.2 (Hook imzası `data | totals | isLoading | isError`) → Task 2
- [ ] Spec §4.3 (Query key `['platform', 'atRisk', band]`) → Task 1
- [ ] Spec §5.1 (Solid Badge, AlertTriangle/AlertCircle) → Task 3
- [ ] Spec §5.2 (useNavigate + onClick + a11y, NO `?tab=usage`) → Task 4
- [ ] Spec §5.3 (CardTitle `text-base`) → Task 4
- [ ] Spec §5.4 (Truncation footer `totals.X > shownCount`) → Task 4
- [ ] Spec §6 (Loading/error/empty state'ler) → Task 4
- [ ] Spec §7 (a11y: aria-label, aria-hidden, role=link, tabIndex, Enter/Space) → Task 3, Task 4
- [ ] Spec §11 (Tüm 13 kabul kriteri) → Task 5 manual smoke + tsc/vite build

**Not:** Spec'in §10'unda "Sprint sonrası sonraki adımlar" var (memory güncelleme, Sprint 4 brainstorm). Bunlar implementation kapsamı dışında, push sonrası ayrı turlar.
