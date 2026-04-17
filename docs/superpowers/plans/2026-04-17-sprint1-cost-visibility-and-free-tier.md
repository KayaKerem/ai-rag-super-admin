# Sprint 1 — Cost Visibility & Free Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend Phase 2 maliyet kalemleri (`research`, `quotePrepare`) ve yeni model tier'ı (`free`) süper admin panelinde görünür kılınır.

**Architecture:** Sekiz dosyada minimal inline değişiklik + tip merkezde extension. Yeni component/abstraction yok. Backend henüz alanları döndürmüyorsa defensive `?? 0` fallback ile $0 gösterilir.

**Tech Stack:** React 18, TypeScript (strict), Vite, Recharts (BarChart), TailwindCSS, react-query.

**Spec:** `docs/superpowers/specs/2026-04-17-sprint1-cost-visibility-and-free-tier-design.md`

**Önemli not (spec'ten sapan tek nokta):** Spec §3.4 `cost-trend-chart.tsx`'e seri eklenmesinden bahsediyor, ancak gerçek dosya yalnızca `totalCostUsd` (tek bar) gösteriyor — backend total'a yeni kalemleri zaten dahil ediyor, dolayısıyla bu dosyaya kod değişikliği gerekmez. Bunun yerine Task 6'da görsel doğrulama yapılır.

---

## Dosya Haritası

| # | Dosya | Sorumluluk | Task |
|---|-------|------------|------|
| 1 | `src/features/companies/types.ts` | Tip merkezi: `UsageMonth` extension + `PlatformModel.tier`/`AllowedModel.tier` union'ına `'free'` | Task 1 |
| 2 | `src/features/dashboard/hooks/use-platform-summary.ts` | Lokal `UsageMonth` aynı opsiyonel alanlar | Task 1 |
| 3 | `src/features/companies/components/allowed-models-editor.tsx` | `TIER_LABELS` + `TIER_ORDER` `'free'` ekleme | Task 2 |
| 4 | `src/features/companies/components/usage-tab.tsx` | KPI'lar 2 başlıklı gruba ayrıştırılır, 2 yeni kart | Task 3 |
| 5 | `src/features/companies/components/usage-chart.tsx` | 8 seri stack (AI grubu önce, altyapı sonra) | Task 4 |
| 6 | `src/features/dashboard/components/category-breakdown.tsx` | `research` + `quotePrepare` props + categories | Task 5 |
| 7 | `src/features/dashboard/pages/dashboard-page.tsx` | Yeni props'u CategoryBreakdown'a geçir | Task 5 |
| 8 | `src/features/dashboard/components/cost-trend-chart.tsx` | **Değişiklik yok** — sadece visual verify (Task 6) | — |

---

## Task 0: Backend Field Name Doğrulaması (Blocking — Manuel)

> Bu task kod değil; sadece güvenlik kontrolü. Sonraki tüm tasklar bunun sonucuna göre devam eder.

**Amaç:** Backend response'unda field adlarının `research` / `quotePrepare` (camelCase) mı yoksa `research_tool` / `quote_prepare` (snake_case) mı olduğunu doğrulamak.

- [ ] **Step 1: Production veya staging'den gerçek bir usage response'u al**

User şu komutu çalıştırır (kendisi token sahibi):

```bash
# JWT token'ı ile (kullanıcı browser'dan kopyalar)
curl -s -H "Authorization: Bearer <JWT>" \
  "https://api.edfu.ai/platform/usage/summary?months=1" | jq '.months[0] | keys'
```

- [ ] **Step 2: Sonucu kontrol et**

Beklenen: `research` ve `quotePrepare` key'leri görünmeli.

- Eğer key'ler **camelCase** → spec'tekiler doğru, plana devam et.
- Eğer key'ler **snake_case** (`research_tool`, `quote_prepare`) → tüm tasklarda field adlarını güncelle (Task 1, 3, 4, 5'teki interface'ler ve render kodu).
- Eğer key'ler **hiç yoksa** → backend henüz eklememiş. Plana defensive `?? 0` ile devam edilebilir; KPI'lar $0 gösterir.

- [ ] **Step 3: Bulguyu kaydet**

Bu plan dosyasının başına bir not ekle:

```markdown
> **Backend field adı doğrulaması (DD-MM-YYYY):** `research` / `quotePrepare` camelCase ile dönüyor / dönmüyor.
```

---

## Task 1: Tip Extensions (Foundation)

**Files:**
- Modify: `src/features/companies/types.ts:50-76`
- Modify: `src/features/dashboard/hooks/use-platform-summary.ts:5-17`

- [ ] **Step 1: `companies/types.ts` — `UsageMonth` interface'ini extend et**

Mevcut (satır 50-58):

```typescript
export interface UsageMonth {
  month: string
  ai: { totalTokens: number; turnCount: number; costUsd: number }
  rerank?: { searchCount: number; documentCount: number; costUsd: number }
  webSearch?: { searchCount: number; resultCount: number; costUsd: number }
  proactive?: { runCount: number; insightCount: number; costUsd: number }
  cacheHits?: { hitCount: number; hitRate: number; estimatedSavingsUsd: number }
  storage: { currentBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
}
```

Yeni hâl (`research` ve `quotePrepare` eklendi):

```typescript
export interface UsageMonth {
  month: string
  ai: { totalTokens: number; turnCount: number; costUsd: number }
  rerank?: { searchCount: number; documentCount: number; costUsd: number }
  webSearch?: { searchCount: number; resultCount: number; costUsd: number }
  proactive?: { runCount: number; insightCount: number; costUsd: number }
  cacheHits?: { hitCount: number; hitRate: number; estimatedSavingsUsd: number }
  research?: { searchCount: number; costUsd: number }
  quotePrepare?: { quoteCount: number; costUsd: number }
  storage: { currentBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
}
```

- [ ] **Step 2: `companies/types.ts` — `PlatformModel.tier` union'ına `'free'` ekle**

Mevcut (satır 67):

```typescript
  tier: 'premium' | 'standard' | 'economy'
```

Yeni:

```typescript
  tier: 'premium' | 'standard' | 'economy' | 'free'
```

- [ ] **Step 3: `companies/types.ts` — `AllowedModel.tier` union'ına `'free'` ekle**

Mevcut (satır 74):

```typescript
  tier?: 'premium' | 'standard' | 'economy'
```

Yeni:

```typescript
  tier?: 'premium' | 'standard' | 'economy' | 'free'
```

- [ ] **Step 4: `use-platform-summary.ts` — Lokal `UsageMonth` interface'ini extend et**

Mevcut (satır 5-17):

```typescript
interface UsageMonth {
  month: string
  companyCount: number
  ai: { totalTokens: number; costUsd: number }
  rerank: { searchCount: number; costUsd: number }
  webSearch: { searchCount: number; costUsd: number }
  proactive: { runCount: number; costUsd: number }
  storage: { totalBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
  satisfactionRate?: number
  totalActiveUsers?: number
}
```

Yeni:

```typescript
interface UsageMonth {
  month: string
  companyCount: number
  ai: { totalTokens: number; costUsd: number }
  rerank: { searchCount: number; costUsd: number }
  webSearch: { searchCount: number; costUsd: number }
  proactive: { runCount: number; costUsd: number }
  research?: { searchCount: number; costUsd: number }
  quotePrepare?: { quoteCount: number; costUsd: number }
  storage: { totalBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
  satisfactionRate?: number
  totalActiveUsers?: number
}
```

- [ ] **Step 5: TypeScript build doğrulaması**

Run: `npm run build`

Expected: `tsc -b && vite build` hata olmadan tamamlanır. Tip değişiklikleri sonraki tasklarda kullanılacak.

> Build'in tam olarak çalıştığını teyit etmek için exit code 0 olmalı. ESLint warning'ler kabul edilebilir, ama tip hataları YOKSA devam.

- [ ] **Step 6: Commit**

```bash
git add src/features/companies/types.ts src/features/dashboard/hooks/use-platform-summary.ts
git commit -m "feat(types): extend UsageMonth with research/quotePrepare and add 'free' tier"
```

---

## Task 2: Allowed Models Editor — Free Tier

**Files:**
- Modify: `src/features/companies/components/allowed-models-editor.tsx:16-22`

- [ ] **Step 1: `TIER_LABELS` ve `TIER_ORDER` sabitlerine `'free'` ekle**

Mevcut (satır 16-22):

```typescript
const TIER_LABELS: Record<string, string> = {
  premium: 'Premium',
  standard: 'Standard',
  economy: 'Economy',
}

const TIER_ORDER = ['premium', 'standard', 'economy']
```

Yeni:

```typescript
const TIER_LABELS: Record<string, string> = {
  premium: 'Premium',
  standard: 'Standard',
  economy: 'Economy',
  free: 'Ücretsiz',
}

const TIER_ORDER = ['premium', 'standard', 'economy', 'free']
```

- [ ] **Step 2: TypeScript build doğrulaması**

Run: `npm run build`

Expected: hata yok. Task 1'deki tip değişiklikleri burada `model.tier` içinde `'free'` değerine izin veriyor.

- [ ] **Step 3: Visual smoke check (opsiyonel ama önerilir)**

`npm run dev` ile geliştirme sunucusunu başlat, `/companies/:id` → Yapılandırma → AI sekmesinde Allowed Models'i aç. Eğer backend free tier modeli döndürüyorsa "Ücretsiz" başlığı altında ayrı grup görünmeli. Yoksa hiç render edilmez (mevcut filter logic).

> Backend free tier modeli döndürmüyorsa bu task'ın görsel etkisi olmaz, ancak gelecekte döndürdüğünde otomatik çalışır.

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/components/allowed-models-editor.tsx
git commit -m "feat(models): support 'free' tier in allowed models editor"
```

---

## Task 3: Usage Tab — Group Restructure + New KPIs

**Files:**
- Modify: `src/features/companies/components/usage-tab.tsx:43-55`

- [ ] **Step 1: KPI grid bloğunu 2 başlıklı gruba dönüştür**

Mevcut (satır 43-55):

```tsx
      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="AI" value={formatCurrency(current.ai.costUsd)} subtitle={`${formatNumber(current.ai.totalTokens)} token`} subtitleColor="text-violet-400" />
          <KpiCard label="Rerank" value={formatCurrency(current.rerank?.costUsd ?? 0)} subtitle={`${formatNumber(current.rerank?.searchCount ?? 0)} sorgu`} subtitleColor="text-pink-400" />
          <KpiCard label="Web Search" value={formatCurrency(current.webSearch?.costUsd ?? 0)} subtitle={`${formatNumber(current.webSearch?.searchCount ?? 0)} arama`} subtitleColor="text-teal-400" />
          <KpiCard label="Storage" value={formatCurrency(current.storage.costUsd)} subtitle={`${formatBytes(current.storage.currentBytes)} kullanım`} subtitleColor="text-green-400" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Proaktif" value={formatCurrency(current.proactive?.costUsd ?? 0)} subtitle={`${formatNumber(current.proactive?.insightCount ?? 0)} insight`} subtitleColor="text-orange-400" />
          <KpiCard label="Cache Tasarruf" value={formatCurrency(current.cacheHits?.estimatedSavingsUsd ?? 0)} subtitle={`%${Math.round((current.cacheHits?.hitRate ?? 0) * 100)} hit rate`} subtitleColor="text-emerald-400" />
          <KpiCard label="Trigger" value={formatCurrency(current.trigger.costUsd)} subtitle={`${formatNumber(current.trigger.taskCount)} task`} subtitleColor="text-yellow-400" />
        </div>
      </div>
```

Yeni:

```tsx
      <div className="mb-4 space-y-4">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI</h3>
          <div className="grid grid-cols-4 gap-3">
            <KpiCard label="AI" value={formatCurrency(current.ai.costUsd)} subtitle={`${formatNumber(current.ai.totalTokens)} token`} subtitleColor="text-violet-400" />
            <KpiCard label="Rerank" value={formatCurrency(current.rerank?.costUsd ?? 0)} subtitle={`${formatNumber(current.rerank?.searchCount ?? 0)} sorgu`} subtitleColor="text-pink-400" />
            <KpiCard label="Web Search" value={formatCurrency(current.webSearch?.costUsd ?? 0)} subtitle={`${formatNumber(current.webSearch?.searchCount ?? 0)} arama`} subtitleColor="text-teal-400" />
            <KpiCard label="Research" value={formatCurrency(current.research?.costUsd ?? 0)} subtitle={`${formatNumber(current.research?.searchCount ?? 0)} araştırma`} subtitleColor="text-cyan-400" />
            <KpiCard label="Quote Hazırlama" value={formatCurrency(current.quotePrepare?.costUsd ?? 0)} subtitle={`${formatNumber(current.quotePrepare?.quoteCount ?? 0)} teklif`} subtitleColor="text-indigo-400" />
            <KpiCard label="Proaktif" value={formatCurrency(current.proactive?.costUsd ?? 0)} subtitle={`${formatNumber(current.proactive?.insightCount ?? 0)} insight`} subtitleColor="text-orange-400" />
            <KpiCard label="Cache Tasarruf" value={formatCurrency(current.cacheHits?.estimatedSavingsUsd ?? 0)} subtitle={`%${Math.round((current.cacheHits?.hitRate ?? 0) * 100)} hit rate`} subtitleColor="text-emerald-400" />
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Altyapı</h3>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Storage" value={formatCurrency(current.storage.costUsd)} subtitle={`${formatBytes(current.storage.currentBytes)} kullanım`} subtitleColor="text-green-400" />
            <KpiCard label="Trigger" value={formatCurrency(current.trigger.costUsd)} subtitle={`${formatNumber(current.trigger.taskCount)} task`} subtitleColor="text-yellow-400" />
          </div>
        </div>
      </div>
```

> Storage `text-green-400` rengini koruyor (mevcut altyapı semantik), Trigger `text-yellow-400`. Yeni Research = cyan, Quote Hazırlama = indigo.

- [ ] **Step 2: TypeScript build doğrulaması**

Run: `npm run build`

Expected: hata yok. Task 1'deki UsageMonth extension'ı `current.research?` ve `current.quotePrepare?` erişimini sağlar.

- [ ] **Step 3: Visual smoke check**

`npm run dev` → `/companies/:id` → Kullanım sekmesi.

Beklenen:
- 2 başlık görünüyor: "AI" ve "ALTYAPI" (uppercase tracking).
- AI grubunda 7 kart (4+3 düzeninde). 2. satırda Research, Cache Tasarruf, Proaktif veya benzeri sırayla 3 kart.
- Altyapı grubunda 2 kart (Storage, Trigger) yan yana.
- Backend research/quotePrepare döndürmüyorsa → Research kartı `$0.00` + `0 araştırma`, Quote Hazırlama kartı `$0.00` + `0 teklif` (kabul edilebilir).
- Console'da error olmamalı.

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/components/usage-tab.tsx
git commit -m "feat(usage): regroup KPIs into AI/Altyapı sections, add research+quotePrepare cards"
```

---

## Task 4: Usage Chart — 2 Yeni Seri + Sıralama

**Files:**
- Modify: `src/features/companies/components/usage-chart.tsx:9-43`

- [ ] **Step 1: Tüm chart bloğunu güncelle (yeni seriler + yeni sıralama)**

Mevcut dosyanın tamamı (44 satır) yerine yeni hali:

```tsx
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UsageMonth } from '../types'

interface UsageChartProps {
  data: UsageMonth[]
}

export function UsageChart({ data }: UsageChartProps) {
  const chartData = [...data].reverse().map((d) => ({
    month: d.month.slice(5),
    AI: d.ai.costUsd,
    Rerank: d.rerank?.costUsd ?? 0,
    Research: d.research?.costUsd ?? 0,
    'Quote Hazırlama': d.quotePrepare?.costUsd ?? 0,
    'Web Search': d.webSearch?.costUsd ?? 0,
    Proactive: d.proactive?.costUsd ?? 0,
    Storage: d.storage.costUsd,
    Trigger: d.trigger.costUsd,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Aylık Maliyet Trendi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(v: any) => `$${(v as number).toFixed(2)}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="AI" stackId="a" fill="#6d28d9" />
            <Bar dataKey="Rerank" stackId="a" fill="#ec4899" />
            <Bar dataKey="Research" stackId="a" fill="#06b6d4" />
            <Bar dataKey="Quote Hazırlama" stackId="a" fill="#6366f1" />
            <Bar dataKey="Web Search" stackId="a" fill="#14b8a6" />
            <Bar dataKey="Proactive" stackId="a" fill="#f97316" />
            <Bar dataKey="Storage" stackId="a" fill="#22c55e" />
            <Bar dataKey="Trigger" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

> Stack sırası alttan üste: AI → Rerank → Research → Quote Hazırlama → Web Search → Proactive → Storage → Trigger. AI grubu (mor→pembe→cyan→indigo→teal→turuncu) altta, altyapı grubu (yeşil→sarı) üstte. `radius` sadece en son `Bar`'da (Trigger) — Recharts en üst bar'a uygulanır.

- [ ] **Step 2: TypeScript + lint build doğrulaması**

Run: `npm run build`

Expected: hata yok. `as any` cast'i mevcut kodda zaten vardı, bu kalıba uyduk.

- [ ] **Step 3: Visual smoke check**

`/companies/:id` → Kullanım sekmesi → grafiğe bak.

Beklenen:
- Stacked bar chart, her ay için 8 renk segmenti (alttan üste sıra: AI, Rerank, Research, Quote Hazırlama, Web Search, Proactive, Storage, Trigger).
- Legend altta 8 etiket görünüyor.
- Backend research/quotePrepare döndürmüyorsa → o segmentler 0 yükseklikte görünmez (kabul edilebilir).
- Hover tooltip her seri için doğru maliyet gösterir.

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/components/usage-chart.tsx
git commit -m "feat(usage-chart): add research+quotePrepare series with AI-first ordering"
```

---

## Task 5: Dashboard Category Breakdown — Props + Page Wiring

**Files:**
- Modify: `src/features/dashboard/components/category-breakdown.tsx:4-24`
- Modify: `src/features/dashboard/pages/dashboard-page.tsx:71-78`

- [ ] **Step 1: `category-breakdown.tsx`'in tamamını güncelle**

Mevcut dosyanın tamamı (53 satır) yerine yeni hali:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface CategoryBreakdownProps {
  ai: number
  rerank: number
  webSearch: number
  research: number
  quotePrepare: number
  proactive: number
  storage: number
  trigger: number
}

const categories = [
  { key: 'ai' as const, label: 'AI', color: '#6d28d9' },
  { key: 'rerank' as const, label: 'Rerank', color: '#ec4899' },
  { key: 'research' as const, label: 'Research', color: '#06b6d4' },
  { key: 'quotePrepare' as const, label: 'Quote Hazırlama', color: '#6366f1' },
  { key: 'webSearch' as const, label: 'Web Search', color: '#14b8a6' },
  { key: 'proactive' as const, label: 'Proaktif', color: '#f97316' },
  { key: 'storage' as const, label: 'Storage', color: '#22c55e' },
  { key: 'trigger' as const, label: 'Trigger', color: '#f59e0b' },
]

export function CategoryBreakdown({ ai, rerank, webSearch, research, quotePrepare, proactive, storage, trigger }: CategoryBreakdownProps) {
  const values = { ai, rerank, webSearch, research, quotePrepare, proactive, storage, trigger }
  const max = Math.max(ai, rerank, webSearch, research, quotePrepare, proactive, storage, trigger, 0.01)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Kategori Dağılımı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-semibold">{formatCurrency(values[cat.key])}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((values[cat.key] / max) * 100, 1)}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

> Sıralama Usage Chart ile aynı: AI → Rerank → Research → Quote Hazırlama → Web Search → Proaktif → Storage → Trigger. Renk kodları da aynı.

- [ ] **Step 2: `dashboard-page.tsx`'de `<CategoryBreakdown />` prop'larını güncelle**

Mevcut (satır 71-78):

```tsx
            <CategoryBreakdown
              ai={current.ai.costUsd}
              rerank={current.rerank?.costUsd ?? 0}
              webSearch={current.webSearch?.costUsd ?? 0}
              proactive={current.proactive?.costUsd ?? 0}
              storage={current.storage.costUsd}
              trigger={current.trigger.costUsd}
            />
```

Yeni:

```tsx
            <CategoryBreakdown
              ai={current.ai.costUsd}
              rerank={current.rerank?.costUsd ?? 0}
              webSearch={current.webSearch?.costUsd ?? 0}
              research={current.research?.costUsd ?? 0}
              quotePrepare={current.quotePrepare?.costUsd ?? 0}
              proactive={current.proactive?.costUsd ?? 0}
              storage={current.storage.costUsd}
              trigger={current.trigger.costUsd}
            />
```

- [ ] **Step 3: TypeScript build doğrulaması**

Run: `npm run build`

Expected: hata yok. Task 1'deki `use-platform-summary.ts:UsageMonth` extension'ı `current.research?` ve `current.quotePrepare?` erişimini sağlar.

> Eğer "Property 'research' does not exist on type 'UsageMonth'" hatası gelirse Task 1 Step 4 atlanmıştır — geri dön ve `use-platform-summary.ts`'i güncelle.

- [ ] **Step 4: Visual smoke check**

`/` (Dashboard) sayfası.

Beklenen:
- "Kategori Dağılımı" kartında 8 satır görünüyor: AI, Rerank, Research, Quote Hazırlama, Web Search, Proaktif, Storage, Trigger.
- Her satırda label + maliyet + bar.
- Backend research/quotePrepare döndürmüyorsa → Research ve Quote Hazırlama satırları `$0.00` ile bar minimum 1% genişlikte (mevcut `Math.max(..., 1)` davranışı).
- Console'da error yok.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/category-breakdown.tsx src/features/dashboard/pages/dashboard-page.tsx
git commit -m "feat(dashboard): add research+quotePrepare to category breakdown"
```

---

## Task 6: Final End-to-End Verification

> Bu task kod değişikliği içermez; tüm değişiklikleri bir arada doğrular.

- [ ] **Step 1: Full build + lint**

```bash
npm run build && npm run lint
```

Expected:
- `tsc -b && vite build` exit 0.
- `eslint .` warning olabilir ama yeni hata gelmemeli (bu sprint'te eklenen kodda lint hatası olmamalı).

- [ ] **Step 2: Dev server + visual smoke (ana akış)**

```bash
npm run dev
```

Browser'da şu sayfaları gez:

1. **`/` (Dashboard):**
   - "Kategori Dağılımı" kartında 8 kalem görünmeli (AI, Rerank, Research, Quote Hazırlama, Web Search, Proaktif, Storage, Trigger).
   - "Aylık Maliyet Trendi" kartı (CostTrendChart) hâlâ tek bar gösterir (totalCostUsd) — değişiklik yok, beklenen.
   - KpiCard'lar normal görünüyor.
2. **`/companies` → herhangi bir şirket → Kullanım tab:**
   - 2 başlık: "AI" (üstte) + "ALTYAPI" (altta).
   - AI grubunda 7 kart (4+3), Altyapı grubunda 2 kart (yan yana).
   - "Aylık Maliyet Trendi" stacked chart 8 seri gösteriyor (legend'da 8 etiket).
3. **`/companies/:id` → Yapılandırma → AI → Allowed Models editörü:**
   - Backend free tier modeli döndürüyorsa "Ücretsiz" başlıklı 4. grup görünür.
   - Yoksa 3 grup (Premium / Standard / Economy) gibi mevcut görünüm korunur.

- [ ] **Step 3: Console error & network tab kontrolü**

DevTools açık → tüm sayfaları gez → console'da hiç error olmamalı. Network tab'da `/platform/companies/:id/usage`, `/platform/usage/summary` request'leri 200 dönüyor olmalı.

- [ ] **Step 4: Eğer Step 2 veya 3'te bug bulunursa**

İlgili Task'a geri dön, düzelt, ayrı commit et:

```bash
git commit -m "fix(<area>): <açıklama>"
```

> Bug yoksa ekstra commit yok.

- [ ] **Step 5: Sprint kapanış commit'i (opsiyonel)**

Tüm tasklar başarılıysa ve değişiklikler stable ise herhangi bir branching/merge gerekmiyor (worktree ortamında integration başka adım). Worktree dışındaysak doğrudan main'de.

> Bu plan'ın yeterli detayda olduğunu ve gerçekten sprint'in tamamlandığını kanıtlamak için kullanıcıya görsel ekran görüntüleri veya sözel onay sunulabilir.

---

## Spec Karşılaştırma (Self-Review Checklist)

| Spec gereksinimi | Karşılayan task |
|------------------|-----------------|
| §3.2 KPI gruplama (AI / Altyapı, 7+2) | Task 3 |
| §3.3 UsageChart 8 seri + sıralama + renkler | Task 4 |
| §3.4 CategoryBreakdown 2 yeni props + categories | Task 5 |
| §3.4 cost-trend-chart "yeni seriler" | **Atlandı (gerekçe yukarıda)** — Task 6 visual verify |
| §3.5 Free tier (TIER_LABELS + TIER_ORDER) | Task 2 |
| §3.6 UsageMonth opsiyonel alanlar | Task 1 |
| §3.6 PlatformModel.tier + AllowedModel.tier `'free'` | Task 1 |
| §6 Doğrulama (tsc + dev server) | Task 6 |
| §9 Step 0: Backend field name doğrulaması | Task 0 |

---

## Risk Notları (Spec §8'den)

- **Backend response field adı tutarsızlığı:** Task 0 ile bloklayıcı doğrulama yapılır.
- **8 seri darası mobile'da sıkışabilir:** Recharts ResponsiveContainer ve legend wrap halleder; gerçek bir sorun çıkarsa Task 4'te `<Legend wrapperStyle={...}>` ile font/padding ayarı yapılabilir.
- **Free tier'da çok model dönerse UI uzun olabilir:** `max-h-[320px]` overflow scroll mevcut.
