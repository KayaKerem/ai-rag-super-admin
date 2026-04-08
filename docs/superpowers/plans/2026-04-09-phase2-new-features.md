# Phase 2 Yeni Özellikler (PR 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** aiConfig'e reranking/web search/multiModel alanları ekle, proactiveConfig accordion ekle, usage tab'ı yeni breakdown'larla genişlet, proactive insights tab'ı oluştur.

**Architecture:** Mevcut config form pattern'ını takip ederek yeni alanlar ve accordion ekleniyor. Usage tab yeni maliyet kategorileriyle genişliyor. Proactive insights tamamen yeni tab — hook, types, mock data, MSW handler, UI bileşeni.

**Tech Stack:** React, TypeScript, Zod, TanStack Query, MSW, Recharts, shadcn/ui

**Ön koşul:** PR 1 (temizlik) merge edilmiş olmalı — CDN kaldırılmış, docProcessing düzeltilmiş durumda.

---

### Task 1: Validasyon şemalarını güncelle

**Files:**
- Modify: `src/lib/validations.ts`

- [ ] **Step 1: aiConfigSchema'ya yeni alanlar ekle**

`src/lib/validations.ts` — `aiConfigSchema`'nın sonuna 5 alan ekle:

```typescript
export const aiConfigSchema = z.object({
  model: z.string().optional(),
  compactionModel: z.string().optional(),
  titleModel: z.string().optional(),
  apiKey: z.string().optional(),
  language: z.enum(['tr', 'en']).optional(),
  summaryModel: z.string().optional(),
  requestTimeoutMs: optNum,
  budgetUsd: optNum,
  budgetDowngradeThresholdPct: optNum,
  citationGateMode: z.enum(['off', 'warn', 'block']).optional(),
  hybridRrfK: optNum,
  maxOutputTokensRetryCap: optNum,
  vectorSimilarityThreshold: optNum,
  qualityEvalEnabled: z.boolean().optional(),
  qualityEvalModel: z.string().optional(),
  // Phase 2: Reranking
  rerankApiKey: z.string().optional(),
  rerankModel: z.string().optional(),
  // Phase 2: Web Search
  exaApiKey: z.string().optional(),
  webSearchTier: z.enum(['basic', 'deep', 'deep_reasoning']).optional(),
  // Phase 2: Advanced
  multiModelStepEnabled: z.boolean().optional(),
})
```

- [ ] **Step 2: proactiveConfigSchema ekle**

Aynı dosyada, `pricingConfigSchema`'dan sonra:

```typescript
export const proactiveConfigSchema = z.object({
  enabled: z.boolean().optional(),
  freshnessEnabled: z.boolean().optional(),
  freshnessIntervalHours: optNum,
  gapEnabled: z.boolean().optional(),
  gapMinQueryCount: optNum,
  qualityEnabled: z.boolean().optional(),
  qualitySampleSize: optNum,
  monthlyBudgetUsd: optNum,
  notifyEmail: z.boolean().optional(),
})
```

- [ ] **Step 3: configBlockSchemas'a proactiveConfig ekle**

```typescript
export const configBlockSchemas = {
  aiConfig: aiConfigSchema,
  s3Config: s3ConfigSchema,
  mailConfig: mailConfigSchema,
  embeddingConfig: embeddingConfigSchema,
  langfuseConfig: langfuseConfigSchema,
  triggerConfig: triggerConfigSchema,
  limitsConfig: limitsConfigSchema,
  documentProcessingConfig: documentProcessingConfigSchema,
  crawlerConfig: crawlerConfigSchema,
  pricingConfig: pricingConfigSchema,
  proactiveConfig: proactiveConfigSchema,
} as const
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/validations.ts
git commit -m "feat: add rerank, web search, multiModel to aiConfig schema, add proactiveConfig schema"
```

---

### Task 2: Types güncelle

**Files:**
- Modify: `src/features/companies/types.ts`

- [ ] **Step 1: UsageMonth'a yeni alanlar ekle**

`src/features/companies/types.ts` — `UsageMonth` interface'ini güncelle (PR 1'den sonra cdn zaten yok):

```typescript
export interface UsageMonth {
  month: string
  ai: { totalTokens: number; turnCount: number; costUsd: number }
  rerank: { searchCount: number; documentCount: number; costUsd: number }
  webSearch: { searchCount: number; resultCount: number; costUsd: number }
  proactive: { runCount: number; insightCount: number; costUsd: number }
  cacheHits: { hitCount: number; hitRate: number; estimatedSavingsUsd: number }
  storage: { currentBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
}
```

- [ ] **Step 2: ProactiveInsight type'ları ekle**

Dosyanın sonuna ekle:

