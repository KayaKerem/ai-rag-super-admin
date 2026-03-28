# Super Admin Doc Alignment Spec

Guncel dokumanlara (`docs/frontend-admin/` 8 dosya) gore super admin frontend'inin hizalanmasi.

3 ana degisiklik alani: tip/sema duzeltmeleri, agent metrikleri, data sources UI.

---

## 1. Tip/Sema Duzeltmeleri (Quick Fixes)

### 1a. DataSourceType — Fazla alanlari kaldir

**Dosya:** `src/features/companies/types.ts`

Mevcut:
```typescript
interface DataSourceType {
  type: string
  label: string
  description: string
  enabled: boolean      // KALDIR
  addedCount: number    // KALDIR
  maxSources: number    // KALDIR
}
```

Sonra:
```typescript
interface DataSourceType {
  type: string
  label: string
  description: string
}
```

### 1b. limitsConfigSchema — Crawl alanlarini kaldir

**Dosya:** `src/lib/validations.ts`

Kaldirilacak 4 alan:
- `crawlMaxPages`
- `crawlMaxSources`
- `crawlMinIntervalHours`
- `crawlConcurrency`

Bu alanlar artik dokumandaki `limitsConfig` blogunun parcasi degil. Crawler ayarlari sadece `crawlerConfig` blogu uzerinden yonetiliyor.

Ilgili UI'daki form alanlari da kaldirilacak:
- `src/features/companies/components/config-tab.tsx` (veya config-accordion) icindeki limits fields
- `src/features/settings/components/config-section.tsx` icindeki limits fields

### 1c. Feedback reason labels — Eksikleri ekle

**Dosya:** `src/features/companies/components/analytics-tab.tsx`

Mevcut `reasonLabels` map'ine 2 ekleme:
```typescript
const reasonLabels: Record<string, string> = {
  incomplete: 'Eksik Cevap',
  hallucination: 'Halusinasyon',
  wrong_source: 'Yanlis Kaynak',
  wrong_template: 'Yanlis Sablon',   // YENi
  irrelevant: 'Alakasiz',
  other: 'Diger',                     // YENi
}
```

---

## 2. Agent Metrikleri (Yeni Ozellik)

Endpoint: `GET /platform/companies/:id/agent-metrics?windowDays=30`
Guard: `JwtAuthGuard` + `PlatformAdminGuard`
Konum: Analytics tab icine yeni section

### 2a. Yeni tipler

**Dosya:** `src/features/companies/types.ts`

