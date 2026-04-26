# Agent Quality Page — Admin Design (Phase F + F.1 + G)

**Tarih:** 2026-04-26
**Durum:** Brainstorm onaylı, implementation öncesi spec
**Backend kaynak:**
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/18-agent-quality.md` — Phase F (snapshot + trend) + Phase F.1 (turn drill-down)
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/19-agent-quality-alerts.md` — Phase G threshold alerts
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/00-overview.md` — route listesi

**Tarihsel arka plan:** Sprint 7 ile `/admin/cost-health` lazy-loaded route deseni oturdu (`useUrlFilterState`, `RouteLoadingFallback`, `CompanyCombobox`, `DateRangePicker`, `admin.*` query-key namespace, shadcn `popover`/`calendar`/`command` wrapper'ları). Bu spec, aynı feature-folder + lazy + URL-state kalıbını yeni 2 sayfa için tekrar uygular ve drill-down drawer'ı ile alerts polling badge'ini ilk kez bu repo'ya getirir.

## 1. Amaç

SuperAdmin operatörü, tenant'lar genelinde agent kalitesini (guardrail/retry/force_followup fire rate'leri + retrieval recall + cost-by-role) tek tabloda görsün; bir tenant'a inip günlük trend'i incelesin; trend'de anormal yükselen bir günde **o günü tetikleyen ham assistant turn'leri** tek tıkla görüntülesin. Threshold'u aşan tenant'ları proaktif olarak yakalayan alarmlar ayrı sayfada listelensin, sidebar'da açık alarm sayısı her zaman görünsün.

Hedef: deploy sonrası kalite regresyonunu (örn. guardrail fire rate'in %5'i aşması) cron'un fire ettiği andan itibaren maksimum 30 saniye içinde operatöre bildir + tıkla → trend → drill-down → ham turn'e ulaşma akışını tek pencere içinde tamamla.

## 2. Kapsam

### Bu spec içinde

- 2 yeni route, **lazy-loaded** (`React.lazy` + `<Suspense fallback={<RouteLoadingFallback />}>`):
  - `/admin/agent-quality` → `AgentQualityPage`
  - `/admin/agent-quality/alerts` → `AgentQualityAlertsPage`
- 5 yeni TanStack Query hook (cache window'ları backend doc'a birebir):
  - `useAgentQualitySnapshot(windowDays)` — 60s staleTime
  - `useAgentQualityTrend(companyId, windowDays)` — 5min staleTime
  - `useAgentQualityTurns({companyId, metric, date, page, pageSize})` — 60s staleTime
  - `useAgentQualityAlerts({status, companyId, metric, page, pageSize})` — 30s staleTime
  - `useAgentQualityAlertCount()` — `refetchInterval: 30_000`, `refetchIntervalInBackground: false`
- Yeni types modülü: `src/features/agent-quality/types.ts`
- Yeni paylaşılan primitive'ler:
  - `MetricLabel` — `guardrail`/`retry`/`force_followup` için TR label + renk chip
  - `RatePill` — yüzde value + opsiyonel threshold karşılaştırma rendering
  - `TrendSparkline` — Recharts üstü ince wrapper, `null` günlerde gap render
- 4 ana komponent (`/admin/agent-quality`):
  - `AgentQualityFilters` — windowDays select + lowSignal toggle
  - `AgentQualitySnapshotTable` — sortable tablo, row click trend'i açar
  - `AgentQualityTrendPanel` — 4 sparkline + cost stacked bar, sparkline bar click drill-down drawer'ı açar
  - `AgentQualityTurnsDrawer` — shadcn `Sheet`, paginated turn list
- 3 ana komponent (`/admin/agent-quality/alerts`):
  - `AgentQualityAlertsFilters` — status/company/metric filtreleri
  - `AgentQualityAlertsTable` — paginated tablo, row click trend'e navigate
  - `AlertCountBadge` (sidebar overlay) — open count gösteren küçük chip
- Sidebar'a 2 yeni item: `Agent Kalite` + `Alerts` (alerts item'ında count badge overlay), mevcut `/admin/cost-health` ile aynı separator altında
- Query-key namespace: `queryKeys.admin.agentQuality.*` ve `queryKeys.admin.agentQualityAlerts.*`
- URL state (extend `useUrlFilterState`):
  - `/admin/agent-quality?windowDays=&company=&trendDate=&metric=&page=&lowSignal=`
  - `/admin/agent-quality/alerts?status=&company=&metric=&page=`
- Loading / error / empty / 404 / partial-window state'ler
- Manuel smoke test + TypeScript + lint geçişi

### Bu spec dışında

- Cost role drill-down (Phase F-2: `usage_events.id`) — backend doc YAGNI olarak Phase F.2'ye bırakmış
- Retrieval-quality drill-down (Phase F-5: `search_query_logs.id`) — aynı şekilde Phase F.2
- Acknowledge/snooze endpoint (Phase G.1) — backend yok
- SSE push (Phase G.2) — bu PR 30s polling kullanır
- Cron health endpoint UI (Phase G.1) — backend yok, bu PR sadece alerts list + count
- Per-tenant threshold override (Phase G.1+) — backend yok
- Threshold sabitlerini frontend'de tutma — backend response'taki `threshold` field'ı authoritative
- "Acknowledge" / "Mute" UI — backend yok
- Range veya multi-metric drill-down query (`?from=&to=`, `?metrics=a,b`) — backend YAGNI
- Email digest UI (sadece backend cron işi)
- Diğer mevcut admin route'larını lazy'ye çevirmek (Sprint 8 followup, ayrı PR)

## 3. Mimari

### 3.1 Route + Lazy Loading

`src/App.tsx` değişikliği — Sprint 7 cost-health pattern'iyle birebir:

```tsx
const AgentQualityPage = lazy(() =>
  import('@/features/agent-quality/pages/agent-quality-page').then(m => ({
    default: m.AgentQualityPage
  }))
)
const AgentQualityAlertsPage = lazy(() =>
  import('@/features/agent-quality/pages/agent-quality-alerts-page').then(m => ({
    default: m.AgentQualityAlertsPage
  }))
)

