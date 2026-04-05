# Pricing Plans & Dashboard Alignment Spec

Backend dokumanlarina (`docs/frontend-admin/08-pricing-plans.md`, `05-analytics.md`, `01-companies.md`) gore super admin frontend'inin hizalanmasi.

Ana degisiklik alanlari:
1. Pricing Plans CRUD + firma plan atama (tamamen yeni ozellik)
2. Revenue analitiagi (tamamen yeni)
3. Company tipi genisletme (plan iliskileri)
4. Dashboard KPI redesign (doküman hizalama)
5. Company table + header + dialog guncellemeleri

---

## 1. Pricing Plans — Yeni Ozellik

### Kaynak: `docs/frontend-admin/08-pricing-plans.md`

### 1a. Yeni Tipler

**Dosya:** `src/features/companies/types.ts`

```typescript
// ─── Pricing Plans ────────────────────────────────

export interface PricingPlan {
  id: string
  name: string
  slug: string
  description: string | null
  monthlyPriceTry: number | null       // null = kurumsal
  includedUsers: number
  extraUserPriceTry: number | null     // null = ek kullanici yok
  budgetUsd: number
  budgetDowngradeThresholdPct: number
  maxStorageGb: number
  maxFileSizeMb: number
  allowedModels: Array<{ id: string; label: string }>
  allowedTools: string[]               // ["*"] = tum toollar
  allowedConnectors: string[]
  crawlMaxPages: number
  crawlMaxSources: number
  isActive: boolean
  sortOrder: number
  companyCount: number                 // read-only, backend hesaplar
  createdAt: string
  updatedAt: string
}

export interface CreatePlanRequest {
  name: string
  slug: string
  description?: string
  monthlyPriceTry?: number | null
  includedUsers?: number
  extraUserPriceTry?: number | null
  budgetUsd?: number
  budgetDowngradeThresholdPct?: number
  maxStorageGb?: number
  maxFileSizeMb?: number
  allowedModels?: Array<{ id: string; label: string }>
  allowedTools?: string[]
  allowedConnectors?: string[]
  crawlMaxPages?: number
  crawlMaxSources?: number
  isActive?: boolean
  sortOrder?: number
}

export interface UpdatePlanRequest {
  name?: string
  description?: string | null
  monthlyPriceTry?: number | null
  includedUsers?: number
  extraUserPriceTry?: number | null
  budgetUsd?: number
  budgetDowngradeThresholdPct?: number
  maxStorageGb?: number
  maxFileSizeMb?: number
  allowedModels?: Array<{ id: string; label: string }>
  allowedTools?: string[]
  allowedConnectors?: string[]
  crawlMaxPages?: number
  crawlMaxSources?: number
  isActive?: boolean
  sortOrder?: number
}

export interface AssignPlanResponse {
  companyId: string
  planId: string | null
  planName: string | null
  pendingPlanId?: string | null
  pendingPlanName?: string | null
  action: 'upgraded' | 'downgrade_scheduled' | 'no_change' | 'removed'
  effective?: 'immediate' | 'next_cycle'
  effectiveDate?: string
  prorate?: { prorateTry: number | null }
}

export interface CancelDowngradeResponse {
  companyId: string
  pendingPlanId: null
  action: 'downgrade_cancelled'
}

export interface DeletePlanResponse {
  deactivated: boolean
  affectedCompanies: number
  warning?: string
}

// ─── Revenue ──────────────────────────────────────

export interface RevenueByPlan {
  planId: string
  planName: string
  planSlug: string
  companyCount: number
  userCount: number
  planMrrTry: number
  extraUserMrrTry: number
  totalMrrTry: number
}

export interface RevenueData {
  mrrTry: number
  mrrUsd: number
  exchangeRate: number
  exchangeRateSource: 'tcmb' | 'fallback'
  totalActiveCompanies: number
  totalCompanies: number
  totalActiveUsers: number
  byPlan: RevenueByPlan[]
  totalAiCostUsd: number
  marginTry: number
}
```

### 1b. Company Tipi Genisletme

**Dosya:** `src/features/companies/types.ts`

Mevcut:
```typescript
interface Company {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
```