```typescript
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

### 2b. Yeni hook

**Dosya:** `src/features/companies/hooks/use-agent-metrics.ts`

```typescript
useAgentMetrics(companyId: string, windowDays: number)
```

- Endpoint: `GET /platform/companies/${companyId}/agent-metrics?windowDays=${windowDays}`
- Query key: `queryKeys.companies.agentMetrics(id, windowDays)`

### 2c. Query key ekleme

**Dosya:** `src/lib/query-keys.ts`

```typescript
companies: {
  // ... mevcut keyler
  agentMetrics: (id: string, windowDays: number) =>
    ['companies', id, 'agent-metrics', windowDays] as const,
}
```

### 2d. Analytics Tab UI — Agent Performansi section

**Dosya:** `src/features/companies/components/analytics-tab.tsx`

Mevcut icerigin altina "Agent Performansi" section'i eklenir.

**windowDays secimi:** Analytics tab'in mevcut period selector'u aylik calisir (months). Agent metrics ise gun bazli (windowDays). Ayri bir selector gerek:
- Default: 30 gun
- Secenekler: 7 / 30 / 90 / 365 gun

**Siralama (yukaridan asagiya):**

1. **Alert Banner'lari** (sadece alert varsa gosterilir)
   - `severity: 'critical'` -> kirmizi banner (bg-red-500/10, text-red-400)
   - `severity: 'warning'` -> sari banner (bg-yellow-500/10, text-yellow-400)
   - Her alert: ikon + `message` + `value`

2. **KPI Kartlari** (4 adet, grid-cols-4)
   | Kart | Deger | Subtitle |
   |------|-------|----------|
   | Citation Coverage | `%{Math.round(rate*100)}` | `{outputsAnalyzed} cikti analiz edildi` |
   | Onay Orani | `%{Math.round(approvalRate*100)}` | `{pendingActions} bekleyen onay` |
   | Kalite Skoru | `{qualityScore}/100` | `{feedback.total} degerlendirme` |
   | Asistan Turn | `{assistantTurnsTotal}` | `{conversations.total} sohbet` |

3. **Citation Breakdown** (3 satir, basit liste)
   - Herhangi citation: `outputsWithAnyCitation` / `outputsAnalyzed`
   - Dokuman citation: `outputsWithDocumentCitation` / `outputsAnalyzed`
   - Bilgi bankasi citation: `outputsWithKnowledgeCitation` / `outputsAnalyzed`
   Her satir progress bar ile (mevcut tool usage stiline benzer)

4. **Human Workflow** (compact stat row — 3 metric yan yana)
   - Onaylanan: `approvedActions` (yesil)
   - Reddedilen: `rejectedActions` (kirmizi)
   - Bekleyen: `pendingActions` (sari, pending > 0 ise vurgulu)

### 2e. Mock data + handler

**Dosya:** `src/mocks/data.ts` — `mockAgentMetrics` objesi (her sirket icin)
**Dosya:** `src/mocks/handlers.ts` — `GET /platform/companies/:id/agent-metrics` handler

Mock alert ornekleri:
- `low_citation_coverage` (warning, rate < 0.60)
- `pending_approval_backlog` (critical, 10+ bekleyen)

---

## 3. Data Sources UI (Yeni Ozellik)

### 3a. Sirket Detay — 6. Tab "Veri Kaynaklari"

**Yeni dosya:** `src/features/companies/components/data-sources-tab.tsx`

Props: `{ companyId: string }`

Hook: Mevcut `useCompanyDataSources(companyId)` + `useDataSourceTypes()`

**Ozet kartlari (3 adet, grid-cols-3, compact):**
| Kart | Deger | Hesaplama |
|------|-------|-----------|
| Toplam Kaynak | `data.total` | Direkt |
| Toplam Oge | toplam itemCount | `items.reduce((s, d) => s + d.itemCount, 0)` |
| Hatali | error count | `items.filter(d => d.status === 'error').length`, kirmizi > 0 |

**Tablo kolonlari:**
| Kolon | Deger | Not |
|-------|-------|----|
| Isim | `name` | — |
| Tip | `type` | `dataSourceTypes` ile label eslestir |
| Durum | `status` | Badge: active=yesil, syncing=mavi, paused=sari, error=kirmizi |
| Oge Sayisi | `itemCount` | — |
| Son Sync | `lastSyncAt` | Relative time veya "—" |
| Sonraki Sync | `nextSyncAt` | Tarih veya "—" |

Hata satiri: `status === 'error'` olan satirlarda `errorMessage` kirmizi text olarak satirin altinda gosterilir.

Bos durum: "Bu sirkete ait veri kaynagi bulunmuyor."

### 3b. CompanyDetailPage — Tab ekleme

**Dosya:** `src/features/companies/pages/company-detail-page.tsx`

```tsx
<TabsTrigger value="data-sources">Veri Kaynaklari</TabsTrigger>
<TabsContent value="data-sources">
  <DataSourcesTab companyId={id!} />
</TabsContent>
```

### 3c. Dashboard — 2 Data Source KPI Karti

**Dosya:** `src/features/dashboard/pages/dashboard-page.tsx`

Mevcut 4 KPI karti (grid-cols-4) -> 6 KPI karti (grid-cols-3, 2 satir).

2 yeni kart:
| Kart | Hook | Deger |
|------|------|-------|
| Aktif Crawler | `usePlatformDataSources({ status: 'active' })` | `data.total` |
| Hatali Kaynak | `usePlatformDataSources({ status: 'error' })` | `data.total`, kirmizi eger > 0 |

Her iki hook `staleTime: 60_000` ile cagrilir.

### 3d. Mock data kontrolu

`mockDataSources` ve `mockDataSourceTypes` mevcut (`mocks/data.ts`). Gerekirse:
- Farkli status'lu kaynaklar eklenmeli (en az 1 error, 1 syncing, 1 active)
- Error olan kaynakta `errorMessage` dolu olmali
- `mockDataSourceTypes`'tan `enabled`, `addedCount`, `maxSources` alanlari kaldirilmali (1a ile uyumlu)

---

## Etkilenen Dosyalar Ozeti

| Dosya | Degisiklik |
|-------|-----------|
| `src/features/companies/types.ts` | DataSourceType fix + AgentMetrics/AgentAlert tipleri ekle |
| `src/lib/validations.ts` | limitsConfig'ten 4 crawl alani kaldir |
| `src/lib/query-keys.ts` | agentMetrics key ekle |
| `src/features/companies/components/analytics-tab.tsx` | feedback labels + agent metrics section |
| `src/features/companies/components/data-sources-tab.tsx` | YENi DOSYA |
| `src/features/companies/pages/company-detail-page.tsx` | 6. tab ekle |
| `src/features/companies/hooks/use-agent-metrics.ts` | YENi DOSYA |
| `src/features/dashboard/pages/dashboard-page.tsx` | 2 data source KPI karti |
| `src/mocks/data.ts` | agent metrics mock + data source type fix |
| `src/mocks/handlers.ts` | agent-metrics handler |
| `src/features/companies/components/config-tab.tsx` | limitsConfig crawl form alanlari kaldir (satir 130-133) |
| `src/features/settings/pages/settings-page.tsx` | limitsConfig crawl form alanlari kaldir (satir 128-131) |