// routes içinde:
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

`RouteLoadingFallback` Sprint 7'den olduğu gibi yeniden kullanılır.

### 3.2 Klasör Yapısı

```
src/
  features/
    agent-quality/                           (yeni)
      types.ts
      hooks/
        use-agent-quality-snapshot.ts
        use-agent-quality-trend.ts
        use-agent-quality-turns.ts
        use-agent-quality-alerts.ts
        use-agent-quality-alert-count.ts
      lib/
        metric-meta.ts                       (TR label + renk + tooltip metni)
      components/
        agent-quality-filters.tsx
        agent-quality-snapshot-table.tsx
        agent-quality-trend-panel.tsx
        agent-quality-turns-drawer.tsx
        agent-quality-alerts-filters.tsx
        agent-quality-alerts-table.tsx
        metric-label.tsx                     (paylaşılan primitive)
        rate-pill.tsx                        (paylaşılan primitive)
        trend-sparkline.tsx                  (Recharts wrapper)
      pages/
        agent-quality-page.tsx
        agent-quality-alerts-page.tsx
  components/
    layout/
      sidebar.tsx                            (değişir: 2 yeni item + badge overlay)
      alert-count-badge.tsx                  (yeni)
  lib/
    query-keys.ts                            (değişir: admin.agentQuality, admin.agentQualityAlerts)
  App.tsx                                    (değişir)
```

### 3.3 Query Keys

`src/lib/query-keys.ts`'e ekleme:

```ts
admin: {
  // mevcut: costHealth(...)
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
}
```

### 3.4 Types

`src/features/agent-quality/types.ts`:

```ts
export type AgentQualityMetric = 'guardrail' | 'retry' | 'force_followup'

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
  costByRole: Record<string, number>     // chat | toolStep | embedding | qualityEval | other
  totalCostUsd: number
}

export interface AgentQualitySnapshotResponse {
  windowDays: number
  generatedAt: string
  tenantsBelowSignalThreshold: number
  tenants: AgentQualitySnapshotRow[]
}

export interface AgentQualityTrendDay {
  date: string                              // YYYY-MM-DD
  assistantTurns: number
  guardrailFireRate: number | null          // null = empty day, render gap
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
  series: AgentQualityTrendDay[]            // length === windowDays
  costByRoleSeries: AgentQualityCostSeriesDay[]  // sparse, render gaps
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
  cronRunId: string
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
```

### 3.5 Cache Stratejisi (özet)

