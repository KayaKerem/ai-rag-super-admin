# Phase 2 Doküman Hizalama — Tasarım Dokümanı

Tarih: 2026-04-09
Kaynak: `ai-rag-template/docs/frontend-admin/02-company-config.md`, `05-analytics.md`, `14-proactive-insights.md`

---

## Kapsam

Backend dokümanları Phase 2 özellikleriyle güncellendi. Frontend'de eksik olan alanlar ve yeni özellikler ekleniyor. Company memories (13) kapsam dışı — backend hazır değil.

**2 PR halinde:**
- PR 1: Temizlik (CDN kaldırma, docProcessing düzeltme)
- PR 2: Yeni özellikler (aiConfig alanları, proactiveConfig, usage genişletme, proactive insights tab)

---

## PR 1 — Temizlik

### 1.1 CDN Kaldırma

Backend CDN desteğini kaldırdı. `cdn.transferBytes` ve `cdn.costUsd` her zaman sıfır dönüyor.

**Kaldırılacak:**
- `config-tab.tsx`: `cdnConfig` bloğu `configBlocks` dizisinden çıkar
- `validations.ts`: `cdnConfigSchema` kaldır, `configBlockSchemas`'dan çıkar
- `types.ts`: `UsageMonth.cdn` alanı kaldır
- `usage-tab.tsx`: CDN KPI kartı kaldır (4 kart → 3 kart, grid-cols-4 → grid-cols-3)
- `usage-chart.tsx`: CDN bar'ı kaldır
- `pricingConfig` fields: `cdnPerGbTransferUsd` kaldır
- Mock data (`data.ts`): CDN referansları kaldır
- Settings sayfası (`settings-page.tsx`): CDN config bölümü varsa kaldır
- MSW handlers: CDN ile ilgili mock response'lardan `cdn` alanlarını kaldır

### 1.2 documentProcessingConfig Düzeltme

Doküman: `supportedSourceKinds`, `maxAttempts`, `workersEnabled`.
Frontend'de fazladan `textractEndpoint` ve `syncTextractMaxSizeMb` var.

**Değişiklikler:**
- `config-tab.tsx` documentProcessingConfig fields:
  - Kaldır: `textractEndpoint`, `syncTextractMaxSizeMb`
  - Ekle: `supportedSourceKinds` (hint: "Virgülle ayrılmış kaynak türleri")
- `validations.ts` `documentProcessingConfigSchema`:
  - Kaldır: `textractEndpoint: z.string().optional()`, `syncTextractMaxSizeMb: optNum`
  - `supportedSourceKinds` zaten var, kalır

### 1.3 pricingConfig Düzeltme

- `config-tab.tsx`: `cdnPerGbTransferUsd` alanını fields'dan kaldır
- `pricingConfigSchema`: zaten sadece `s3PerGbMonthUsd` ve `triggerPerTaskUsd` var, doğru

---

## PR 2 — Yeni Özellikler

### 2.1 aiConfig Yeni Alanlar

Mevcut AI Config accordion'u (`ai-config-accordion.tsx` ve `ai-config-section.tsx`) içine Separator ile 3 alt bölüm eklenir. Aynı form, tek kaydet butonu.

#### Validasyon (validations.ts)

`aiConfigSchema`'ya eklenir:
```typescript
rerankApiKey: z.string().optional(),
rerankModel: z.string().optional(),
exaApiKey: z.string().optional(),
webSearchTier: z.enum(['basic', 'deep', 'deep_reasoning']).optional(),
multiModelStepEnabled: z.boolean().optional(),
```

#### UI — Reranking Bölümü

Quality Eval bölümünden sonra, Separator ile ayrılmış:

```
── Reranking ──────────────────────────
[rerankApiKey]     masked text input, placeholder: mevcut maskeli değer
[rerankModel]      Select: rerank-v3.5 | rerank-v4.0-fast | rerank-v4.0-pro
                   hint: "$0.0025/sorgu. Ayarlanmazsa rerank atlanır"
```

#### UI — Web Search Bölümü

```
── Web Search ─────────────────────────
[exaApiKey]        masked text input, placeholder: mevcut maskeli değer
[webSearchTier]    Select: basic | deep | deep_reasoning
                   hint: "basic: $0.010, deep: $0.015, deep_reasoning: $0.018 /arama"
```

#### UI — Gelişmiş Bölümü

```
── Gelişmiş ───────────────────────────
[multiModelStepEnabled]  Switch toggle
                         hint: "Tool step'lerinde ucuz model kullan"
```

#### Platform Defaults

`ai-config-section.tsx`'e aynı 3 bölüm eklenir — birebir aynı yapı.

### 2.2 proactiveConfig — Yeni Config Accordion

#### Validasyon (validations.ts)

Yeni schema:
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

`configBlockSchemas`'a `proactiveConfig: proactiveConfigSchema` eklenir.

#### UI (config-tab.tsx)