Yeni:
```typescript
interface Company {
  id: string
  name: string
  logoUrl: string | null
  planId: string | null
  plan: { id: string; name: string; slug: string; monthlyPriceTry: number | null; includedUsers: number; isActive: boolean } | null
  pendingPlanId: string | null
  pendingPlan: { id: string; name: string; slug: string; monthlyPriceTry: number | null; includedUsers: number; isActive: boolean } | null
  downgradeScheduledAt: string | null
  createdAt: string
  updatedAt: string
}
```

Bu degisiklik su dosyalari etkiler:
- `company-table.tsx` — plan kolonu eklenmeli
- `company-header.tsx` — plan badge gostermeli
- `create-company-dialog.tsx` — planId secimi eklenmeli
- `mocks/data.ts` — mockCompanies plan alanlari eklenmeli
- `mocks/handlers.ts` — company response'lari plan icermeli

### 1c. Query Keys

**Dosya:** `src/lib/query-keys.ts`

```typescript
platform: {
  // ... mevcut keyler
  plans: ['platform', 'plans'] as const,
  planDetail: (id: string) => ['platform', 'plans', id] as const,
  revenue: ['platform', 'revenue'] as const,
},
companies: {
  // ... mevcut keyler
  plan: (id: string) => ['companies', id, 'plan'] as const,
}
```

### 1d. Hooks

**Yeni dosya:** `src/features/companies/hooks/use-pricing-plans.ts`

```typescript
usePricingPlans(includeInactive?: boolean)  // GET /platform/plans?includeInactive=
usePricingPlan(id: string)                  // GET /platform/plans/:id
useCreatePricingPlan()                       // POST /platform/plans
useUpdatePricingPlan(id: string)             // PATCH /platform/plans/:id
useDeletePricingPlan()                       // DELETE /platform/plans/:id
```

**Yeni dosya:** `src/features/companies/hooks/use-company-plan.ts`

```typescript
useAssignCompanyPlan(companyId: string)     // PUT /platform/companies/:id/plan
useCancelDowngrade(companyId: string)        // DELETE /platform/companies/:id/pending-plan
```

**Yeni dosya:** `src/features/dashboard/hooks/use-revenue.ts`

```typescript
useRevenue()  // GET /platform/revenue
```

### 1e. Utils — TRY Formatlama

**Dosya:** `src/lib/utils.ts`

```typescript
export function formatCurrencyTry(amount: number): string {
  return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 })
}
```

### 1f. Mock Data

**Dosya:** `src/mocks/data.ts`

**mockPricingPlans:**
```typescript
export const mockPricingPlans: PricingPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    slug: 'starter',
    description: 'Baslangic paketi',
    monthlyPriceTry: 599.00,
    includedUsers: 3,
    extraUserPriceTry: 99.00,
    budgetUsd: 10,
    budgetDowngradeThresholdPct: 80,
    maxStorageGb: 5,
    maxFileSizeMb: 25,
    allowedModels: [{ id: 'openai/gpt-4o-mini', label: 'GPT 4o Mini' }],
    allowedTools: ['search_knowledge_base', 'list_knowledge_categories'],
    allowedConnectors: ['website_crawler'],
    crawlMaxPages: 50,
    crawlMaxSources: 2,
    isActive: true,
    sortOrder: 0,
    companyCount: 4,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-28T00:00:00Z',
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    slug: 'pro',
    description: 'Profesyonel ozellikler',
    monthlyPriceTry: 299.00,  // NOTE: gercek uygulama icin 2990 olabilir
    includedUsers: 5,
    extraUserPriceTry: 49.00,
    budgetUsd: 25,
    budgetDowngradeThresholdPct: 80,
    maxStorageGb: 20,
    maxFileSizeMb: 50,
    allowedModels: [
      { id: 'openai/gpt-4o-mini', label: 'GPT 4o Mini' },
      { id: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    ],
    allowedTools: ['search_knowledge_base', 'list_knowledge_categories', 'search_drive_documents', 'search_templates', 'retrieve_template'],
    allowedConnectors: ['website_crawler'],
    crawlMaxPages: 100,
    crawlMaxSources: 5,
    isActive: true,
    sortOrder: 1,
    companyCount: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-28T00:00:00Z',
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Kurumsal ozellikler — iletisime gecin',
    monthlyPriceTry: null,
    includedUsers: 50,
    extraUserPriceTry: null,
    budgetUsd: 200,
    budgetDowngradeThresholdPct: 80,
    maxStorageGb: 100,
    maxFileSizeMb: 100,
    allowedModels: [],
    allowedTools: ['*'],
    allowedConnectors: ['website_crawler'],
    crawlMaxPages: 1000,
    crawlMaxSources: 20,
    isActive: true,
    sortOrder: 2,
    companyCount: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-28T00:00:00Z',
  },
]
```