```typescript
// ─── Proactive Insights ─────────────────────────────

export type ProactiveAgentType = 'freshness' | 'gap' | 'quality'
export type ProactiveInsightStatus = 'new' | 'acknowledged' | 'resolved' | 'dismissed'
export type ProactiveCategory = 'content_changed' | 'url_unreachable' | 'unanswered_topic' | 'citation_drop' | 'satisfaction_drop'

export interface ProactiveInsight {
  id: string
  agentType: ProactiveAgentType
  category: ProactiveCategory
  status: ProactiveInsightStatus
  title: string
  description: string
  metadata: Record<string, unknown> | null
  actionTaken: string | null
  costUsd: number
  createdAt: string
  updatedAt: string
}

export interface ProactiveInsightSummary {
  new: number
  acknowledged: number
  resolved: number
  dismissed: number
  total: number
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/types.ts
git commit -m "feat: add rerank/webSearch/proactive/cache to UsageMonth, add ProactiveInsight types"
```

---

### Task 3: AI Config accordion'una Reranking, Web Search, Gelişmiş bölümleri ekle

**Files:**
- Modify: `src/features/companies/components/ai-config-accordion.tsx`

- [ ] **Step 1: Yeni bölümleri ekle**

`src/features/companies/components/ai-config-accordion.tsx` — `{/* Allowed Models Section */}` yorumundan ÖNCE, Quality Eval bölümünden sonra ekle:

```tsx
          {/* Reranking Section */}
          <div className="col-span-2">
            <Separator className="my-3" />
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reranking</p>
          </div>

          <div>
            <FieldLabel label="Rerank API Key" hint="Cohere API key. Ayarlanmazsa rerank atlanır" />
            <Input
              {...form.register('rerankApiKey')}
              type="text"
              placeholder={isMasked(currentValues?.rerankApiKey) ? String(currentValues?.rerankApiKey) : ''}
              className={`mt-1 ${isMasked(currentValues?.rerankApiKey) ? 'italic text-muted-foreground' : ''}`}
            />
          </div>

          <div>
            <FieldLabel label="Rerank Model" hint="$0.0025/sorgu. rerank-v3.5 (varsayılan), v4.0-fast, v4.0-pro" />
            <Select
              value={(form.watch('rerankModel') as string) ?? ''}
              onValueChange={(v: string | null) => form.setValue('rerankModel', v ?? '')}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {['rerank-v3.5', 'rerank-v4.0-fast', 'rerank-v4.0-pro'].map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Web Search Section */}
          <div className="col-span-2">
            <Separator className="my-3" />
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Web Search</p>
          </div>

          <div>
            <FieldLabel label="Exa API Key" hint="Exa web search API key. Ayarlanmazsa web_search tool kullanılamaz" />
            <Input
              {...form.register('exaApiKey')}
              type="text"
              placeholder={isMasked(currentValues?.exaApiKey) ? String(currentValues?.exaApiKey) : ''}
              className={`mt-1 ${isMasked(currentValues?.exaApiKey) ? 'italic text-muted-foreground' : ''}`}
            />
          </div>

          <div>
            <FieldLabel label="Web Search Tier" hint="basic: $0.010, deep: $0.015, deep_reasoning: $0.018 /arama" />
            <Select
              value={(form.watch('webSearchTier') as string) ?? ''}
              onValueChange={(v: string | null) => form.setValue('webSearchTier', v ?? '')}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {['basic', 'deep', 'deep_reasoning'].map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Section */}
          <div className="col-span-2">
            <Separator className="my-3" />
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gelişmiş</p>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <FieldLabel label="Multi-Model Step" hint="Tool step'lerinde ucuz model kullan (maliyet optimizasyonu)" />
            <Switch
              checked={(form.watch('multiModelStepEnabled') as boolean) ?? false}
              onCheckedChange={(v: boolean) => form.setValue('multiModelStepEnabled', v)}
            />
          </div>
```

- [ ] **Step 2: Build kontrol**