`configBlocks` dizisine yeni blok:
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
}
```

`enabled: false` iken diğer alanlar disabled olarak render edilecek. Bu davranış `ConfigAccordion` bileşenine genel özellik olarak eklenir — eğer blokta `enabled` adlı boolean alan varsa ve değeri `false` ise diğer alanlar `disabled` + `opacity-50` olur. Bu, `langfuseConfig` gibi `enabled` alanı olan diğer blokları da kapsar.

#### Platform Defaults

Settings sayfasına aynı accordion eklenir.

### 2.3 Usage Tab Genişletme

#### Type Güncellemesi (types.ts)

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

#### KPI Kartları (usage-tab.tsx)

2 satır grid layout:

Satır 1 (`grid-cols-4`):
- **AI** — `$12.50`, subtitle: `1,250,000 token`, renk: violet
- **Rerank** — `$0.80`, subtitle: `320 sorgu`, renk: pink
- **Web Search** — `$0.45`, subtitle: `45 arama`, renk: teal
- **Storage** — `$0.12`, subtitle: `5.00 GB`, renk: green

Satır 2 (`grid-cols-3`):
- **Proaktif** — `$0.80`, subtitle: `12 insight`, renk: orange
- **Cache Tasarruf** — `$3.20`, subtitle: `%28 hit rate`, renk: emerald
- **Trigger** — `$0.03`, subtitle: `320 task`, renk: amber

#### Chart Güncellemesi (usage-chart.tsx)

Stacked bar'a yeni seriler:
- AI: `#6d28d9` (violet, mevcut)
- Rerank: `#ec4899` (pink)
- Web Search: `#14b8a6` (teal)
- Proactive: `#f97316` (orange)
- Storage: `#22c55e` (green, mevcut)
- Trigger: `#f59e0b` (amber, mevcut)

Cache tasarruf chart'ta gösterilmez (maliyet değil tasarruf).

#### Mock Data

`mockCompanyUsage` ve `getPlatformSummary`'ye yeni alanlar eklenir.

### 2.4 Proactive Insights Tab

#### Endpoint Pattern

User-facing: `GET /companies/me/insights`
Superadmin: `GET /platform/companies/:id/insights` (aynı response, company scoping)

#### Types (types.ts)

```typescript
export interface ProactiveInsight {
  id: string
  agentType: 'freshness' | 'gap' | 'quality'
  category: 'content_changed' | 'url_unreachable' | 'unanswered_topic' | 'citation_drop' | 'satisfaction_drop'
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed'
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

#### Hooks

```typescript
// use-proactive-insights.ts
useProactiveInsights(companyId, { agentType?, status?, limit?, offset? })
// GET /platform/companies/:id/insights?agentType=...&status=...&limit=20&offset=0

useProactiveInsightSummary(companyId)
// GET /platform/companies/:id/insights/summary

useUpdateInsightStatus(companyId)
// PATCH /platform/companies/:id/insights/:insightId
// body: { status: 'acknowledged' | 'resolved' | 'dismissed', actionTaken?: string }
```

#### UI — ProactiveInsightsTab

`company-detail-page.tsx`'e 10. tab olarak eklenir: "Proaktif"

**Layout:**
1. Üstte summary kartları — 4 KPI: New (badge kırmızı), Acknowledged, Resolved, Dismissed
2. Filtre satırı — agentType Select (Tümü / Freshness / Gap / Quality) + status Select (Tümü / New / Acknowledged / Resolved / Dismissed)
3. Insight kartları listesi:
   - Sol: agent icon (freshness: 🔄, gap: 🕳️, quality: 📊)
   - Orta: title, description (truncated), tarih
   - Sağ: severity badge (category'ye göre renk), status badge, action butonları
4. Pagination (limit/offset)
5. Boş state: "Proaktif agentlar kapalı veya henüz insight üretilmedi" + Konfigürasyon tab'ına link

**Action Butonları:**
- `new` → Acknowledge / Dismiss
- `acknowledged` → Resolve / Dismiss
- `resolved` / `dismissed` → aksiyon yok (sadece görüntüleme)

#### Mock Data + MSW Handler

- 10-15 örnek insight (karışık agent/category/status)
- Summary endpoint mock
- PATCH handler (status güncelleme)

---

## Etkilenen Dosyalar Özeti

### PR 1
| Dosya | Değişiklik |
|-------|-----------|
| `src/lib/validations.ts` | cdnConfigSchema kaldır, docProcessing düzelt |
| `src/features/companies/types.ts` | UsageMonth.cdn kaldır |
| `src/features/companies/components/config-tab.tsx` | cdnConfig bloğu kaldır, docProcessing fields düzelt, pricingConfig cdnPerGbTransferUsd kaldır |
| `src/features/companies/components/usage-tab.tsx` | CDN KPI kartı kaldır, grid-cols-3 |
| `src/features/companies/components/usage-chart.tsx` | CDN bar kaldır |
| `src/mocks/data.ts` | CDN mock referansları kaldır |
| `src/mocks/handlers.ts` | CDN alanları kaldır |
| `src/features/settings/` | CDN config bölümü varsa kaldır |

### PR 2
| Dosya | Değişiklik |
|-------|-----------|
| `src/lib/validations.ts` | aiConfig 5 alan ekle, proactiveConfigSchema ekle |
| `src/features/companies/types.ts` | UsageMonth genişlet, ProactiveInsight + Summary type ekle |
| `src/features/companies/components/ai-config-accordion.tsx` | Reranking, Web Search, Gelişmiş bölümleri |
| `src/features/settings/components/ai-config-section.tsx` | Aynı bölümler (platform defaults) |
| `src/features/companies/components/config-tab.tsx` | proactiveConfig bloğu ekle |
| `src/features/companies/components/config-accordion.tsx` | enabled=false → diğer alanlar disabled |
| `src/features/companies/components/usage-tab.tsx` | 7 KPI kartı, 2 satır grid |
| `src/features/companies/components/usage-chart.tsx` | 3 yeni bar serisi |
| `src/features/companies/hooks/use-proactive-insights.ts` | Yeni: 3 hook |
| `src/features/companies/components/proactive-insights-tab.tsx` | Yeni: tam tab bileşeni |
| `src/features/companies/pages/company-detail-page.tsx` | 10. tab ekle |
| `src/lib/query-keys.ts` | proactiveInsights key'leri ekle |
| `src/mocks/data.ts` | Usage yeni alanlar, proactive insights mock |
| `src/mocks/handlers.ts` | 3 yeni MSW handler |
| `src/features/settings/components/settings-page.tsx` | proactiveConfig accordion (platform defaults) |