**mockRevenue:**
```typescript
export const mockRevenue: RevenueData = {
  mrrTry: 15640.00,
  mrrUsd: 481.23,
  exchangeRate: 32.50,
  exchangeRateSource: 'tcmb',
  totalActiveCompanies: 14,
  totalCompanies: 18,
  totalActiveUsers: 52,
  byPlan: [
    { planId: 'plan-pro', planName: 'Pro', planSlug: 'pro', companyCount: 10, userCount: 38, planMrrTry: 2990.00, extraUserMrrTry: 9510.00, totalMrrTry: 12500.00 },
    { planId: 'plan-starter', planName: 'Starter', planSlug: 'starter', companyCount: 4, userCount: 14, planMrrTry: 2396.00, extraUserMrrTry: 744.00, totalMrrTry: 3140.00 },
  ],
  totalAiCostUsd: 134.75,
  marginTry: 11261.56,
}
```

**mockCompanies guncelleme:**
Her sirketin `planId`, `plan`, `pendingPlanId`, `pendingPlan`, `downgradeScheduledAt`, `logoUrl` alanlari eklenmeli. Ornekler:
- Firma Alpha -> plan-pro, pendingPlan: null
- Tech Beta -> plan-starter, pendingPlan: null
- CloudNine AI -> plan-pro, pendingPlanId: plan-starter (scheduled downgrade ornegi)
- Bazi sirketler -> planId: null (plansiz)

### 1g. MSW Handlers

**Dosya:** `src/mocks/handlers.ts`

Eklenecek handler'lar:
- `GET /platform/plans` — `?includeInactive` destegi
- `POST /platform/plans` — plan olustur
- `GET /platform/plans/:id` — plan detay
- `PATCH /platform/plans/:id` — plan guncelle (slug immutable)
- `DELETE /platform/plans/:id` — soft delete (isActive = false)
- `PUT /platform/companies/:id/plan` — plan ata (upgrade/downgrade logic)
- `DELETE /platform/companies/:id/pending-plan` — cancel downgrade
- `GET /platform/revenue` — gelir analitiagi

Mevcut `GET /platform/companies` handler'i: company response'una plan iliskilerini ekle.
Mevcut `POST /platform/companies` handler'i: `planId` body parametresi destegi.

---

## 2. Dashboard KPI Redesign

### Kaynak: `05-analytics.md` > UI Onerileri > Dashboard

**Dosya:** `src/features/dashboard/pages/dashboard-page.tsx`

### Mevcut KPI kartlari (6):
1. Toplam Sirket
2. Toplam Maliyet
3. AI Token
4. Storage
5. Aktif Crawler
6. Hatali Kaynak

### Yeni KPI kartlari (6) — dokumana hizali:
| Kart | Deger | Kaynak |
|------|-------|--------|
| Toplam Sirket | `revenue.totalCompanies` | revenue endpoint |
| Bu Ayin Maliyeti | `formatCurrency(current.totalCostUsd)` | usage summary |
| Aktif Kullanicilar | `revenue.totalActiveUsers` | revenue endpoint |
| Memnuniyet Orani | `%XX` | **Yeni** platform analytics ozet (asagida aciklama) |
| MRR | `formatCurrencyTry(revenue.mrrTry)` + alt satirda `formatCurrency(revenue.mrrUsd)` | revenue endpoint |
| Brut Kar | `formatCurrencyTry(revenue.marginTry)` | revenue endpoint |

### Platform Memnuniyet Orani

Platform geneli memnuniyet icin ayri endpoint yok. Mevcut `usePlatformSummary` usage dondurur ama analytics dondurmez.

**Cozum:** Dashboard'da tum sirketlerin analytics'ini cekip ortalamak performans sorunu yaratir. Bunun yerine:
- Dashboard'da memnuniyet karti icin basit bir hesaplama: bunu mock'layacagiz. `getPlatformSummary` fonksiyonuna `satisfactionRate` alani ekleyelim. Backend'de de bu endpointte bunu dondurmesi beklenir (veya ayri bir endpoint yapilir).
- Mock'ta: tum sirket analytics'lerinden ortalama satisfactionRate hesaplariz.