| Hook | staleTime | gcTime | refetchInterval | Kaynak |
|------|-----------|--------|------------------|--------|
| `useAgentQualitySnapshot` | 60_000 | 5min | — | 18.md "may cache the snapshot for 60 seconds" |
| `useAgentQualityTrend` | 300_000 | 10min | — | 18.md "trend for 5 minutes" |
| `useAgentQualityTurns` | 60_000 | 5min | — | drill-down dynamic feel |
| `useAgentQualityAlerts` | 30_000 | 5min | — | operator-active page |
| `useAgentQualityAlertCount` | 0 | 5min | 30_000 (foreground) | 19.md "Polling 30s önerilir" |

`refetchIntervalInBackground: false` count hook'ta — tab gizliyken polling durur.

## 4. UI

### 4.1 `/admin/agent-quality` — Snapshot + Trend + Drill-down

**Layout:**

```
┌─ Header ───────────────────────────────────────────────────────┐
│  Agent Kalite        [Window: 7d ▾]    [☐ Show low-signal]     │
│  Generated at 2026-04-25 18:00 UTC                             │
└────────────────────────────────────────────────────────────────┘

┌─ Banner (sadece tenantsBelowSignalThreshold > 0) ──────────────┐
│  ⓘ N tenants below signal threshold (toggle ile göster)        │
└────────────────────────────────────────────────────────────────┘

┌─ Snapshot Table ───────────────────────────────────────────────┐
│  Şirket       Turns  Guardrail  Retry   Follow  Retr Q  Cost ▾ Role │
│  Acme           247   3.4%       1.2%    0.8%   0.625  $6.22  chat  │ ◄ row click → ?company=X
│  Beta           198   2.1%       0.5%    0.0%   0.812  $4.10  chat  │
│  ...                                                                │
│  ─── low-signal (toggle açıksa) ───                                  │
│  Gamma            8    —          —       —      —      $0.12  —    │
└────────────────────────────────────────────────────────────────────┘

(company seçildiğinde aşağıda)

┌─ Trend Panel — Acme · 7 günlük ──────────────────────────[X]──┐
│  ┌ Guardrail (sparkline) ─┐ ┌ Retry ─────┐                    │
│  │  ‧  ‧  ‧  ╱╲  ‧  ‧  ‧ │ │ ‧ ‧ ‧ ‧ ‧ ‧│                    │ ← null gün → gap
│  │ click bar → drawer    │ │             │                    │
│  └───────────────────────┘ └─────────────┘                    │
│  ┌ Force Follow-Up ───────┐ ┌ Retr Quality ┐                  │
│  │ ...                    │ │ ...          │                  │
│  └────────────────────────┘ └──────────────┘                  │
│                                                                │
│  ┌ Cost by Role (stacked bar, 7 gün) ────────────────────────┐│
│  │ █ chat   ▓ toolStep   ░ embedding   ▒ qualityEval   ▦ other││
│  │ Sparse: eksik günler GAP (0 değil)                          ││
│  └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘

(trend bar click sonrası, sağdan açılan Sheet)

┌─ Turns Drawer ─ Acme · 2026-04-25 · guardrail (7) ──[X]┐
│  [openai/gpt-4o-mini]  $0.000234  1234↑/89↓            │
│  14:32:11 UTC                                          │
│  "Sen söylediğin için …"                              │
│  blocking codes: [missing_notes_citation]              │
│  → conversation: <uuid> link                           │
│  ─────────────────────────────                         │
│  [openai/gpt-4o]  $0.0011  ...                         │
│  ─────────────────────────────                         │
│  ‹ Page 1 / 2 ›                                       │
└────────────────────────────────────────────────────────┘
```

**URL state mapping** (extends `useUrlFilterState`):

| Param | Tip | Default | Notlar |
|-------|------|---------|--------|
| `windowDays` | `7 \| 14 \| 30 \| 90` | `7` | Select |
| `company` | `string \| undefined` | `undefined` | Trend'i açar |
| `trendDate` | `YYYY-MM-DD \| undefined` | `undefined` | Drawer'ı açar (date+metric+page üçü birlikte) |
| `metric` | `AgentQualityMetric \| undefined` | `undefined` | Drawer için |
| `page` | `number` | `1` | Drawer pagination |
| `lowSignal` | `'1' \| undefined` | `undefined` | Toggle |

`trendDate` tek başına olmaz — `trendDate` set ise `metric` de set olmak zorundadır; drawer açılışı bu invariant'ı korur (URL valid değilse drawer açılmaz, normalize edilir).

### 4.2 `/admin/agent-quality/alerts` — Alerts List

**Layout:**

