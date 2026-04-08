# Phase 2 Temizlik (PR 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CDN desteğini kaldır, documentProcessingConfig'i dokümana hizala, pricingConfig'den CDN alanını temizle.

**Architecture:** Tüm CDN referansları (schema, type, config UI, usage UI, mock data, dashboard) siliniyor. documentProcessingConfig'den textract alanları kaldırılıp supportedSourceKinds ekleniyor.

**Tech Stack:** React, TypeScript, Zod, TanStack Query, MSW, Recharts, shadcn/ui

---

### Task 1: Validasyon şemasından CDN kaldır, docProcessing düzelt

**Files:**
- Modify: `src/lib/validations.ts`

- [ ] **Step 1: cdnConfigSchema'yı kaldır**

`src/lib/validations.ts` — `cdnConfigSchema` tanımını (satır 23-29) ve `configBlockSchemas` içindeki `cdnConfig: cdnConfigSchema` satırını (satır 128) kaldır:

```typescript
// KALDIR — satır 23-29:
export const cdnConfigSchema = z.object({
  enabled: z.boolean().optional(),
  domain: z.string().optional(),
  keyPairId: z.string().optional(),
  privateKey: z.string().optional(),
  ttlSec: optNum,
})

// configBlockSchemas'dan KALDIR:
//   cdnConfig: cdnConfigSchema,
```

- [ ] **Step 2: documentProcessingConfigSchema'yı düzelt**

Aynı dosyada `documentProcessingConfigSchema`'dan `textractEndpoint` ve `syncTextractMaxSizeMb` kaldır:

```typescript
export const documentProcessingConfigSchema = z.object({
  supportedSourceKinds: z.array(z.string()).optional(),
  maxAttempts: optNum,
  workersEnabled: z.boolean().optional(),
})
```

- [ ] **Step 3: Build kontrol**

Run: `npm run build 2>&1 | head -30`
Expected: CDN referansları olan dosyalarda type error'lar (beklenen — sonraki task'larda düzeltilecek)

- [ ] **Step 4: Commit**

```bash
git add src/lib/validations.ts
git commit -m "refactor: remove cdnConfigSchema, fix documentProcessingConfig schema"
```

---

### Task 2: Types'dan CDN kaldır

**Files:**
- Modify: `src/features/companies/types.ts`
- Modify: `src/features/dashboard/hooks/use-platform-summary.ts`

- [ ] **Step 1: UsageMonth'tan cdn kaldır**

`src/features/companies/types.ts` satır 42'yi kaldır:

```typescript
// KALDIR:
//   cdn: { transferBytes: number; costUsd: number }
```

Sonuç:
```typescript
export interface UsageMonth {
  month: string
  ai: { totalTokens: number; turnCount: number; costUsd: number }
  storage: { currentBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
}
```

- [ ] **Step 2: Platform summary hook'tan cdn kaldır**

`src/features/dashboard/hooks/use-platform-summary.ts` satır 10'u kaldır:

```typescript
// UsageMonth interface'den KALDIR:
//   cdn: { transferBytes: number; costUsd: number }
```

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/types.ts src/features/dashboard/hooks/use-platform-summary.ts
git commit -m "refactor: remove cdn from UsageMonth type and platform summary"
```

---

### Task 3: Config UI'dan CDN bloğu kaldır, docProcessing ve pricingConfig düzelt

**Files:**
- Modify: `src/features/companies/components/config-tab.tsx`

- [ ] **Step 1: cdnConfig bloğunu configBlocks'tan kaldır**

`src/features/companies/components/config-tab.tsx` satır 76-87'deki `cdnConfig` bloğunu kaldır:

```typescript
// KALDIR — tüm cdnConfig bloğu:
  {
    key: 'cdnConfig',
    label: 'CDN Config',
    icon: '🌐',
    fields: [
      { key: 'enabled', label: 'CDN Enabled', type: 'boolean', hint: 'CDN dagitimi acik/kapali' },
      { key: 'domain', label: 'Domain', hint: 'CDN domain adresi (or: cdn.firma.com)' },
      { key: 'keyPairId', label: 'Key Pair ID', hint: 'CloudFront key pair ID' },
      { key: 'privateKey', label: 'Private Key', hint: 'CloudFront imzalama icin private key' },
      { key: 'ttlSec', label: 'TTL (sn)', type: 'number', hint: 'CDN cache suresi (saniye)' },
    ],
  },