**Dosya:** `src/mocks/data.ts` — `getPlatformSummary` fonksiyonuna `satisfactionRate` ve `totalActiveUsers` ekle
**Dosya:** `src/features/dashboard/hooks/use-platform-summary.ts` — PlatformSummary tipine bu alanlari ekle

### Dashboard — Gelir Ozeti Section

Mevcut 2 chart'in altina yeni section:

**"Gelir Ozeti" bolumu:**
- 3 KPI karti yan yana: MRR (TRY), MRR (USD), Kar Marji (TRY)
- Kur bilgisi: `1 USD = {exchangeRate} TRY ({exchangeRateSource})`
- Plan bazli gelir tablosu:
  | Plan | Firma | Kullanici | Baz MRR | Ek Kullanici MRR | Toplam MRR |
  |------|-------|-----------|---------|-----------------|------------|
  | Pro | 10 | 38 | 2.990 TRY | 9.510 TRY | 12.500 TRY |

**Yeni bilesenler:**
- `src/features/dashboard/components/revenue-summary.tsx` — Gelir ozet karti + plan tablosu

---

## 3. Company Table — Plan Kolonu

### Kaynak: `01-companies.md` > UI Onerileri

**Dosya:** `src/features/companies/components/company-table.tsx`

Mevcut kolonlar: Sirket Adi, Olusturulma, AI, CDN, Storage, Trigger, Toplam

Yeni kolonlar (dokumana hizali): Sirket Adi, **Plan**, Olusturulma, Toplam Maliyet
- Maliyet alt-kategorileri (AI/CDN/Storage/Trigger) kaldirilip sadece Toplam kalir — tablo sadelesir
- Plan kolonu: plan?.name badge'i gosterir. Null ise "—". Pending downgrade varsa kucuk uyari ikonu.

---

## 4. Company Detail — Plan Tab

### Kaynak: `08-pricing-plans.md` > UI Tasarim Onerisi > Firma Detay

**Yeni dosya:** `src/features/companies/components/plan-tab.tsx`

Props: `{ companyId: string, company: Company }`

**Icerik:**

1. **Aktif Plan Karti**
   - Plan adi, slug, fiyat
   - Dahil kullanici, AI butcesi, depolama
   - Eger pendingPlanId varsa: sari uyari banner + hedef plan adi + `downgradeScheduledAt` tarihi + "Iptal Et" butonu

2. **Plan Degistir**
   - Dropdown: tum aktif planlar (`usePricingPlans()`)
   - "Kaydet" butonu
   - Upgrade: anlik gecis + prorate bilgisi toast
   - Downgrade: "Bir sonraki donemde gecer" uyarisi + onay dialog

3. **Plan Kaldir**
   - `planId: null` gondermek icin buton
   - "Firma plansiz hale gelecek, saf config moduna donecek" uyarisi

**Dosya:** `src/features/companies/pages/company-detail-page.tsx`
- 7. tab olarak "Plan" eklenir (Usage ve Analytics arasina)

---

## 5. Settings — Fiyatlandirma Planlari Section

### Kaynak: `08-pricing-plans.md` > UI Tasarim Onerisi > Plan Listesi / Detay

**Yeni dosya:** `src/features/settings/components/pricing-plans-section.tsx`

SettingsNav'a yeni item: `{ key: 'pricingPlans', label: 'Fiyatlandirma', icon: '💎' }` — en basa

**Icerik:**

1. **Plan Listesi Tablosu**
   | Kolon | Deger |
   |-------|-------|
   | Isim | `name` |
   | Slug | `slug` (badge) |
   | Fiyat | `monthlyPriceTry` veya "Kurumsal" |
   | Dahil Kullanici | `includedUsers` |
   | Depolama | `maxStorageGb` GB |
   | Firma | `companyCount` |
   | Durum | `isActive` — badge |

   Satira tiklaninca detay/edit dialog acilir.
   "Yeni Plan" butonu.