```
┌─ Header ───────────────────────────────────────────────────┐
│  Active Alerts                                             │
│  [Status: open ▾] [Company ▾] [Metric ▾]                   │
└────────────────────────────────────────────────────────────┘

┌─ Alerts Table ─────────────────────────────────────────────┐
│  Şirket   Metric       Value/Threshold  Turns  Fired     Status │
│  Acme     guardrail    7.2% / 5.0%      312    14:00     OPEN   │ ← row click → /admin/agent-quality?company=X
│  Beta     retry        2.5% / 2.0%      89     12:30     OPEN   │
│  Gamma    force_fu     11.0% / 10.0%    420    08:15     RESOLVED 14:45│
│  ...                                                            │
│                                                                  │
│  Pagination: ‹ 1 / 4 ›                                          │
└────────────────────────────────────────────────────────────────┘
```

**URL state:**

| Param | Tip | Default |
|-------|------|---------|
| `status` | `'open' \| 'all'` | `'open'` |
| `company` | `string \| undefined` | `undefined` |
| `metric` | `AgentQualityMetric \| undefined` | `undefined` |
| `page` | `number` | `1` |

`pageSize` URL'de yok, sabit 20.

### 4.3 Sidebar Değişikliği

`src/components/layout/sidebar.tsx`:

```tsx
const platformItems = [
  { to: '/admin/cost-health', icon: Activity, label: 'Cost Health' },
  { to: '/admin/agent-quality', icon: Gauge, label: 'Agent Kalite' },
  { to: '/admin/agent-quality/alerts', icon: Bell, label: 'Alerts', badge: 'agentQualityAlertCount' },
]
```

`renderNavItem` extend edilir: `badge` field'ı varsa item'ın sağ-üstüne `<AlertCountBadge />` overlay'ler. Badge `useAgentQualityAlertCount` hook'undan çeker; sayı 0 ise hiç render etmez, >0 ise küçük kırmızı dot + sayı.