```

- [ ] **Step 2: pricingConfig'den cdnPerGbTransferUsd kaldır**

Aynı dosyada pricingConfig fields'dan `cdnPerGbTransferUsd` satırını kaldır:

```typescript
// KALDIR:
//   { key: 'cdnPerGbTransferUsd', label: 'CDN ($/GB)', type: 'number', hint: 'CDN transfer birim fiyati. Maliyet = transfer edilen GB x bu fiyat' },
```

- [ ] **Step 3: documentProcessingConfig fields'ı düzelt**

Aynı dosyada documentProcessingConfig fields'ı güncelle — `textractEndpoint` ve `syncTextractMaxSizeMb` kaldır, `supportedSourceKinds` ekle:

```typescript
  {
    key: 'documentProcessingConfig',
    label: 'Document Processing',
    icon: '📄',
    fields: [
      { key: 'supportedSourceKinds', label: 'Desteklenen Kaynaklar', hint: 'Virgülle ayrılmış kaynak türleri (ör: upload, url, s3)' },
      { key: 'maxAttempts', label: 'Max Attempts', type: 'number', hint: 'Basarisiz islem icin maksimum deneme sayisi' },
      { key: 'workersEnabled', label: 'Workers Enabled', type: 'boolean', hint: 'Dokuman isleme worker\'lari aktif/pasif' },
    ],
  },
```

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/components/config-tab.tsx
git commit -m "refactor: remove CDN config block, fix docProcessing and pricing fields"
```

---

### Task 4: Usage tab ve chart'tan CDN kaldır

**Files:**
- Modify: `src/features/companies/components/usage-tab.tsx`
- Modify: `src/features/companies/components/usage-chart.tsx`

- [ ] **Step 1: Usage tab'dan CDN KPI kartını kaldır**

`src/features/companies/components/usage-tab.tsx` — CDN KPI kartını kaldır ve grid'i 3 kolona düşür:

```typescript
      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard label="AI" value={formatCurrency(current.ai.costUsd)} subtitle={`${formatNumber(current.ai.totalTokens)} token`} subtitleColor="text-violet-400" />
        <KpiCard label="Storage" value={formatCurrency(current.storage.costUsd)} subtitle={`${formatBytes(current.storage.currentBytes)} kullanım`} subtitleColor="text-green-400" />
        <KpiCard label="Trigger" value={formatCurrency(current.trigger.costUsd)} subtitle={`${formatNumber(current.trigger.taskCount)} task`} subtitleColor="text-yellow-400" />
      </div>
```

- [ ] **Step 2: Chart'tan CDN bar kaldır**

`src/features/companies/components/usage-chart.tsx` — CDN referanslarını kaldır:

chartData'dan `CDN: d.cdn.costUsd` satırını kaldır:
```typescript
  const chartData = [...data].reverse().map((d) => ({
    month: d.month.slice(5),
    AI: d.ai.costUsd,
    Storage: d.storage.costUsd,
    Trigger: d.trigger.costUsd,
  }))
```

BarChart'tan CDN bar'ı kaldır:
```typescript
// KALDIR:
//   <Bar dataKey="CDN" stackId="a" fill="#3b82f6" />
```

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/components/usage-tab.tsx src/features/companies/components/usage-chart.tsx
git commit -m "refactor: remove CDN from usage tab KPI cards and chart"
```

---

### Task 5: Dashboard'dan CDN kaldır

**Files:**
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`
- Modify: `src/features/dashboard/components/category-breakdown.tsx`
- Modify: `src/features/companies/pages/companies-page.tsx`
- Modify: `src/features/companies/components/company-table.tsx`