2. **Plan Olustur/Duzenle Dialog**
   Tek dialog, mode: create | edit

   **Temel Bilgiler:**
   - Isim (zorunlu)
   - Slug (zorunlu, sadece create'te editable, edit'te disabled)
   - Aciklama (opsiyonel)
   - Aylik Fiyat TRY (bos = kurumsal)
   - Dahil Kullanici
   - Ekstra Kullanici Fiyat TRY (bos = ek kullanici yok)

   **Limitler:**
   - AI Butcesi USD
   - Butce Uyari Esigi %
   - Maks Depolama GB
   - Maks Dosya Boyutu MB
   - Crawler Maks Sayfa
   - Crawler Maks Kaynak

   **Tool'lar:**
   - Checkbox listesi (`registeredTools`'tan)
   - "Tumu" wildcard checkbox (isareti: `["*"]`)

   **Modeller:**
   - Mevcut `AllowedModelsEditor` bilesenini kullan
   - `usePlatformModels()` ile model listesi

   **Connector'lar:**
   - Checkbox listesi (`dataSourceTypes`'tan)

   **Siralama & Durum:**
   - Sort Order (number)
   - Aktif toggle

3. **Plan Silme**
   - Dialog icinde "Deaktif Et" butonu (sadece edit modda)
   - `affectedCompanies > 0` ise uyari mesaji goster
   - Hard delete degil, isActive = false

**settings-page.tsx:**
- `activeSection === 'pricingPlans'` durumunda `<PricingPlansSection />` render et

**settings-nav.tsx:**
- NAV_ITEMS'a `pricingPlans` ekle (pricingConfig'den once)

---

## 6. CreateCompanyDialog — Plan Secimi

### Kaynak: `01-companies.md` > POST /platform/companies

**Dosya:** `src/features/companies/components/create-company-dialog.tsx`

Mevcut: sadece `name` alir.
Yeni: `planId` opsiyonel select ekle — `usePricingPlans()` ile plan listesi

**Dosya:** `src/features/companies/hooks/use-companies.ts`

`useCreateCompany` mutasyonu: `name: string` yerine `{ name: string; planId?: string }` kabul etmeli.

---

## 7. CompanyHeader — Plan Badge

**Dosya:** `src/features/companies/components/company-header.tsx`

Sirket adi yaninda plan badge'i:
- `company.plan?.name` varsa `<Badge>Pro</Badge>` seklinde
- Pending downgrade varsa `<Badge variant="outline" className="border-yellow-500">Starter'a geciyor</Badge>`
- Plan yoksa gosterme

---

## Etkilenen Dosyalar Ozeti

| Dosya | Degisiklik |
|-------|-----------|
| `src/features/companies/types.ts` | PricingPlan, Revenue tipleri + Company genisletme |
| `src/lib/query-keys.ts` | plans, planDetail, revenue, company plan keys |
| `src/lib/utils.ts` | `formatCurrencyTry` fonksiyonu |
| `src/mocks/data.ts` | mockPricingPlans, mockRevenue, mockCompanies plan alanlari |
| `src/mocks/handlers.ts` | 8 yeni handler + mevcut company handler'lari guncelle |
| `src/features/companies/hooks/use-pricing-plans.ts` | YENi DOSYA — plan CRUD hooks |
| `src/features/companies/hooks/use-company-plan.ts` | YENi DOSYA — plan atama hooks |
| `src/features/dashboard/hooks/use-revenue.ts` | YENi DOSYA — revenue hook |
| `src/features/dashboard/hooks/use-platform-summary.ts` | satisfactionRate, totalActiveUsers ekle |
| `src/features/dashboard/pages/dashboard-page.tsx` | KPI kartlari redesign + revenue hook |
| `src/features/dashboard/components/revenue-summary.tsx` | YENi DOSYA — gelir ozet section |
| `src/features/companies/components/company-table.tsx` | Plan kolonu ekle, maliyet kolonlarini sadece toplama indir |
| `src/features/companies/components/company-header.tsx` | Plan badge |
| `src/features/companies/components/create-company-dialog.tsx` | planId select |
| `src/features/companies/components/plan-tab.tsx` | YENi DOSYA — firma plan yonetim tab'i |
| `src/features/companies/pages/company-detail-page.tsx` | Plan tab ekle |
| `src/features/companies/hooks/use-companies.ts` | createCompany planId destegi |
| `src/features/settings/components/pricing-plans-section.tsx` | YENi DOSYA — plan CRUD UI |
| `src/features/settings/components/settings-nav.tsx` | pricingPlans nav item |
| `src/features/settings/pages/settings-page.tsx` | pricingPlans section render |