`AlertCountBadge` ayrı bir component (`src/components/layout/alert-count-badge.tsx`) — sidebar dışında reuse edilmesi gerekirse hazır olur (örn. dashboard widget). Item'ın badge field'ı string id (`'agentQualityAlertCount'`) olarak kalır; sidebar render esnasında bu id'ye bakıp doğru hook'u çağıran bir match yapar (badge tipi büyürse generic'e çıkarılır).

## 5. Veri Akışı

### 5.1 Snapshot → Trend → Drill-down

1. Sayfa mount: `useAgentQualitySnapshot(windowDays)` çalışır, tablo render olur.
2. Row click → `setUrlState({ company: row.companyId })`. URL değişir.
3. URL'den `company` okunur → `useAgentQualityTrend(company, windowDays)` çalışır, trend panel açılır.
4. Sparkline bar click → `setUrlState({ trendDate: 'YYYY-MM-DD', metric: 'guardrail', page: 1 })`. URL değişir.
5. URL'den triple okunur → `useAgentQualityTurns({...})` çalışır, drawer açılır.
6. Drawer pagination → URL `page` güncellenir.
7. Drawer close → `setUrlState({ trendDate: undefined, metric: undefined, page: undefined })`. Trend panel açık kalır.
8. Trend panel close (X) → `setUrlState({ company: undefined, ...drawer params undefined })`.

### 5.2 Alerts → Trend Navigation

1. Alerts row click → `navigate('/admin/agent-quality?windowDays=7&company=X')`.
2. Hedef sayfada trend açık şekilde mount olur, operatör trend bar'ına tıklayıp drill-down'a iner.

### 5.3 Sidebar Badge Polling

1. App layout mount olduğu sürece (yani superadmin oturumu açıkken) `useAgentQualityAlertCount` `refetchInterval: 30_000` ile poll'lar.
2. Network error → eski sayı korunur, kullanıcıya hata gösterilmez (sessiz fail).
3. Tab arka plana gittiğinde `refetchIntervalInBackground: false` ile polling durur, foreground'a dönünce devam eder.

## 6. Edge Cases

### Loading
- **Snapshot:** `<SkeletonRow />` × 5
- **Trend:** 4 sparkline placeholder + cost stacked bar placeholder
- **Drawer:** 3 turn satırı skeleton
- **Alerts:** `<SkeletonRow />` × 5
- **Badge:** ilk yüklemede sayı yok, render etmez

### Error
- **Snapshot/Alerts:** `<ErrorState>` + retry CTA
- **Trend:** trend panel içinde error chip + retry; tablo görünür kalır
- **Drawer:** drawer içinde error chip + retry; trend görünür kalır
- **Badge:** sessiz fail, eski sayı korunur

### Empty
- **Snapshot tenants=[]:** "Henüz kalite verisi yok" empty state
- **Trend tüm günler null:** "Bu pencerede trafik yok" banner; sparkline'lar 100% gap; cost panel "Bu pencerede AI usage yok"
- **Drawer total=0:** "Bu günde fire eden turn yok" empty state (404 değil — backend doc'a göre 200 + boş)
- **Alerts total=0:** "Aktif alarm yok" empty state, neutral
- **Badge open=0:** render etmez

### 404
- **Trend (soft-deleted company):** "Şirket erişilemez (silinmiş olabilir)" + tabloya geri dön CTA; trend panel kapanır, URL `company=` temizlenir
- **Turns (aynı semantik):** drawer kapanır, trend açık kalır, hata chip'i

### `null` → gap rendering
- Trend `series` günleri `rate === null` → Recharts data noktası undefined yapılır + `connectNulls={false}` → görsel gap
- `costByRoleSeries` sparse → x-axis `series.date` listesinden alınır; eksik günler chart'ta boş slot kalır (zero değil), tooltip "Bu günde AI usage yok" der
- **Null rate gününe tıklama no-op'tur** — drill-down açılmaz. Bar click handler `if (rate == null) return` ile erken çıkar; cursor hover'da "fire eden turn yok" tooltip'i.

### Partial deploy window (forceFollowUpRate)
- Phase F deploy öncesi turn'lerde flag yok → ilk window'da düşük/0 görülür. Force-followup sparkline başlığında `(?)` tooltip:
  > "Phase F deploy'undan önceki turn'lerde bu flag yok. Trend ~7 gün sonra anlam kazanır."

### Threshold alanı (alerts)
- Frontend threshold sabitleri **hard-code etmez**. Alert response'taki `threshold` field'ından okur; backend güncellerse FE değişmez. Tooltip: "Threshold backend tarafından sabit tutulur (yılda 2-3 kez güncellenir)."

### XSS / escape
- `companyName` ve `contentPreview` ham string. React text-binding (otomatik escape) kullanılır.
- `dangerouslySetInnerHTML` ASLA kullanılmaz.
- `metricReason.blockingReasonCodes` array öğeleri `<Badge>{code}</Badge>` ile binding edilir; defansif: `Array.isArray` kontrolü.
- `companyName === null` → `<i>(adı yok)</i>` gösterimi (tenant edge case'i).

### Tarih sınırları (drill-down)
- Drill-down sadece trend bar tıklamasıyla açılır → tarih trend window'unun içinde (≤365 gün). Backend extra 400 dönerse error chip gösterilir.
- URL doğrudan girilirse (manuel) ve tarih invalid ise: error chip + "Geçerli bir trend günü seçin" mesajı, drawer açılmaz.

### Pagination
- Drawer: `pageSize=20`, `page` 1-bazlı. `total === 0` ise pagination render edilmez. `page * pageSize > total` durumunda son sayfaya snap.
- Alerts: aynı, `pageSize=20`.

### Cache invalidation
- **Window değişikliği:** snapshot key değiştiği için natural refetch.
- **Filter değişikliği:** alerts list key değiştiği için natural refetch.
- **Manuel refresh** (kullanıcı isteği): bu spec'te buton yok — staleTime + refetchOnWindowFocus default davranış yeterli.

### Sort
- Snapshot tablo backend tarafından `guardrailFireRate DESC` sortlu gelir. Client-side ek sort: TanStack Table column sortable; default state server order'ını tutar.
- Alerts: backend default `firedAt DESC`. Client column sortable.

## 7. Komponent Sözleşmeleri

### `AgentQualitySnapshotTable`
- **Props:** `data: AgentQualitySnapshotRow[]`, `selectedCompanyId?: string`, `onSelect: (id: string) => void`, `showLowSignal: boolean`
- **Davranış:** `showLowSignal=false` ise `lowSignal=true` row'lar filtre dışı; `selectedCompanyId` row'u highlight; row click `onSelect` çağırır.
- **Test:** golden path (3 row render, click → callback), low-signal toggle off (filter), empty state.

### `AgentQualityTrendPanel`
- **Props:** `companyId: string`, `companyName: string | null`, `data: AgentQualityTrendResponse`, `onBarClick: (date: string, metric: AgentQualityMetric) => void`, `onClose: () => void`
- **Davranış:** 4 `TrendSparkline` (one per metric) + `CostByRoleStackedBar`. Sparkline bar click → `onBarClick(date, metric)`. Cost bar click no-op (Phase F-2 dışı).
- **Test:** null gün gap render, sparkline click → callback, cost sparse render, close → callback.

### `AgentQualityTurnsDrawer`
- **Props:** `open: boolean`, `params: { companyId, metric, date, page } | null`, `onClose: () => void`, `onPageChange: (page: number) => void`
- **Davranış:** `open=true && params!=null` → Sheet açık, `useAgentQualityTurns(params)` çalışır. Pagination → `onPageChange`. Close → `onClose`.
- **Test:** loading/error/empty, pagination, conversation link açma.

### `AgentQualityAlertsTable`
- **Props:** `data: AgentQualityAlertRow[]`, `onRowClick: (companyId: string) => void`
- **Davranış:** row click → navigate trend.
- **Test:** golden path, resolved row farklı badge, value/threshold rendering.

### `AlertCountBadge`
- **Props:** `count: number | undefined` (undefined = loading)
- **Davranış:** `count === undefined || count === 0` → null render. Else küçük kırmızı pill. ARIA: `aria-label="N açık alarm"`.

## 8. Test Yaklaşımı

Repo'da otomatik test altyapısı şu an Vitest + Testing Library (cost-health'te query hook test pattern'i mevcut). Bu spec aynı patern'i takip eder:

- **Hook unit test'leri** (`*.test.ts`): mock fetch + TanStack Query test wrapper. `useAgentQualitySnapshot`, `useAgentQualityTrend`, `useAgentQualityTurns`, `useAgentQualityAlerts`, `useAgentQualityAlertCount` için success + error path.
- **Component test'leri** (`*.test.tsx`): jsdom + Testing Library. Her ana component için bir golden path + bir error path.
- **URL state test'leri:** memory router + `useUrlFilterState`; URL → state, state → URL roundtrip; trendDate+metric invariant.
- **Manuel smoke** (dev server `npm run dev`):
  1. `/admin/agent-quality` → snapshot tablo gelir
  2. Window 7d → 30d değişir, refetch olur
  3. Low-signal toggle aç/kapa → row sayısı değişir
  4. Row click → trend panel açılır, URL update
  5. Sparkline bar click → drawer açılır, turns gelir, pagination çalışır
  6. Drawer close → trend açık kalır
  7. Trend close → tabloya döner
  8. `/admin/agent-quality/alerts` → liste gelir
  9. Alerts row click → trend açılır
  10. Sidebar Alerts badge → açık sayı doğru render olur, 0 ise badge yok. (Cron tetiklemesini manuel test etmek backend altyapısına dokunmadan zor; bu adımı badge'in mevcut açık alarm sayısını doğru yansıttığına indirgeriz — count endpoint'inin response'u UI'da görünüyor mu kontrolü yeterli.)
  11. Refresh sonrası URL state korunur (deep-linkable): `/admin/agent-quality?company=X&trendDate=Y&metric=guardrail&page=2` ile direkt drawer açık gelir.

## 9. Bundle / Performance

- `recharts` zaten cost-health bundle'ında; bu spec yeni dep eklemez.
- 2 yeni route lazy split → her biri ~30-50 kB raw + paylaşılan recharts chunk reuse.
- Sidebar badge polling 30s + foreground-only → operasyonel network maliyeti ihmal.

## 10. Açık Risk / Followup

- **Trend bar tıklama hit area** Recharts'ta bazen küçük; kullanıcı testi sonrası tooltip + cursor pointer + bar genişliği yeterli mi diye bakılır. Plan içine "manuel smoke iterasyon noktası" olarak girer.
- **Alert row → trend nav'ı** sadece `?company=X&windowDays=7` veriyor; alert'ın fire ettiği güne otomatik scroll edilmiyor (ham `firedAt` günü trend'in içinde olabilir ama bar highlight yok). Phase G.0.1 olarak `&trendDate=Y&metric=Z` deep-link alert tarafından üretilirse drawer otomatik açık gelir — şu an kapsam dışı, plan içine "follow-up enhancement" notu girer.
- **`'other'` cost bucket** backend doc'a göre steady-state'te boş; FE renkli legend'de göstermez ama veri gelirse `other` segmenti gri ile render eder, tooltip'te "USAGE_EVENT_TYPE_TO_ROLE coverage" notu vermez (operatörün anlayacağı bir şey değil — backend log'una düşer).