- [ ] **Step 1: Dashboard CategoryBreakdown'dan CDN kaldır**

`src/features/dashboard/components/category-breakdown.tsx`:

Interface'den `cdn` prop'unu kaldır:
```typescript
interface CategoryBreakdownProps {
  ai: number
  storage: number
  trigger: number
}
```

Categories array'den CDN satırını kaldır:
```typescript
const categories = [
  { key: 'ai' as const, label: 'AI', color: '#6d28d9' },
  { key: 'storage' as const, label: 'Storage', color: '#22c55e' },
  { key: 'trigger' as const, label: 'Trigger', color: '#f59e0b' },
]
```

Fonksiyon imzasını güncelle:
```typescript
export function CategoryBreakdown({ ai, storage, trigger }: CategoryBreakdownProps) {
  const values = { ai, storage, trigger }
  const max = Math.max(ai, storage, trigger, 0.01)
```

- [ ] **Step 2: Dashboard page'den CDN prop kaldır**

`src/features/dashboard/pages/dashboard-page.tsx` satır 73'ü kaldır:

```typescript
// KALDIR:
//   cdn={current.cdn.costUsd}
```

- [ ] **Step 3: Companies page'den CDN kaldır**

`src/features/companies/pages/companies-page.tsx` satır 27'yi kaldır:

```typescript
// KALDIR:
//   cdnCost: usage?.cdn?.costUsd ?? 0,
```

- [ ] **Step 4: Company table'dan CDN kaldır**

`src/features/companies/components/company-table.tsx` — `CompanyWithUsage` interface'den `cdnCost` kaldır:

```typescript
interface CompanyWithUsage extends Company {
  aiCost?: number
  storageCost?: number
  triggerCost?: number
  totalCost?: number
}
```

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/category-breakdown.tsx src/features/dashboard/pages/dashboard-page.tsx src/features/companies/pages/companies-page.tsx src/features/companies/components/company-table.tsx
git commit -m "refactor: remove CDN from dashboard and company table"
```

---

### Task 6: Settings sayfasından CDN kaldır, docProcessing düzelt

**Files:**
- Modify: `src/features/settings/pages/settings-page.tsx`
- Modify: `src/features/settings/components/settings-nav.tsx`

- [ ] **Step 1: Settings page'den cdnConfig section kaldır**

`src/features/settings/pages/settings-page.tsx` — `sectionMeta`'dan `cdnConfig` bloğunu (satır 79-88) kaldır:

```typescript
// KALDIR — tüm cdnConfig bloğu:
  cdnConfig: {
    title: 'CDN Config',
    description: 'Varsayılan CDN ayarları',
    fields: [
      { key: 'enabled', label: 'CDN Enabled', type: 'boolean', hint: 'CDN dagitimi acik/kapali' },
      { key: 'domain', label: 'Domain', type: 'text', hint: 'CDN domain adresi (or: cdn.platform.com)' },
      { key: 'keyPairId', label: 'Key Pair ID', type: 'text', hint: 'CloudFront key pair ID' },
      { key: 'privateKey', label: 'Private Key', type: 'text', hint: 'CloudFront imzalama icin private key' },
      { key: 'ttlSec', label: 'TTL (seconds)', type: 'number', hint: 'CDN cache suresi (saniye)' },
    ],
  },
```

pricingConfig fields'dan `cdnPerGbTransferUsd` kaldır:
```typescript
// KALDIR:
//   { key: 'cdnPerGbTransferUsd', label: 'CDN per GB Transfer (USD)', type: 'number', hint: '...' },
```

documentProcessingConfig section'ı düzelt:
```typescript
  documentProcessingConfig: {
    title: 'Document Processing',
    description: 'Doküman işleme ayarları',
    fields: [
      { key: 'supportedSourceKinds', label: 'Desteklenen Kaynaklar', type: 'text', hint: 'Virgülle ayrılmış kaynak türleri (ör: upload, url, s3)' },
      { key: 'maxAttempts', label: 'Max Attempts', type: 'number', hint: 'Basarisiz islem icin maksimum deneme sayisi' },
      { key: 'workersEnabled', label: 'Workers Enabled', type: 'boolean', hint: 'Dokuman isleme worker\'lari aktif/pasif' },
    ],
  },