Run: `npm run build 2>&1 | tail -5`
Expected: Başarılı (Separator ve diğer importlar zaten mevcut)

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/components/ai-config-accordion.tsx
git commit -m "feat: add reranking, web search, and advanced sections to AI config accordion"
```

---

### Task 4: Platform defaults AI config'ine aynı bölümleri ekle

**Files:**
- Modify: `src/features/settings/components/ai-config-section.tsx`

- [ ] **Step 1: Aynı 3 bölümü ekle**

`src/features/settings/components/ai-config-section.tsx` — Quality Eval bölümünden sonra, `{models.length > 0 && (` satırından ÖNCE, Task 3'teki aynı JSX bloğunu ekle (Reranking, Web Search, Gelişmiş).

Kod birebir aynı — fark yok. Task 3'teki `{/* Reranking Section */}` ile başlayan ve `{/* Advanced Section */}` Switch ile biten tüm bloğu buraya da ekle.

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/components/ai-config-section.tsx
git commit -m "feat: add reranking, web search, advanced sections to platform defaults AI config"
```

---

### Task 5: proactiveConfig accordion'u ekle (company + platform defaults)

**Files:**
- Modify: `src/features/companies/components/config-tab.tsx`
- Modify: `src/features/companies/components/config-accordion.tsx`
- Modify: `src/features/settings/pages/settings-page.tsx`
- Modify: `src/features/settings/components/settings-nav.tsx`

- [ ] **Step 1: config-tab.tsx'e proactiveConfig bloğu ekle**

`src/features/companies/components/config-tab.tsx` — `configBlocks` dizisinin başına (embeddingConfig'den önce) ekle:

```typescript
  {
    key: 'proactiveConfig',
    label: 'Proaktif Agentlar',
    icon: '🔮',
    fields: [
      { key: 'enabled', label: 'Aktif', type: 'boolean', hint: 'Master switch. Kapalıyken tüm proaktif agentlar durur' },
      { key: 'freshnessEnabled', label: 'Freshness Agent', type: 'boolean', hint: 'URL değişiklik kontrolü' },
      { key: 'freshnessIntervalHours', label: 'Freshness Aralığı (saat)', type: 'number', hint: 'Kaç saatte bir kontrol (varsayılan: 6)' },
      { key: 'gapEnabled', label: 'Gap Agent', type: 'boolean', hint: 'Bilgi boşluğu analizi' },
      { key: 'gapMinQueryCount', label: 'Gap Min Sorgu', type: 'number', hint: 'Analiz için minimum sorgu sayısı (varsayılan: 10)' },
      { key: 'qualityEnabled', label: 'Quality Agent', type: 'boolean', hint: 'Kalite izleme (citation drop, satisfaction drop)' },
      { key: 'qualitySampleSize', label: 'Quality Örneklem', type: 'number', hint: 'Kalite değerlendirme örneklem boyutu (varsayılan: 20)' },
      { key: 'monthlyBudgetUsd', label: 'Aylık Bütçe ($)', type: 'number', hint: 'Proaktif agent bütçe limiti. Ana AI bütçesinden ayrı (varsayılan: $2.00)' },
      { key: 'notifyEmail', label: 'Email Bildirimi', type: 'boolean', hint: 'Yeni insight üretildiğinde email gönder' },
    ],
  },
```

- [ ] **Step 2: ConfigAccordion'a enabled=false disabled davranışı ekle**

`src/features/companies/components/config-accordion.tsx` — form render kısmında, her field için `enabled` alanı kontrolü ekle.

Fonksiyon başına helper ekle (satır 36 civarı, `function ConfigAccordion` içinde):

```typescript
  const enabledField = fields.find((f) => f.key === 'enabled')
  const isDisabledByEnabled = (fieldKey: string) => {
    if (!enabledField || fieldKey === 'enabled') return false
    const enabledValue = form.watch('enabled') as boolean | undefined
    return enabledValue === false
  }
```

Sonra her field render bloğunda, en dıştaki `<div>` elementine disabled styling ekle. Boolean field'lar için (satır 92 civarı):

```tsx
              <div key={field.key} className={isDisabledByEnabled(field.key) ? 'opacity-50 pointer-events-none' : ''}>
```

Select field'lar için (satır 113 civarı):
```tsx
              <div key={field.key} className={isDisabledByEnabled(field.key) ? 'opacity-50 pointer-events-none' : ''}>
```

Model field'lar için (satır 141 civarı):
```tsx
              <div key={field.key} className={isDisabledByEnabled(field.key) ? 'opacity-50 pointer-events-none' : ''}>
```

Default (text/number) field'lar için (en alttaki return, satır 161 civarı):
```tsx
              <div key={field.key} className={isDisabledByEnabled(field.key) ? 'opacity-50 pointer-events-none' : ''}>
```

- [ ] **Step 3: Settings page'e proactiveConfig section ekle**

`src/features/settings/pages/settings-page.tsx` — `sectionMeta`'ya ekle (crawlerConfig'den sonra):

```typescript
  proactiveConfig: {
    title: 'Proaktif Agentlar',
    description: 'Varsayılan proaktif agent ayarları',
    fields: [
      { key: 'enabled', label: 'Aktif', type: 'boolean', hint: 'Platform genelinde proaktif agentlar varsayılan olarak açık/kapalı' },
      { key: 'freshnessEnabled', label: 'Freshness Agent', type: 'boolean', hint: 'URL değişiklik kontrolü' },
      { key: 'freshnessIntervalHours', label: 'Freshness Aralığı (saat)', type: 'number', hint: 'Kaç saatte bir kontrol (varsayılan: 6)' },
      { key: 'gapEnabled', label: 'Gap Agent', type: 'boolean', hint: 'Bilgi boşluğu analizi' },
      { key: 'gapMinQueryCount', label: 'Gap Min Sorgu', type: 'number', hint: 'Analiz için minimum sorgu sayısı (varsayılan: 10)' },
      { key: 'qualityEnabled', label: 'Quality Agent', type: 'boolean', hint: 'Kalite izleme' },
      { key: 'qualitySampleSize', label: 'Quality Örneklem', type: 'number', hint: 'Örneklem boyutu (varsayılan: 20)' },
      { key: 'monthlyBudgetUsd', label: 'Aylık Bütçe ($)', type: 'number', hint: 'Proaktif agent bütçe limiti (varsayılan: $2.00)' },
      { key: 'notifyEmail', label: 'Email Bildirimi', type: 'boolean', hint: 'Yeni insight bildirimi' },
    ],
  },
```

- [ ] **Step 4: Settings nav'a proactiveConfig ekle**

`src/features/settings/components/settings-nav.tsx` — NAV_ITEMS'a ekle (crawlerConfig'den sonra, documentProcessingConfig'den önce):

```typescript
  { key: 'proactiveConfig', label: 'Proaktif', icon: '🔮' },
```

- [ ] **Step 5: Commit**

```bash
git add src/features/companies/components/config-tab.tsx src/features/companies/components/config-accordion.tsx src/features/settings/pages/settings-page.tsx src/features/settings/components/settings-nav.tsx
git commit -m "feat: add proactiveConfig accordion with enabled/disabled behavior"
```

---

### Task 6: Usage tab'ı genişlet

**Files:**
- Modify: `src/features/companies/components/usage-tab.tsx`
- Modify: `src/features/companies/components/usage-chart.tsx`
- Modify: `src/features/dashboard/hooks/use-platform-summary.ts`
- Modify: `src/features/dashboard/components/category-breakdown.tsx`
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`

- [ ] **Step 1: Usage tab KPI kartlarını genişlet**

`src/features/companies/components/usage-tab.tsx` — KPI grid'ini 2 satır yap:

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

- [ ] **Step 2: Usage chart'a yeni bar'lar ekle**

`src/features/companies/components/usage-chart.tsx`:

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

- [ ] **Step 3: Platform summary hook'a yeni alanlar ekle**

`src/features/dashboard/hooks/use-platform-summary.ts` — UsageMonth interface'ine yeni alanları ekle:

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

- [ ] **Step 4: Dashboard category breakdown'ı güncelle**

`src/features/dashboard/components/category-breakdown.tsx`:

```typescript
interface CategoryBreakdownProps {
  ai: number
  rerank: number
  webSearch: number
  proactive: number
  storage: number
  trigger: number
}

const categories = [
  { key: 'ai' as const, label: 'AI', color: '#6d28d9' },
  { key: 'rerank' as const, label: 'Rerank', color: '#ec4899' },
  { key: 'webSearch' as const, label: 'Web Search', color: '#14b8a6' },
  { key: 'proactive' as const, label: 'Proaktif', color: '#f97316' },
  { key: 'storage' as const, label: 'Storage', color: '#22c55e' },
  { key: 'trigger' as const, label: 'Trigger', color: '#f59e0b' },
]

export function CategoryBreakdown({ ai, rerank, webSearch, proactive, storage, trigger }: CategoryBreakdownProps) {
  const values = { ai, rerank, webSearch, proactive, storage, trigger }
  const max = Math.max(ai, rerank, webSearch, proactive, storage, trigger, 0.01)
```

- [ ] **Step 5: Dashboard page'i güncelle**

`src/features/dashboard/pages/dashboard-page.tsx` — CategoryBreakdown çağrısını güncelle:

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

- [ ] **Step 6: Commit**

```bash
git add src/features/companies/components/usage-tab.tsx src/features/companies/components/usage-chart.tsx src/features/dashboard/hooks/use-platform-summary.ts src/features/dashboard/components/category-breakdown.tsx src/features/dashboard/pages/dashboard-page.tsx
git commit -m "feat: add rerank, web search, proactive, cache metrics to usage tab and dashboard"
```

---

### Task 7: Proactive insights hook ve query keys

**Files:**
- Create: `src/features/companies/hooks/use-proactive-insights.ts`
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: Query keys ekle**

`src/lib/query-keys.ts` — `companies` bloğuna ekle:

```typescript
    proactiveInsights: (id: string, agentType?: string, status?: string) =>
      ['companies', id, 'proactive-insights', agentType ?? '', status ?? ''] as const,
    proactiveInsightSummary: (id: string) =>
      ['companies', id, 'proactive-insights', 'summary'] as const,
```

- [ ] **Step 2: Hook oluştur**

```typescript
// src/features/companies/hooks/use-proactive-insights.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { ProactiveInsight, ProactiveInsightSummary, ProactiveInsightStatus } from '../types'

interface InsightFilters {
  agentType?: string
  status?: string
  limit?: number
  offset?: number
}

export function useProactiveInsights(companyId: string, filters: InsightFilters = {}) {
  const { agentType, status, limit = 20, offset = 0 } = filters
  return useQuery({
    queryKey: queryKeys.companies.proactiveInsights(companyId, agentType, status),
    queryFn: async (): Promise<{ items: ProactiveInsight[]; total: number }> => {
      const params = new URLSearchParams()
      if (agentType) params.set('agentType', agentType)
      if (status) params.set('status', status)
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      const { data } = await apiClient.get(`/platform/companies/${companyId}/insights?${params}`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useProactiveInsightSummary(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.proactiveInsightSummary(companyId),
    queryFn: async (): Promise<ProactiveInsightSummary> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/insights/summary`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useUpdateInsightStatus(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ insightId, status, actionTaken }: { insightId: string; status: Exclude<ProactiveInsightStatus, 'new'>; actionTaken?: string }) => {
      const { data } = await apiClient.patch(`/platform/companies/${companyId}/insights/${insightId}`, { status, actionTaken })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies', companyId, 'proactive-insights'] })
    },
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/query-keys.ts src/features/companies/hooks/use-proactive-insights.ts
git commit -m "feat: add proactive insights hooks and query keys"
```

---

### Task 8: Proactive Insights Tab bileşeni

**Files:**
- Create: `src/features/companies/components/proactive-insights-tab.tsx`

- [ ] **Step 1: Tab bileşenini oluştur**

```typescript
// src/features/companies/components/proactive-insights-tab.tsx
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { useProactiveInsights, useProactiveInsightSummary, useUpdateInsightStatus } from '../hooks/use-proactive-insights'
import { formatDate } from '@/lib/utils'
import type { ProactiveInsight } from '../types'

interface ProactiveInsightsTabProps {
  companyId: string
}

const agentIcons: Record<string, string> = {
  freshness: '🔄',
  gap: '🕳️',
  quality: '📊',
}

const statusColors: Record<string, string> = {
  new: 'destructive',
  acknowledged: 'default',
  resolved: 'secondary',
  dismissed: 'outline',
}

const categoryLabels: Record<string, string> = {
  content_changed: 'İçerik Değişti',
  url_unreachable: 'URL Erişilemez',
  unanswered_topic: 'Cevaplanmamış Konu',
  citation_drop: 'Kaynak Düşüşü',
  satisfaction_drop: 'Memnuniyet Düşüşü',
}

export function ProactiveInsightsTab({ companyId }: ProactiveInsightsTabProps) {
  const [agentType, setAgentType] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  const { data: summary } = useProactiveInsightSummary(companyId)
  const { data, isLoading } = useProactiveInsights(companyId, {
    agentType: agentType || undefined,
    status: status || undefined,
  })
  const updateStatus = useUpdateInsightStatus(companyId)

  function handleAction(insight: ProactiveInsight, newStatus: 'acknowledged' | 'resolved' | 'dismissed') {
    updateStatus.mutate({ insightId: insight.id, status: newStatus })
  }

  return (
    <div>
      {/* Summary KPIs */}
      {summary && (
        <div className="mb-4 grid grid-cols-4 gap-3">
          <KpiCard label="Yeni" value={String(summary.new)} subtitleColor="text-red-400" />
          <KpiCard label="İncelendi" value={String(summary.acknowledged)} />
          <KpiCard label="Çözüldü" value={String(summary.resolved)} />
          <KpiCard label="Reddedildi" value={String(summary.dismissed)} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <Select value={agentType} onValueChange={setAgentType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tüm Agentlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            <SelectItem value="freshness">Freshness</SelectItem>
            <SelectItem value="gap">Gap</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tüm Durumlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            <SelectItem value="new">Yeni</SelectItem>
            <SelectItem value="acknowledged">İncelendi</SelectItem>
            <SelectItem value="resolved">Çözüldü</SelectItem>
            <SelectItem value="dismissed">Reddedildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Insight Cards */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : !data?.items?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Proaktif agentlar kapalı veya henüz insight üretilmedi.
            <br />
            <span className="text-xs">Konfigürasyon tab'ından proaktif agentları etkinleştirin.</span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.items.map((insight) => (
            <Card key={insight.id}>
              <CardContent className="flex items-start gap-3 py-3">
                <span className="mt-0.5 text-lg">{agentIcons[insight.agentType] ?? '🔮'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{insight.title}</span>
                    <Badge variant={statusColors[insight.status] as any} className="text-[10px]">
                      {insight.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {categoryLabels[insight.category] ?? insight.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(insight.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {insight.status === 'new' && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleAction(insight, 'acknowledged')}>
                        İncele
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleAction(insight, 'dismissed')}>
                        Reddet
                      </Button>
                    </>
                  )}
                  {insight.status === 'acknowledged' && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleAction(insight, 'resolved')}>
                        Çözüldü
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleAction(insight, 'dismissed')}>
                        Reddet
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-muted-foreground text-center pt-2">
            {data.total} insight toplam
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/companies/components/proactive-insights-tab.tsx
git commit -m "feat: add ProactiveInsightsTab component"
```

---

### Task 9: Company detail page'e tab ekle

**Files:**
- Modify: `src/features/companies/pages/company-detail-page.tsx`

- [ ] **Step 1: Import ve tab ekle**

Import ekle:
```typescript
import { ProactiveInsightsTab } from '../components/proactive-insights-tab'
```

TabsList'e yeni trigger ekle (search-analytics'ten sonra):
```tsx
          <TabsTrigger value="proactive">Proaktif</TabsTrigger>
```

TabsContent ekle (search-analytics TabsContent'ten sonra):
```tsx
        <TabsContent value="proactive" className="mt-4">
          <ProactiveInsightsTab companyId={id!} />
        </TabsContent>
```

- [ ] **Step 2: Commit**

```bash
git add src/features/companies/pages/company-detail-page.tsx
git commit -m "feat: add Proaktif tab to company detail page"
```

---

### Task 10: Mock data ve MSW handlers

**Files:**
- Modify: `src/mocks/data.ts`
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: Usage mock data'ya yeni alanlar ekle**

`src/mocks/data.ts` — `generateUsageMonth` fonksiyonunu güncelle. Yeni alanlar ekle:

```typescript
function generateUsageMonth(month: string, scale: number) {
  const aiTokens = Math.floor((800000 + Math.random() * 600000) * scale)
  const aiCost = +(aiTokens * 0.00001).toFixed(2)
  const storageBytes = Math.floor((2 + Math.random() * 8) * 1e9 * scale)
  const storageCost = +((storageBytes / 1e9) * 0.0245).toFixed(2)
  const taskCount = Math.floor((100 + Math.random() * 400) * scale)
  const triggerCost = +(taskCount * 0.0001).toFixed(4)
  const rerankCount = Math.floor((50 + Math.random() * 300) * scale)
  const rerankCost = +(rerankCount * 0.0025).toFixed(2)
  const webSearchCount = Math.floor((10 + Math.random() * 50) * scale)
  const webSearchCost = +(webSearchCount * 0.010).toFixed(2)
  const proactiveRuns = Math.floor((30 + Math.random() * 150) * scale)
  const proactiveInsights = Math.floor(proactiveRuns * 0.07)
  const proactiveCost = +(proactiveRuns * 0.004).toFixed(2)
  const cacheHitCount = Math.floor((20 + Math.random() * 300) * scale)
  const totalTurns = Math.floor(aiTokens / 15000)
  const cacheHitRate = totalTurns > 0 ? +(cacheHitCount / (totalTurns + cacheHitCount)).toFixed(2) : 0
  const cacheSavings = +(cacheHitCount * 0.01).toFixed(2)
  return {
    month,
    ai: { totalTokens: aiTokens, turnCount: totalTurns, costUsd: aiCost },
    rerank: { searchCount: rerankCount, documentCount: rerankCount * 5, costUsd: rerankCost },
    webSearch: { searchCount: webSearchCount, resultCount: webSearchCount * 3, costUsd: webSearchCost },
    proactive: { runCount: proactiveRuns, insightCount: proactiveInsights, costUsd: proactiveCost },
    cacheHits: { hitCount: cacheHitCount, hitRate: cacheHitRate, estimatedSavingsUsd: cacheSavings },
    storage: { currentBytes: storageBytes, costUsd: storageCost },
    trigger: { taskCount, costUsd: triggerCost },
    totalCostUsd: +(aiCost + storageCost + triggerCost + rerankCost + webSearchCost + proactiveCost).toFixed(2),
  }
}
```

- [ ] **Step 2: getPlatformSummary'ye yeni alanlar ekle**

`src/mocks/data.ts` — `getPlatformSummary` fonksiyonunu güncelle:

```typescript
export function getPlatformSummary(numMonths: number) {
  const result = months.slice(0, numMonths).map((m) => {
    const allCompanyMonths = mockCompanies.map((c) => {
      const usage = mockCompanyUsage[c.id]
      return usage.find((u) => u.month === m)!
    })
    return {
      month: m,
      companyCount: mockCompanies.length,
      ai: {
        totalTokens: allCompanyMonths.reduce((s, u) => s + u.ai.totalTokens, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.ai.costUsd, 0).toFixed(2),
      },
      rerank: {
        searchCount: allCompanyMonths.reduce((s, u) => s + u.rerank.searchCount, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.rerank.costUsd, 0).toFixed(2),
      },
      webSearch: {
        searchCount: allCompanyMonths.reduce((s, u) => s + u.webSearch.searchCount, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.webSearch.costUsd, 0).toFixed(2),
      },
      proactive: {
        runCount: allCompanyMonths.reduce((s, u) => s + u.proactive.runCount, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.proactive.costUsd, 0).toFixed(2),
      },
      storage: {
        totalBytes: allCompanyMonths.reduce((s, u) => s + u.storage.currentBytes, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.storage.costUsd, 0).toFixed(2),
      },
      trigger: {
        taskCount: allCompanyMonths.reduce((s, u) => s + u.trigger.taskCount, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.trigger.costUsd, 0).toFixed(4),
      },
      totalCostUsd: +allCompanyMonths.reduce((s, u) => s + u.totalCostUsd, 0).toFixed(2),
      satisfactionRate: +(0.78 + Math.random() * 0.12).toFixed(2),
      totalActiveUsers: 52,
    }
  })
  return { months: result }
}
```

- [ ] **Step 3: Platform defaults mock'a yeni config alanları ekle**

`src/mocks/data.ts` — `mockPlatformDefaults.aiConfig`'e ekle:

```typescript
    rerankApiKey: 'cohe****abcd',
    rerankModel: 'rerank-v3.5',
    exaApiKey: 'exa-a****wxyz',
    webSearchTier: 'basic',
    multiModelStepEnabled: true,
```

`mockPlatformDefaults`'a yeni blok ekle:

```typescript
  proactiveConfig: {
    enabled: false,
    freshnessEnabled: true,
    freshnessIntervalHours: 6,
    gapEnabled: true,
    gapMinQueryCount: 10,
    qualityEnabled: true,
    qualitySampleSize: 20,
    monthlyBudgetUsd: 2.00,
    notifyEmail: false,
  },
```

- [ ] **Step 4: Proactive insights mock data ekle**

`src/mocks/data.ts` sonuna ekle:

```typescript
// Proactive Insights mock
export const mockProactiveInsights: Record<string, any[]> = {
  [mockCompanies[0].id]: [
    { id: 'pi-1', agentType: 'freshness', category: 'content_changed', status: 'new', title: 'blog.firma.com/api-docs içeriği değişti', description: 'Son taramadan bu yana sayfa içeriğinde önemli değişiklikler tespit edildi. Bilgi tabanındaki ilgili dokümanlar güncelliğini kaybetmiş olabilir.', metadata: { url: 'https://blog.firma.com/api-docs', changePercent: 35 }, actionTaken: null, costUsd: 0.003, createdAt: '2026-04-08T10:30:00Z', updatedAt: '2026-04-08T10:30:00Z' },
    { id: 'pi-2', agentType: 'freshness', category: 'url_unreachable', status: 'new', title: 'docs.firma.com/v1 erişilemez (404)', description: 'URL HTTP 404 döndürüyor. Bu kaynağa referans veren dokümanlar kontrol edilmeli.', metadata: { url: 'https://docs.firma.com/v1', httpStatus: 404 }, actionTaken: null, costUsd: 0.002, createdAt: '2026-04-08T06:00:00Z', updatedAt: '2026-04-08T06:00:00Z' },
    { id: 'pi-3', agentType: 'gap', category: 'unanswered_topic', status: 'acknowledged', title: '"fatura iptali" konusunda bilgi eksikliği', description: '15 kullanıcı sorgusu bu konuda düşük kaliteli veya boş sonuç aldı. Bilgi tabanına bu konuda içerik eklenmesi önerilir.', metadata: { queryCluster: ['fatura iptal', 'fatura iade', 'iptal süreci'], queryCount: 15 }, actionTaken: null, costUsd: 0.004, createdAt: '2026-04-07T14:00:00Z', updatedAt: '2026-04-07T16:00:00Z' },
    { id: 'pi-4', agentType: 'quality', category: 'citation_drop', status: 'resolved', title: 'Kaynak gösterim oranı %65\'e düştü', description: 'Son 7 günde citation rate %82\'den %65\'e geriledi. Olası neden: yeni eklenen dokümanlar henüz indekslenmemiş.', metadata: { previousRate: 0.82, currentRate: 0.65, windowDays: 7 }, actionTaken: 'Bekleyen dokümanlar yeniden indekslendi', costUsd: 0.005, createdAt: '2026-04-06T09:00:00Z', updatedAt: '2026-04-06T15:00:00Z' },
    { id: 'pi-5', agentType: 'quality', category: 'satisfaction_drop', status: 'dismissed', title: 'Memnuniyet oranı %22 düştü', description: 'Son 7 günde kullanıcı memnuniyeti %85\'ten %63\'e geriledi.', metadata: { previousRate: 0.85, currentRate: 0.63, windowDays: 7 }, actionTaken: null, costUsd: 0.003, createdAt: '2026-04-05T11:00:00Z', updatedAt: '2026-04-05T12:00:00Z' },
    { id: 'pi-6', agentType: 'gap', category: 'unanswered_topic', status: 'new', title: '"entegrasyon API" hakkında sık sorulan sorular', description: '22 sorgu bu konuda yetersiz sonuç aldı. API entegrasyon dokümanı eksik olabilir.', metadata: { queryCluster: ['API entegrasyon', 'webhook', 'API key nasıl'], queryCount: 22 }, actionTaken: null, costUsd: 0.004, createdAt: '2026-04-04T08:00:00Z', updatedAt: '2026-04-04T08:00:00Z' },
  ],
  [mockCompanies[1].id]: [
    { id: 'pi-7', agentType: 'freshness', category: 'content_changed', status: 'new', title: 'help.techbeta.com güncellenmiş', description: 'Yardım sayfası içeriği değişti.', metadata: { url: 'https://help.techbeta.com', changePercent: 20 }, actionTaken: null, costUsd: 0.003, createdAt: '2026-04-08T08:00:00Z', updatedAt: '2026-04-08T08:00:00Z' },
  ],
}

export function getProactiveInsightSummary(companyId: string) {
  const items = mockProactiveInsights[companyId] ?? []
  return {
    new: items.filter((i) => i.status === 'new').length,
    acknowledged: items.filter((i) => i.status === 'acknowledged').length,
    resolved: items.filter((i) => i.status === 'resolved').length,
    dismissed: items.filter((i) => i.status === 'dismissed').length,
    total: items.length,
  }
}
```

- [ ] **Step 5: MSW handlers ekle**

`src/mocks/handlers.ts` — import'a ekle:

```typescript
import { mockProactiveInsights, getProactiveInsightSummary } from './data'
```

Handlers dizisine ekle (search-analytics handler'dan sonra):

```typescript
  // ─── Proactive Insights ────────────────────────────
  http.get(`${BASE}/platform/companies/:id/insights/summary`, async ({ params }) => {
    await delay(100)
    const id = params.id as string
    return HttpResponse.json(getProactiveInsightSummary(id))
  }),

  http.get(`${BASE}/platform/companies/:id/insights`, async ({ params, request }) => {
    await delay(200)
    const id = params.id as string
    const url = new URL(request.url)
    const agentType = url.searchParams.get('agentType')
    const status = url.searchParams.get('status')
    let items = mockProactiveInsights[id] ?? []
    if (agentType) items = items.filter((i: any) => i.agentType === agentType)
    if (status) items = items.filter((i: any) => i.status === status)
    return HttpResponse.json({ items, total: items.length })
  }),

  http.patch(`${BASE}/platform/companies/:id/insights/:insightId`, async ({ params, request }) => {
    await delay(200)
    const companyId = params.id as string
    const insightId = params.insightId as string
    const body = (await request.json()) as any
    const items = mockProactiveInsights[companyId] ?? []
    const insight = items.find((i: any) => i.id === insightId)
    if (insight) {
      insight.status = body.status
      if (body.actionTaken) insight.actionTaken = body.actionTaken
      insight.updatedAt = new Date().toISOString()
    }
    return HttpResponse.json(insight ?? {})
  }),
```

- [ ] **Step 6: Commit**

```bash
git add src/mocks/data.ts src/mocks/handlers.ts
git commit -m "feat: add usage new fields, proactive insights mock data and MSW handlers"
```

---

### Task 11: Final build doğrulama

- [ ] **Step 1: Tam build**

Run: `npm run build`
Expected: Sıfır hata

- [ ] **Step 2: Dev server test**

Run: `npm run dev` — tarayıcıda doğrula:

1. **Dashboard:** Kategori dağılımında AI, Rerank, Web Search, Proaktif, Storage, Trigger
2. **Şirket > Kullanım:** 7 KPI kartı (2 satır: 4+3), chart'ta 6 bar kategorisi
3. **Şirket > Konfigürasyon:**
   - AI Config accordion: Reranking, Web Search, Gelişmiş bölümleri
   - Proaktif Agentlar accordion: enabled=false iken diğer alanlar disabled
4. **Şirket > Proaktif tab:** Summary kartları, filtreler, insight kartları, aksiyon butonları
5. **Platform Ayarları:** AI Config'te yeni bölümler, Proaktif nav item ve section