```

- [ ] **Step 2: Settings nav'dan CDN kaldır**

`src/features/settings/components/settings-nav.tsx` — NAV_ITEMS'dan CDN satırını kaldır:

```typescript
// KALDIR:
//   { key: 'cdnConfig', label: 'CDN Config', icon: '🌐' },
```

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/pages/settings-page.tsx src/features/settings/components/settings-nav.tsx
git commit -m "refactor: remove CDN from settings page and nav, fix docProcessing"
```

---

### Task 7: Mock data temizliği

**Files:**
- Modify: `src/mocks/data.ts`
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: Mock data'dan CDN kaldır**

`src/mocks/data.ts`:

1. `generateUsageMonth` fonksiyonundan CDN satırlarını kaldır (satır 19-20, 27):
```typescript
// KALDIR:
//   const cdnBytes = Math.floor((5 + Math.random() * 30) * 1e9 * scale)
//   const cdnCost = +((cdnBytes / 1e9) * 0.085).toFixed(2)
//   cdn: { transferBytes: cdnBytes, costUsd: cdnCost },

// totalCostUsd hesabından cdnCost çıkar:
    totalCostUsd: +(aiCost + storageCost + triggerCost).toFixed(2),
```

2. `getPlatformSummary`'den CDN kaldır (satır 60-62):
```typescript
// KALDIR:
//   cdn: { ... },
```

3. `mockPlatformDefaults`'tan `cdnConfig` bloğunu kaldır (satır 391-397):
```typescript
// KALDIR:
//   cdnConfig: { enabled: true, domain: 'cdn.platform.com', ... },
```

4. `mockPlatformDefaults.pricingConfig`'den `cdnPerGbTransferUsd` kaldır (satır 463):
```typescript
// KALDIR:
//   cdnPerGbTransferUsd: 0.085,
```

5. `mockPlatformDefaults.documentProcessingConfig`'den textract alanları kaldır (satır 455, 458):
```typescript
// KALDIR:
//   textractEndpoint: 'https://textract.eu-central-1.amazonaws.com',
//   syncTextractMaxSizeMb: 5,
```

Sonuç:
```typescript
  documentProcessingConfig: {
    supportedSourceKinds: ['upload', 'url', 's3'],
    maxAttempts: 3,
    workersEnabled: true,
  },
  pricingConfig: {
    s3PerGbMonthUsd: 0.0245,
    triggerPerTaskUsd: 0.0001,
  },
```

- [ ] **Step 2: Build kontrol**

Run: `npm run build 2>&1 | tail -5`
Expected: Build başarılı, sıfır hata

- [ ] **Step 3: Commit**

```bash
git add src/mocks/data.ts src/mocks/handlers.ts
git commit -m "refactor: remove CDN from mock data, fix docProcessing and pricing mocks"
```

---

### Task 8: Final build doğrulama

- [ ] **Step 1: Tam build**

Run: `npm run build`
Expected: Sıfır hata, sıfır uyarı (CDN referansı kalmadı)

- [ ] **Step 2: CDN referansı kalmadığını doğrula**

Run: `grep -r "cdn\|CDN" src/ --include="*.ts" --include="*.tsx" -l`
Expected: Boş çıktı (hiçbir dosyada CDN referansı yok)

- [ ] **Step 3: Dev server test**

Run: `npm run dev` — tarayıcıda açıp doğrula:
- Dashboard: CDN kategorisi yok
- Şirket detay > Kullanım: 3 KPI kartı (AI, Storage, Trigger)
- Şirket detay > Konfigürasyon: CDN accordion yok
- Platform Ayarları: CDN nav item yok, docProcessing düzeltildi
